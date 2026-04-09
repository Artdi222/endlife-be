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
   // 1. Fetch normal materials
  const materialsResult = await pool.query<SummaryMaterial>(
    `WITH
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

  // 2. Ascension credits
  const ascensionCreditsResult = await pool.query<{ total: string }>(
    `SELECT (
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
        SELECT SUM(ast.credit_cost)
        FROM user_weapons uw
        JOIN ascension_stages ast
          ON  ast.entity_type  = 'weapon'
          AND ast.entity_id    = uw.weapon_id
          AND ast.stage_number >  uw.current_ascension_stage
          AND ast.stage_number <= uw.target_ascension_stage
        WHERE uw.user_id = $1
      ), 0)
    )::TEXT AS total`,
    [userId],
  );

  // 3. Skill credits
  const skillCreditsResult = await pool.query<{ total: string }>(
    `SELECT COALESCE((
      SELECT SUM(sl.credit_cost)
      FROM user_characters uc
      JOIN user_character_skills ucs ON ucs.user_character_id = uc.id
      JOIN skill_levels sl
        ON  sl.skill_id = ucs.skill_id
        AND sl.level    >  ucs.current_level
        AND sl.level    <= ucs.target_level
      WHERE uc.user_id = $1
    ), 0)::TEXT AS total`,
    [userId],
  );

  // 4. Level-up EXP and Credits (split for characters)
  type ExpCounts = { char_exp_p1: string; char_exp_p2: string; weap_exp: string; char_lvl_cred: string; weap_lvl_cred: string; };
  const expResult = await pool.query<ExpCounts>(
    `SELECT
      -- Character Phase 1 EXP (Level 1-60)
      COALESCE((
        SELECT SUM(lc.exp_required)
        FROM user_characters uc
        JOIN level_costs lc ON lc.entity_type = 'character'
          AND lc.level > uc.current_level 
          AND lc.level <= LEAST(uc.target_level, 60)
        WHERE uc.user_id = $1
      ), 0)::TEXT AS char_exp_p1,
      
      -- Character Phase 2 EXP (Level 61-90)
      COALESCE((
        SELECT SUM(lc.exp_required)
        FROM user_characters uc
        JOIN level_costs lc ON lc.entity_type = 'character'
          AND lc.level > GREATEST(uc.current_level, 60)
          AND lc.level <= uc.target_level
        WHERE uc.user_id = $1
      ), 0)::TEXT AS char_exp_p2,
      
      -- Weapon total EXP (1-90 unified)
      COALESCE((
        SELECT SUM(lc.exp_required)
        FROM user_weapons uw
        JOIN level_costs lc ON lc.entity_type = 'weapon'
          AND lc.level > uw.current_level
          AND lc.level <= uw.target_level
        WHERE uw.user_id = $1
      ), 0)::TEXT AS weap_exp,
      
      -- Character level-up credits
      COALESCE((
        SELECT SUM(lc.credit_cost)
        FROM user_characters uc
        JOIN level_costs lc ON lc.entity_type = 'character'
          AND lc.level > uc.current_level
          AND lc.level <= uc.target_level
        WHERE uc.user_id = $1
      ), 0)::TEXT AS char_lvl_cred,

      -- Weapon level-up credits
      COALESCE((
        SELECT SUM(lc.credit_cost)
        FROM user_weapons uw
        JOIN level_costs lc ON lc.entity_type = 'weapon'
          AND lc.level > uw.current_level
          AND lc.level <= uw.target_level
        WHERE uw.user_id = $1
      ), 0)::TEXT AS weap_lvl_cred
    `,
    [userId],
  );

  const stats = expResult.rows[0];

  const ascensionCredits = ascensionCreditsResult.rows[0]?.total ?? "0";
  const skillCredits = skillCreditsResult.rows[0]?.total ?? "0";
  const levelingCredits = String(BigInt(stats?.char_lvl_cred ?? 0) + BigInt(stats?.weap_lvl_cred ?? 0));
  
  const totalCredits = String(
    BigInt(ascensionCredits) + BigInt(skillCredits) + BigInt(levelingCredits)
  );

  const totalExp = String(
    BigInt(stats?.char_exp_p1 ?? 0) + BigInt(stats?.char_exp_p2 ?? 0) + BigInt(stats?.weap_exp ?? 0)
  );

  // 5. Expand EXP into specific items
  const expItemNames = [
    'Advanced Combat Record', 'Intermediate Combat Record', 'Elementary Combat Record',
    'Advanced Cognitive Carrier', 'Elementary Cognitive Carrier',
    'Arms INSP Set', 'Arms INSP Kit', 'Arms Inspector'
  ];

  const dbExpItems = await pool.query<{
    item_id: number; name: string; image: string; category: string; have: number;
  }>(
    `SELECT i.id as item_id, i.name, i.image, i.category, COALESCE(ui.quantity, 0) as have
     FROM items i
     LEFT JOIN user_inventory ui ON ui.item_id = i.id AND ui.user_id = $1
     WHERE i.name = ANY($2)`,
    [userId, expItemNames]
  );

  const itemsMap = new Map(dbExpItems.rows.map((row) => [row.name, row]));
  const formattedMaterials = [...materialsResult.rows];

  function pushItems(totalExpVal: number, config: { name: string; val: number }[]) {
    let remainder = totalExpVal;
    for (let i = 0; i < config.length; i++) {
      if (remainder <= 0) break;
      const { name, val } = config[i];
      const itemRow = itemsMap.get(name);
      if (!itemRow) continue;

      let count = 0;
      if (i === config.length - 1) {
        count = Math.ceil(remainder / val); // Last item takes the remainder ceiling
        remainder = 0;
      } else {
        count = Math.floor(remainder / val);
        remainder -= count * val;
      }

      if (count > 0) {
        // Find if we already pushed this item (weapons and chars might overlap? No, they use diff items, but just in case)
        const existIdx = formattedMaterials.findIndex(m => m.item_id === itemRow.item_id);
        if (existIdx >= 0) {
          formattedMaterials[existIdx].total_needed += count;
          formattedMaterials[existIdx].remaining = Math.max(0, formattedMaterials[existIdx].total_needed - formattedMaterials[existIdx].have);
        } else {
          formattedMaterials.push({
            item_id: itemRow.item_id,
            name: itemRow.name,
            image: itemRow.image,
            category: itemRow.category,
            total_needed: count,
            have: itemRow.have,
            remaining: Math.max(0, count - itemRow.have),
          });
        }
      }
    }
  }

  pushItems(Number(stats?.char_exp_p1 ?? 0), [
    { name: 'Advanced Combat Record', val: 10000 },
    { name: 'Intermediate Combat Record', val: 1000 },
    { name: 'Elementary Combat Record', val: 200 }
  ]);

  pushItems(Number(stats?.char_exp_p2 ?? 0), [
    { name: 'Advanced Cognitive Carrier', val: 10000 },
    { name: 'Elementary Cognitive Carrier', val: 1000 }
  ]);

  pushItems(Number(stats?.weap_exp ?? 0), [
    { name: 'Arms INSP Set', val: 10000 },
    { name: 'Arms INSP Kit', val: 1000 },
    { name: 'Arms Inspector', val: 200 }
  ]);

  return {
    materials: formattedMaterials,
    total_credits_needed: totalCredits,
    total_exp_needed: totalExp,
    credits_breakdown: {
      ascension: ascensionCredits,
      skills: skillCredits,
      leveling: levelingCredits,
    },
  };
};

