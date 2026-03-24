import pool from "../../db/index.js";
import type {
  SkillLevel,
  SkillLevelWithRequirements,
  SkillLevelRequirement,
  CreateSkillLevelDTO,
  UpdateSkillLevelDTO,
  CreateSkillLevelRequirementDTO,
} from "../../types/index.js";

// SKILL LEVELS

// GET ALL LEVELS FOR A SKILL
export const getSkillLevels = async (
  skillId: number,
): Promise<SkillLevelWithRequirements[]> => {
  try {
    const levelsResult = await pool.query<SkillLevel>(
      `SELECT * FROM skill_levels WHERE skill_id = $1 ORDER BY level`,
      [skillId],
    );
    if (levelsResult.rows.length === 0) return [];

    const levelIds = levelsResult.rows.map((l) => l.id);

    const reqResult = await pool.query<SkillLevelRequirement>(
      `SELECT
        slr.id, slr.skill_level_id, slr.item_id, slr.quantity,
        i.name     AS item_name,
        i.image    AS item_image,
        i.category AS item_category
        FROM skill_level_requirements slr
        JOIN items i ON i.id = slr.item_id
        WHERE slr.skill_level_id = ANY($1)
        ORDER BY i.order_index, i.name`,
      [levelIds],
    );

    const reqByLevel = new Map<number, SkillLevelRequirement[]>();
    for (const req of reqResult.rows) {
      const list = reqByLevel.get(req.skill_level_id) ?? [];
      list.push(req);
      reqByLevel.set(req.skill_level_id, list);
    }

    return levelsResult.rows.map((level) => ({
      ...level,
      requirements: reqByLevel.get(level.id) ?? [],
    }));
  } catch (error) {
    console.error("Error getting skill levels:", error);
    throw error;
  }
};

// GET SINGLE SKILL LEVEL BY ID 
export const getSkillLevelById = async (
  id: number,
): Promise<SkillLevelWithRequirements | null> => {
  try {
    const levelResult = await pool.query<SkillLevel>(
      `SELECT * FROM skill_levels WHERE id = $1`,
      [id],
    );
    if (!levelResult.rows[0]) return null;

    const level = levelResult.rows[0];

    const reqResult = await pool.query<SkillLevelRequirement>(
      `SELECT
        slr.id, slr.skill_level_id, slr.item_id, slr.quantity,
        i.name     AS item_name,
        i.image    AS item_image,
        i.category AS item_category
        FROM skill_level_requirements slr
        JOIN items i ON i.id = slr.item_id
        WHERE slr.skill_level_id = $1
        ORDER BY i.order_index, i.name`,
      [id],
    );

    return { ...level, requirements: reqResult.rows };
  } catch (error) {
    console.error("Error getting skill level:", error);
    throw error;
  }
};

