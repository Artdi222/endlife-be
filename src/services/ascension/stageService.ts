import pool from "../../db/index.js";
import type {
  AscensionStage,
  AscensionStageWithRequirements,
  AscensionRequirement,
  CreateAscensionStageDTO,
  UpdateAscensionStageDTO,
} from "../../types/index.js";

/**
 * Service for managing ascension stages
 */

// GET ALL STAGES FOR AN ENTITY
export const getStagesForEntity = async (
  entityType: "character" | "weapon",
  entityId: number,
): Promise<AscensionStageWithRequirements[]> => {
  const stagesResult = await pool.query<AscensionStage>(
    `SELECT * FROM ascension_stages
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY stage_number`,
    [entityType, entityId],
  );

  if (stagesResult.rows.length === 0) return [];

  const stageIds = stagesResult.rows.map((s) => s.id);

  const reqResult = await pool.query<AscensionRequirement>(
    `SELECT
      ar.id, ar.stage_id, ar.item_id, ar.quantity,
      i.name      AS item_name,
      i.image     AS item_image,
      i.category  AS item_category,
      i.exp_value AS item_exp_value
      FROM ascension_requirements ar
      JOIN items i ON i.id = ar.item_id
      WHERE ar.stage_id = ANY($1)
      ORDER BY i.order_index, i.name`,
    [stageIds],
  );

  const reqByStage = new Map<number, AscensionRequirement[]>();
  for (const req of reqResult.rows) {
    const list = reqByStage.get(req.stage_id) ?? [];
    list.push(req);
    reqByStage.set(req.stage_id, list);
  }

  return stagesResult.rows.map((stage) => ({
    ...stage,
    requirements: reqByStage.get(stage.id) ?? [],
  }));
};

// GET SINGLE STAGE BY ID
export const getStageById = async (
  id: number,
): Promise<AscensionStageWithRequirements | null> => {
  const stageResult = await pool.query<AscensionStage>(
    `SELECT * FROM ascension_stages WHERE id = $1`,
    [id],
  );
  if (!stageResult.rows[0]) return null;

  const stage = stageResult.rows[0];

  const reqResult = await pool.query<AscensionRequirement>(
    `SELECT
      ar.id, ar.stage_id, ar.item_id, ar.quantity,
      i.name      AS item_name,
      i.image     AS item_image,
      i.category  AS item_category,
      i.exp_value AS item_exp_value
      FROM ascension_requirements ar
      JOIN items i ON i.id = ar.item_id
      WHERE ar.stage_id = $1
      ORDER BY i.order_index, i.name`,
    [id],
  );

  return { ...stage, requirements: reqResult.rows };
};

// LEVEL → STAGE NUMBER CONVERSION
export const levelToStageNumber = async (
  entityType: "character" | "weapon",
  entityId: number,
  level: number,
): Promise<number | null> => {
  // We now have 4 breakthrough phases corresponding to STAGE_DEFS (Phase 1, 2, 3, 4)
  if (level > 80) return 4;
  if (level > 60) return 3;
  if (level > 40) return 2;
  if (level > 20) return 1;
  return 0; // Phase 0 (No breakthroughs completed)
};

// CREATE STAGE
export const createAscensionStage = async (
  dto: CreateAscensionStageDTO,
): Promise<AscensionStage> => {
  const result = await pool.query<AscensionStage>(
    `INSERT INTO ascension_stages
      (entity_type, entity_id, stage_number, level_from, level_to,
        is_breakthrough, credit_cost)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      dto.entity_type,
      dto.entity_id,
      dto.stage_number,
      dto.level_from,
      dto.level_to,
      dto.is_breakthrough ?? false,
      dto.credit_cost ?? 0,
    ],
  );
  return result.rows[0];
};

// UPDATE STAGE
export const updateAscensionStage = async (
  id: number,
  dto: UpdateAscensionStageDTO,
): Promise<AscensionStage | null> => {
  const fields = Object.entries(dto).filter(([, v]) => v !== undefined);
  if (fields.length === 0) {
    const r = await pool.query<AscensionStage>(
      `SELECT * FROM ascension_stages WHERE id = $1`,
      [id],
    );
    return r.rows[0] ?? null;
  }

  const setClauses = fields
    .map(([key], i) => `"${key}" = $${i + 2}`)
    .join(", ");
  const values = fields.map(([, v]) => v);

  const result = await pool.query<AscensionStage>(
    `UPDATE ascension_stages SET ${setClauses} WHERE id = $1 RETURNING *`,
    [id, ...values],
  );
  return result.rows[0] ?? null;
};

// DELETE STAGE
export const deleteAscensionStage = async (id: number): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM ascension_stages WHERE id = $1`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
};
