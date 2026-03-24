import pool from "../../db/index.js";
import { levelToStageNumber } from "./stageControllers.js";
import type {
  UserCharacter,
  UserCharacterWithDetails,
  UserCharacterSkill,
  UserCharacterSkillWithDetails,
  UserWeapon,
  UserWeaponWithDetails,
  UserInventoryItem,
  PlannerSummary,
  SummaryMaterial,
  AddUserCharacterDTO,
  UpdateUserCharacterDTO,
  AddUserWeaponDTO,
  UpdateUserWeaponDTO,
  UpdateUserCharacterSkillDTO,
  UpsertInventoryItemDTO,
} from "../../types/index.js";

// USER CHARACTERS

// GET ALL USER CHARACTERS
export const getUserCharacters = async (
  userId: number,
): Promise<UserCharacterWithDetails[]> => {
  try {
    const result = await pool.query<UserCharacterWithDetails>(
      `SELECT
        uc.*,
        c.name    AS character_name,
        c.icon    AS character_icon,
        c.rarity  AS character_rarity,
        c.element AS character_element,
        c.class   AS character_class
        FROM user_characters uc
        JOIN characters c ON c.id = uc.character_id
        WHERE uc.user_id = $1
        ORDER BY c.order_index, c.name`,
      [userId],
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting user characters:", error);
    throw error;
  }
};

// GET SINGLE USER CHARACTER BY ID
// Exported so routes can fetch a specific plan entry directly.
export const getUserCharacterById = async (
  id: number,
): Promise<UserCharacterWithDetails | null> => {
  try {
    const result = await pool.query<UserCharacterWithDetails>(
      `SELECT
        uc.*,
        c.name    AS character_name,
        c.icon    AS character_icon,
        c.rarity  AS character_rarity,
        c.element AS character_element,
        c.class   AS character_class
        FROM user_characters uc
        JOIN characters c ON c.id = uc.character_id
        WHERE uc.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error getting user character:", error);
    throw error;
  }
};

// ADD USER CHARACTER
// Auto-creates skill rows for the character so they're ready to plan.
// Accepts either stage numbers or levels (converts level → stage automatically).
export const addUserCharacter = async (
  userId: number,
  dto: AddUserCharacterDTO,
): Promise<UserCharacterWithDetails> => {
  try {
    let currentStage = dto.current_ascension_stage ?? 0;
    let targetStage = dto.target_ascension_stage ?? 9;

    if (
      dto.current_ascension_stage === undefined &&
      dto.current_level !== undefined
    ) {
      currentStage =
        (await levelToStageNumber(
          "character",
          dto.character_id,
          dto.current_level,
        )) ?? 0;
    }
    if (
      dto.target_ascension_stage === undefined &&
      dto.target_level !== undefined
    ) {
      targetStage =
        (await levelToStageNumber(
          "character",
          dto.character_id,
          dto.target_level,
        )) ?? 9;
    }

    const result = await pool.query<UserCharacter>(
      `INSERT INTO user_characters
        (user_id, character_id, current_level, target_level,
          current_ascension_stage, target_ascension_stage)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, character_id)
          DO UPDATE SET
            current_level           = EXCLUDED.current_level,
            target_level            = EXCLUDED.target_level,
            current_ascension_stage = EXCLUDED.current_ascension_stage,
            target_ascension_stage  = EXCLUDED.target_ascension_stage
       RETURNING *`,
      [
        userId,
        dto.character_id,
        dto.current_level ?? 1,
        dto.target_level ?? 90,
        currentStage,
        targetStage,
      ],
    );

    const uc = result.rows[0];

    // Auto-seed skill rows (current 1 → target 12) — do nothing on conflict
    await pool.query(
      `INSERT INTO user_character_skills (user_character_id, skill_id, current_level, target_level)
        SELECT $1, s.id, 1, 1
        FROM skills s
        WHERE s.character_id = $2
        ON CONFLICT (user_character_id, skill_id) DO NOTHING`,
      [uc.id, dto.character_id],
    );

    return (await getUserCharacterById(uc.id))!;
  } catch (error) {
    console.error("Error adding user character:", error);
    throw error;
  }
};

// UPDATE USER CHARACTER
export const updateUserCharacter = async (
  userCharacterId: number,
  userId: number,
  dto: UpdateUserCharacterDTO,
): Promise<UserCharacterWithDetails | null> => {
  try {
    const ownerCheck = await pool.query<{ character_id: number }>(
      `SELECT character_id FROM user_characters WHERE id = $1 AND user_id = $2`,
      [userCharacterId, userId],
    );
    if (!ownerCheck.rows[0]) return null;

    const characterId = ownerCheck.rows[0].character_id;
    const updates: Record<string, unknown> = { ...dto };

    if (
      dto.current_ascension_stage === undefined &&
      dto.current_level !== undefined
    ) {
      updates.current_ascension_stage =
        (await levelToStageNumber(
          "character",
          characterId,
          dto.current_level,
        )) ?? 0;
    }
    if (
      dto.target_ascension_stage === undefined &&
      dto.target_level !== undefined
    ) {
      updates.target_ascension_stage =
        (await levelToStageNumber(
          "character",
          characterId,
          dto.target_level,
        )) ?? 9;
    }

    const fields = Object.entries(updates).filter(([, v]) => v !== undefined);
    if (fields.length === 0) return getUserCharacterById(userCharacterId);

    const setClauses = fields
      .map(([key], i) => `"${key}" = $${i + 2}`)
      .join(", ");
    const values = fields.map(([, v]) => v);

    await pool.query(`UPDATE user_characters SET ${setClauses} WHERE id = $1`, [
      userCharacterId,
      ...values,
    ]);
    return getUserCharacterById(userCharacterId);
  } catch (error) {
    console.error("Error updating user character:", error);
    throw error;
  }
};

// REMOVE USER CHARACTER
// Cascades to user_character_skills via ON DELETE CASCADE.
export const removeUserCharacter = async (
  userCharacterId: number,
  userId: number,
): Promise<boolean> => {
  try {
    const result = await pool.query(
      `DELETE FROM user_characters WHERE id = $1 AND user_id = $2`,
      [userCharacterId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error removing user character:", error);
    throw error;
  }
};

// USER CHARACTER SKILLS

// GET ALL SKILLS FOR A USER CHARACTER
export const getUserCharacterSkills = async (
  userCharacterId: number,
  userId: number,
): Promise<UserCharacterSkillWithDetails[]> => {
  try {
    const result = await pool.query<UserCharacterSkillWithDetails>(
      `SELECT
        ucs.*,
        s.name        AS skill_name,
        s.type        AS skill_type,
        s.icon        AS skill_icon,
        s.order_index AS skill_order_index
        FROM user_character_skills ucs
        JOIN skills s ON s.id = ucs.skill_id
        JOIN user_characters uc ON uc.id = ucs.user_character_id
        WHERE ucs.user_character_id = $1 AND uc.user_id = $2
        ORDER BY s.order_index, s.id`,
      [userCharacterId, userId],
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting user character skills:", error);
    throw error;
  }
};

// UPDATE USER CHARACTER SKILL
export const updateUserCharacterSkill = async (
  userCharacterSkillId: number,
  userId: number,
  dto: UpdateUserCharacterSkillDTO,
): Promise<UserCharacterSkill | null> => {
  try {
    const ownerCheck = await pool.query(
      `SELECT ucs.id FROM user_character_skills ucs
        JOIN user_characters uc ON uc.id = ucs.user_character_id
        WHERE ucs.id = $1 AND uc.user_id = $2`,
      [userCharacterSkillId, userId],
    );
    if (!ownerCheck.rows[0]) return null;

    const fields = Object.entries(dto).filter(([, v]) => v !== undefined);
    if (fields.length === 0) {
      const r = await pool.query<UserCharacterSkill>(
        `SELECT * FROM user_character_skills WHERE id = $1`,
        [userCharacterSkillId],
      );
      return r.rows[0] ?? null;
    }

    const setClauses = fields
      .map(([key], i) => `"${key}" = $${i + 2}`)
      .join(", ");
    const values = fields.map(([, v]) => v);

    const result = await pool.query<UserCharacterSkill>(
      `UPDATE user_character_skills SET ${setClauses} WHERE id = $1 RETURNING *`,
      [userCharacterSkillId, ...values],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error updating user character skill:", error);
    throw error;
  }
};

// USER WEAPONS

// GET ALL USER WEAPONS
export const getUserWeapons = async (
  userId: number,
): Promise<UserWeaponWithDetails[]> => {
  try {
    const result = await pool.query<UserWeaponWithDetails>(
      `SELECT
        uw.*,
        w.name   AS weapon_name,
        w.icon   AS weapon_icon,
        w.rarity AS weapon_rarity,
        w.type   AS weapon_type
        FROM user_weapons uw
        JOIN weapons w ON w.id = uw.weapon_id
        WHERE uw.user_id = $1
        ORDER BY w.order_index, w.name`,
      [userId],
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting user weapons:", error);
    throw error;
  }
};

// GET SINGLE USER WEAPON BY ID
export const getUserWeaponById = async (
  id: number,
): Promise<UserWeaponWithDetails | null> => {
  try {
    const result = await pool.query<UserWeaponWithDetails>(
      `SELECT
        uw.*,
        w.name   AS weapon_name,
        w.icon   AS weapon_icon,
        w.rarity AS weapon_rarity,
        w.type   AS weapon_type
        FROM user_weapons uw
        JOIN weapons w ON w.id = uw.weapon_id
        WHERE uw.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error getting user weapon:", error);
    throw error;
  }
};

// ADD USER WEAPON
export const addUserWeapon = async (
  userId: number,
  dto: AddUserWeaponDTO,
): Promise<UserWeaponWithDetails> => {
  try {
    let currentStage = dto.current_ascension_stage ?? 0;
    let targetStage = dto.target_ascension_stage ?? 9;

    if (
      dto.current_ascension_stage === undefined &&
      dto.current_level !== undefined
    ) {
      currentStage =
        (await levelToStageNumber(
          "weapon",
          dto.weapon_id,
          dto.current_level,
        )) ?? 0;
    }
    if (
      dto.target_ascension_stage === undefined &&
      dto.target_level !== undefined
    ) {
      targetStage =
        (await levelToStageNumber("weapon", dto.weapon_id, dto.target_level)) ??
        9;
    }

    const result = await pool.query<UserWeapon>(
      `INSERT INTO user_weapons
        (user_id, weapon_id, current_level, target_level,
          current_ascension_stage, target_ascension_stage)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, weapon_id)
          DO UPDATE SET
            current_level           = EXCLUDED.current_level,
            target_level            = EXCLUDED.target_level,
            current_ascension_stage = EXCLUDED.current_ascension_stage,
            target_ascension_stage  = EXCLUDED.target_ascension_stage
       RETURNING *`,
      [
        userId,
        dto.weapon_id,
        dto.current_level ?? 1,
        dto.target_level ?? 90,
        currentStage,
        targetStage,
      ],
    );
    return (await getUserWeaponById(result.rows[0].id))!;
  } catch (error) {
    console.error("Error adding user weapon:", error);
    throw error;
  }
};

// UPDATE USER WEAPON
export const updateUserWeapon = async (
  userWeaponId: number,
  userId: number,
  dto: UpdateUserWeaponDTO,
): Promise<UserWeaponWithDetails | null> => {
  try {
    const ownerCheck = await pool.query<{ weapon_id: number }>(
      `SELECT weapon_id FROM user_weapons WHERE id = $1 AND user_id = $2`,
      [userWeaponId, userId],
    );
    if (!ownerCheck.rows[0]) return null;

    const weaponId = ownerCheck.rows[0].weapon_id;
    const updates: Record<string, unknown> = { ...dto };

    if (
      dto.current_ascension_stage === undefined &&
      dto.current_level !== undefined
    ) {
      updates.current_ascension_stage =
        (await levelToStageNumber("weapon", weaponId, dto.current_level)) ?? 0;
    }
    if (
      dto.target_ascension_stage === undefined &&
      dto.target_level !== undefined
    ) {
      updates.target_ascension_stage =
        (await levelToStageNumber("weapon", weaponId, dto.target_level)) ?? 9;
    }

    const fields = Object.entries(updates).filter(([, v]) => v !== undefined);
    if (fields.length === 0) return getUserWeaponById(userWeaponId);

    const setClauses = fields
      .map(([key], i) => `"${key}" = $${i + 2}`)
      .join(", ");
    const values = fields.map(([, v]) => v);

    await pool.query(`UPDATE user_weapons SET ${setClauses} WHERE id = $1`, [
      userWeaponId,
      ...values,
    ]);
    return getUserWeaponById(userWeaponId);
  } catch (error) {
    console.error("Error updating user weapon:", error);
    throw error;
  }
};

// REMOVE USER WEAPON
export const removeUserWeapon = async (
  userWeaponId: number,
  userId: number,
): Promise<boolean> => {
  try {
    const result = await pool.query(
      `DELETE FROM user_weapons WHERE id = $1 AND user_id = $2`,
      [userWeaponId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error removing user weapon:", error);
    throw error;
  }
};

// INVENTORY

// GET ALL INVENTORY ITEMS
export const getUserInventory = async (
  userId: number,
): Promise<UserInventoryItem[]> => {
  try {
    const result = await pool.query<UserInventoryItem>(
      `SELECT
        ui.*,
        i.name        AS item_name,
        i.image       AS item_image,
        i.category    AS item_category,
        i.exp_value   AS item_exp_value,
        i.order_index AS item_order_index
        FROM user_inventory ui
        JOIN items i ON i.id = ui.item_id
        WHERE ui.user_id = $1
        ORDER BY i.category, i.order_index, i.name`,
      [userId],
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting user inventory:", error);
    throw error;
  }
};

// GET SINGLE INVENTORY ITEM BY ITEM ID
export const getInventoryItem = async (
  userId: number,
  itemId: number,
): Promise<UserInventoryItem | null> => {
  try {
    const result = await pool.query<UserInventoryItem>(
      `SELECT
        ui.*,
        i.name        AS item_name,
        i.image       AS item_image,
        i.category    AS item_category,
        i.exp_value   AS item_exp_value,
        i.order_index AS item_order_index
        FROM user_inventory ui
        JOIN items i ON i.id = ui.item_id
        WHERE ui.user_id = $1 AND ui.item_id = $2`,
      [userId, itemId],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error getting inventory item:", error);
    throw error;
  }
};

// UPSERT INVENTORY ITEM
export const upsertInventoryItem = async (
  userId: number,
  itemId: number,
  dto: UpsertInventoryItemDTO,
): Promise<UserInventoryItem> => {
  try {
    await pool.query(
      `INSERT INTO user_inventory (user_id, item_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, item_id)
        DO UPDATE SET quantity = EXCLUDED.quantity`,
      [userId, itemId, dto.quantity],
    );
    return (await getInventoryItem(userId, itemId))!;
  } catch (error) {
    console.error("Error upserting inventory item:", error);
    throw error;
  }
};

// BULK UPSERT INVENTORY
// Update many items at once — useful for a full inventory sync flow.
export const bulkUpsertInventory = async (
  userId: number,
  items: Array<{ item_id: number; quantity: number }>,
): Promise<UserInventoryItem[]> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const { item_id, quantity } of items) {
      await client.query(
        `INSERT INTO user_inventory (user_id, item_id, quantity)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, item_id)
          DO UPDATE SET quantity = EXCLUDED.quantity`,
        [userId, item_id, quantity],
      );
    }
    await client.query("COMMIT");
    return getUserInventory(userId);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error bulk upserting inventory:", error);
    throw error;
  } finally {
    client.release();
  }
};

// REMOVE INVENTORY ITEM
// Hard delete — removes the row. Use upsertInventoryItem with quantity 0
// if you want to keep the row but zero it out instead.
export const removeInventoryItem = async (
  userId: number,
  itemId: number,
): Promise<boolean> => {
  try {
    const result = await pool.query(
      `DELETE FROM user_inventory WHERE user_id = $1 AND item_id = $2`,
      [userId, itemId],
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error removing inventory item:", error);
    throw error;
  }
};

// PLANNER SUMMARY

// GET FULL PLANNER SUMMARY
// Aggregates ALL materials needed across:
//   • character ascension stages  (current_stage → target_stage)
//   • weapon ascension stages
//   • skill level upgrades         (current_level → target_level)
// Subtracts user-owned inventory. Returns aggregated material list
// plus total credit and EXP costs.
export const getPlannerSummary = async (
  userId: number,
): Promise<PlannerSummary> => {
  try {
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

    // Total credits: per-level costs + one-time breakthrough unlock costs + skill upgrades
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

    // Total EXP: per-level costs only (no breakthroughs, no skills)
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
  } catch (error) {
    console.error("Error getting planner summary:", error);
    throw error;
  }
};
