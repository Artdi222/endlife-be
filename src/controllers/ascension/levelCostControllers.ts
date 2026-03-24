import pool from "../../db/index.js";
import type {
  LevelCost,
  CreateLevelCostDTO,
} from "../../types/index.js";

// GET ALL LEVEL COSTS FOR AN ENTITY TYPE 
export const getLevelCosts = async (
  entityType: "character" | "weapon",
): Promise<LevelCost[]> => {
  try {
    const result = await pool.query<LevelCost>(
      `SELECT * FROM level_costs WHERE entity_type = $1 ORDER BY level`,
      [entityType],
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting level costs:", error);
    throw error;
  }
};

// GET SINGLE LEVEL COST BY ID
export const getLevelCostById = async (
  id: number,
): Promise<LevelCost | null> => {
  try {
    const result = await pool.query<LevelCost>(
      `SELECT * FROM level_costs WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error getting level cost:", error);
    throw error;
  }
};

// GET SINGLE LEVEL COST BY ENTITY TYPE + LEVEL 
export const getLevelCostByLevel = async (
  entityType: "character" | "weapon",
  level: number,
): Promise<LevelCost | null> => {
  try {
    const result = await pool.query<LevelCost>(
      `SELECT * FROM level_costs WHERE entity_type = $1 AND level = $2`,
      [entityType, level],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error getting level cost by level:", error);
    throw error;
  }
};

// GET AGGREGATED COST RANGE
// Returns the total EXP and credits needed to go from fromLevel to toLevel.
// Uses level > fromLevel AND level <= toLevel (exclusive start, inclusive end).
export const getLevelCostRange = async (
  entityType: "character" | "weapon",
  fromLevel: number,
  toLevel: number,
): Promise<{ total_exp: string; total_credits: string }> => {
  try {
    const result = await pool.query<{
      total_exp: string;
      total_credits: string;
    }>(
      `SELECT
        COALESCE(SUM(exp_required), 0)::TEXT AS total_exp,
        COALESCE(SUM(credit_cost),  0)::TEXT AS total_credits
        FROM level_costs
        WHERE entity_type = $1
          AND level >  $2
          AND level <= $3`,
      [entityType, fromLevel, toLevel],
    );
    return result.rows[0] ?? { total_exp: "0", total_credits: "0" };
  } catch (error) {
    console.error("Error getting level cost range:", error);
    throw error;
  }
};

// UPSERT SINGLE LEVEL COST
export const upsertLevelCost = async (
  dto: CreateLevelCostDTO,
): Promise<LevelCost> => {
  try {
    const result = await pool.query<LevelCost>(
      `INSERT INTO level_costs (entity_type, level, exp_required, credit_cost)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (entity_type, level)
        DO UPDATE SET
          exp_required = EXCLUDED.exp_required,
          credit_cost  = EXCLUDED.credit_cost
       RETURNING *`,
      [dto.entity_type, dto.level, dto.exp_required, dto.credit_cost],
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error upserting level cost:", error);
    throw error;
  }
};

// BULK UPSERT LEVEL COSTS 
// Efficient seeding: replaces all costs for an entity type in one transaction.
// Pass the full array of {level, exp_required, credit_cost} for levels 1–90.
export const bulkUpsertLevelCosts = async (
  entityType: "character" | "weapon",
  rows: Array<{ level: number; exp_required: number; credit_cost: number }>,
): Promise<LevelCost[]> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const row of rows) {
      await client.query(
        `INSERT INTO level_costs (entity_type, level, exp_required, credit_cost)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (entity_type, level)
          DO UPDATE SET
            exp_required = EXCLUDED.exp_required,
            credit_cost  = EXCLUDED.credit_cost`,
        [entityType, row.level, row.exp_required, row.credit_cost],
      );
    }
    await client.query("COMMIT");
    return getLevelCosts(entityType);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error bulk upserting level costs:", error);
    throw error;
  } finally {
    client.release();
  }
};

// DELETE LEVEL COST 
export const deleteLevelCost = async (id: number): Promise<boolean> => {
  try {
    const result = await pool.query(`DELETE FROM level_costs WHERE id = $1`, [
      id,
    ]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error deleting level cost:", error);
    throw error;
  }
};
