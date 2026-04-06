import pool from "../../db/index.js";
import type {
  LevelCost,
  CreateLevelCostDTO,
} from "../../types/index.js";

/**
 * Service for managing level upgrade costs
 */

// GET ALL LEVEL COSTS FOR AN ENTITY TYPE 
export const getLevelCosts = async (
  entityType: "character" | "weapon",
): Promise<LevelCost[]> => {
  const result = await pool.query<LevelCost>(
    `SELECT * FROM level_costs WHERE entity_type = $1 ORDER BY level`,
    [entityType],
  );
  return result.rows;
};

// GET SINGLE LEVEL COST BY ID
export const getLevelCostById = async (
  id: number,
): Promise<LevelCost | null> => {
  const result = await pool.query<LevelCost>(
    `SELECT * FROM level_costs WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
};

// GET SINGLE LEVEL COST BY ENTITY TYPE + LEVEL 
export const getLevelCostByLevel = async (
  entityType: "character" | "weapon",
  level: number,
): Promise<LevelCost | null> => {
  const result = await pool.query<LevelCost>(
    `SELECT * FROM level_costs WHERE entity_type = $1 AND level = $2`,
    [entityType, level],
  );
  return result.rows[0] ?? null;
};

// GET AGGREGATED COST RANGE
export const getLevelCostRange = async (
  entityType: "character" | "weapon",
  fromLevel: number,
  toLevel: number,
): Promise<{ total_exp: string; total_credits: string }> => {
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
};

// UPSERT SINGLE LEVEL COST
export const upsertLevelCost = async (
  dto: CreateLevelCostDTO,
): Promise<LevelCost> => {
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
};

// BULK UPSERT LEVEL COSTS 
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
    throw error;
  } finally {
    client.release();
  }
};

// DELETE LEVEL COST 
export const deleteLevelCost = async (id: number): Promise<boolean> => {
  const result = await pool.query(`DELETE FROM level_costs WHERE id = $1`, [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
};
