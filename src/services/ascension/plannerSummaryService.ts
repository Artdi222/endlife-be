import pool from "../../db/index.js";
import type {
  PlannerSummary,
  SummaryMaterial,
} from "../../types/index.js";

/**
 * Service for calculating the overall planner summary
 */

// GET FULL PLANNER SUMMARY
export const getPlannerSummary = async (
  userId: number,
): Promise<PlannerSummary> => {
  const materialsResult = await pool.query<SummaryMaterial>(
    `WITH
      -- 1. Character ascension materials
      char_asc_mats AS (
        SELECT ar.item_id, SUM(ar.quantity)::BIGINT AS qty
        FROM user_characters uc
        JOIN ascension_stages ast
          ON  ast.entity_type  = 'character'
          AND ast.entity_id    = uc.character_id
          AND ast.stage_number >  uc.current_ascension_stage
          AND ast.stage_number <= uc.target_ascension_stage
        JOIN ascension_requirements ar ON ar.stage_id = ast.id
        WHERE uc.user_id = $1
        GROUP BY ar.item_id
      ),
      -- 2. Weapon ascension materials
      weapon_asc_mats AS (
        SELECT ar.item_id, SUM(ar.quantity)::BIGINT AS qty
        FROM user_weapons uw
        JOIN ascension_stages ast
          ON  ast.entity_type  = 'weapon'
          AND ast.entity_id    = uw.weapon_id
          AND ast.stage_number >  uw.current_ascension_stage
          AND ast.stage_number <= uw.target_ascension_stage
        JOIN ascension_requirements ar ON ar.stage_id = ast.id
        WHERE uw.user_id = $1
        GROUP BY ar.item_id
      ),
      -- 3. Skill level materials
      skill_mats AS (
        SELECT slr.item_id, SUM(slr.quantity)::BIGINT AS qty
        FROM user_characters uc
        JOIN user_character_skills ucs ON ucs.user_character_id = uc.id
        JOIN skill_levels sl
          ON  sl.skill_id = ucs.skill_id
          AND sl.level    >  ucs.current_level
          AND sl.level    <= ucs.target_level
        JOIN skill_level_requirements slr ON slr.skill_level_id = sl.id
        WHERE uc.user_id = $1
        GROUP BY slr.item_id
      ),
      -- 4. Union and re-aggregate
      all_mats AS (
        SELECT item_id, SUM(qty)::BIGINT AS total_needed
        FROM (
          SELECT * FROM char_asc_mats
          UNION ALL SELECT * FROM weapon_asc_mats
          UNION ALL SELECT * FROM skill_mats
        ) combined
        GROUP BY item_id
      )
    SELECT
      i.id                                                                      AS item_id,
      i.name,
      i.image,
      i.category,
      am.total_needed::INTEGER                                                  AS total_needed,
      COALESCE(ui.quantity, 0)                                                  AS have,
      GREATEST(0, am.total_needed - COALESCE(ui.quantity, 0))::INTEGER          AS remaining
    FROM all_mats am
    JOIN items i ON i.id = am.item_id
    LEFT JOIN user_inventory ui
      ON ui.item_id = am.item_id AND ui.user_id = $1
    ORDER BY i.category, i.order_index, i.name`,
    [userId],
  );

  // Total credits
  const creditsResult = await pool.query<{ total: string }>(
    `SELECT (
      COALESCE((
        SELECT SUM(lc.credit_cost)
        FROM user_characters uc
        JOIN level_costs lc
          ON lc.entity_type = 'character'
          AND lc.level > uc.current_level
          AND lc.level <= uc.target_level
        WHERE uc.user_id = $1
      ), 0)
      +
      COALESCE((
        SELECT SUM(ast.credit_cost)
        FROM user_characters uc
        JOIN ascension_stages ast
          ON  ast.entity_type  = 'character'
          AND ast.entity_id    = uc.character_id
          AND ast.stage_number >  uc.current_ascension_stage
          AND ast.stage_number <= uc.target_ascension_stage
        WHERE uc.user_id = $1
      ), 0)
      +
      COALESCE((
        SELECT SUM(lc.credit_cost)
        FROM user_weapons uw
        JOIN level_costs lc
          ON lc.entity_type = 'weapon'
          AND lc.level > uw.current_level
          AND lc.level <= uw.target_level
        WHERE uw.user_id = $1
      ), 0)
      +
      COALESCE((
        SELECT SUM(ast.credit_cost)
        FROM user_weapons uw
        JOIN ascension_stages ast
          ON  ast.entity_type  = 'weapon'
          AND ast.entity_id    = uw.weapon_id
          AND ast.stage_number >  uw.current_ascension_stage
          AND ast.stage_number <= uw.target_ascension_stage
        WHERE uw.user_id = $1
      ), 0)
      +
      COALESCE((
        SELECT SUM(sl.credit_cost)
        FROM user_characters uc
        JOIN user_character_skills ucs ON ucs.user_character_id = uc.id
        JOIN skill_levels sl
          ON  sl.skill_id = ucs.skill_id
          AND sl.level    >  ucs.current_level
          AND sl.level    <= ucs.target_level
        WHERE uc.user_id = $1
      ), 0)
    )::TEXT AS total`,
    [userId],
  );

  // Total EXP
  const expResult = await pool.query<{ total: string }>(
    `SELECT (
      COALESCE((
        SELECT SUM(lc.exp_required)
        FROM user_characters uc
        JOIN level_costs lc
          ON lc.entity_type = 'character'
          AND lc.level > uc.current_level
          AND lc.level <= uc.target_level
        WHERE uc.user_id = $1
      ), 0)
      +
      COALESCE((
        SELECT SUM(lc.exp_required)
        FROM user_weapons uw
        JOIN level_costs lc
          ON lc.entity_type = 'weapon'
          AND lc.level > uw.current_level
          AND lc.level <= uw.target_level
        WHERE uw.user_id = $1
      ), 0)
    )::TEXT AS total`,
    [userId],
  );

  return {
    materials: materialsResult.rows,
    total_credits_needed: creditsResult.rows[0]?.total ?? "0",
    total_exp_needed: expResult.rows[0]?.total ?? "0",
  };
};