// CREATE / UPSERT SKILL LEVEL 
// On conflict (same skill + level number) updates the credit_cost.
export const upsertSkillLevel = async (
  dto: CreateSkillLevelDTO,
): Promise<SkillLevel> => {
  try {
    const result = await pool.query<SkillLevel>(
      `INSERT INTO skill_levels (skill_id, level, credit_cost)
        VALUES ($1, $2, $3)
        ON CONFLICT (skill_id, level)
        DO UPDATE SET credit_cost = EXCLUDED.credit_cost
       RETURNING *`,
      [dto.skill_id, dto.level, dto.credit_cost ?? 0],
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error upserting skill level:", error);
    throw error;
  }
};

// UPDATE SKILL LEVEL
// For patching individual fields (e.g. just credit_cost).
export const updateSkillLevel = async (
  id: number,
  dto: UpdateSkillLevelDTO,
): Promise<SkillLevel | null> => {
  try {
    const fields = Object.entries(dto).filter(([, v]) => v !== undefined);
    if (fields.length === 0) {
      const r = await pool.query<SkillLevel>(
        `SELECT * FROM skill_levels WHERE id = $1`,
        [id],
      );
      return r.rows[0] ?? null;
    }
    const setClauses = fields
      .map(([key], i) => `"${key}" = $${i + 2}`)
      .join(", ");
    const values = fields.map(([, v]) => v);
    const result = await pool.query<SkillLevel>(
      `UPDATE skill_levels SET ${setClauses} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error updating skill level:", error);
    throw error;
  }
};

// DELETE SKILL LEVEL
// Cascades to skill_level_requirements via ON DELETE CASCADE.
export const deleteSkillLevel = async (id: number): Promise<boolean> => {
  try {
    const result = await pool.query(`DELETE FROM skill_levels WHERE id = $1`, [
      id,
    ]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error deleting skill level:", error);
    throw error;
  }
};

// SKILL LEVEL REQUIREMENTS

// GET ALL REQUIREMENTS FOR A SKILL LEVEL 
export const getRequirementsForSkillLevel = async (
  skillLevelId: number,
): Promise<SkillLevelRequirement[]> => {
  try {
    const result = await pool.query<SkillLevelRequirement>(
      `SELECT
        slr.id, slr.skill_level_id, slr.item_id, slr.quantity,
        i.name     AS item_name,
        i.image    AS item_image,
        i.category AS item_category
        FROM skill_level_requirements slr
        JOIN items i ON i.id = slr.item_id
        WHERE slr.skill_level_id = $1
        ORDER BY i.order_index, i.name`,
      [skillLevelId],
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting skill level requirements:", error);
    throw error;
  }
};

// GET SINGLE REQUIREMENT BY ID 
export const getSkillLevelRequirementById = async (
  id: number,
): Promise<SkillLevelRequirement | null> => {
  try {
    const result = await pool.query<SkillLevelRequirement>(
      `SELECT
        slr.id, slr.skill_level_id, slr.item_id, slr.quantity,
        i.name     AS item_name,
        i.image    AS item_image,
        i.category AS item_category
        FROM skill_level_requirements slr
        JOIN items i ON i.id = slr.item_id
        WHERE slr.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error getting skill level requirement:", error);
    throw error;
  }
};

// UPSERT SKILL LEVEL REQUIREMENT 
// On conflict (same skill_level + item) updates quantity.
export const upsertSkillLevelRequirement = async (
  dto: CreateSkillLevelRequirementDTO,
): Promise<SkillLevelRequirement> => {
  try {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO skill_level_requirements (skill_level_id, item_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (skill_level_id, item_id)
        DO UPDATE SET quantity = EXCLUDED.quantity
        RETURNING id`,
      [dto.skill_level_id, dto.item_id, dto.quantity],
    );
    return (await getSkillLevelRequirementById(result.rows[0].id))!;
  } catch (error) {
    console.error("Error upserting skill level requirement:", error);
    throw error;
  }
};

// DELETE SKILL LEVEL REQUIREMENT
export const deleteSkillLevelRequirement = async (
  id: number,
): Promise<boolean> => {
  try {
    const result = await pool.query(
      `DELETE FROM skill_level_requirements WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error deleting skill level requirement:", error);
    throw error;
  }
};

// BULK UPSERT SKILL LEVEL REQUIREMENTS
// Replaces all requirements for a skill level in one transaction.
export const bulkUpsertSkillLevelRequirements = async (
  skillLevelId: number,
  items: Array<{ item_id: number; quantity: number }>,
): Promise<SkillLevelRequirement[]> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const incomingItemIds = items.map((i) => i.item_id);
    await client.query(
      `DELETE FROM skill_level_requirements
        WHERE skill_level_id = $1
          AND item_id != ALL($2::int[])`,
      [skillLevelId, incomingItemIds],
    );

    for (const { item_id, quantity } of items) {
      await client.query(
        `INSERT INTO skill_level_requirements (skill_level_id, item_id, quantity)
          VALUES ($1, $2, $3)
          ON CONFLICT (skill_level_id, item_id)
          DO UPDATE SET quantity = EXCLUDED.quantity`,
        [skillLevelId, item_id, quantity],
      );
    }

    await client.query("COMMIT");
    return getRequirementsForSkillLevel(skillLevelId);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error bulk upserting skill level requirements:", error);
    throw error;
  } finally {
    client.release();
  }
};
