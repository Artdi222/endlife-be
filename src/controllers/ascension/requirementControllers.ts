import pool from "../../db/index.js";
import type {
  AscensionRequirement,
  CreateAscensionRequirementDTO,
  UpdateAscensionRequirementDTO,
} from "../../types/index.js";

//  GET ALL REQUIREMENTS FOR A STAGE 
export const getRequirementsForStage = async (
  stageId: number,
): Promise<AscensionRequirement[]> => {
  try {
    const result = await pool.query<AscensionRequirement>(
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
      [stageId],
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting requirements for stage:", error);
    throw error;
  }
};

//  GET SINGLE REQUIREMENT BY ID 
export const getRequirementById = async (
  id: number,
): Promise<AscensionRequirement | null> => {
  try {
    const result = await pool.query<AscensionRequirement>(
      `SELECT
        ar.id, ar.stage_id, ar.item_id, ar.quantity,
        i.name      AS item_name,
        i.image     AS item_image,
        i.category  AS item_category,
        i.exp_value AS item_exp_value
        FROM ascension_requirements ar
        JOIN items i ON i.id = ar.item_id
        WHERE ar.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error getting requirement:", error);
    throw error;
  }
};

// UPSERT REQUIREMENT 
// Creates or updates a material requirement for a stage.
// On conflict (same stage + item) it updates the quantity.
export const upsertAscensionRequirement = async (
  dto: CreateAscensionRequirementDTO,
): Promise<AscensionRequirement> => {
  try {
    const result = await pool.query<{
      id: number;
      stage_id: number;
      item_id: number;
      quantity: number;
    }>(
      `INSERT INTO ascension_requirements (stage_id, item_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (stage_id, item_id)
        DO UPDATE SET quantity = EXCLUDED.quantity
        RETURNING id, stage_id, item_id, quantity`,
      [dto.stage_id, dto.item_id, dto.quantity],
    );

    // Re-fetch with item details (avoids sub-selects in RETURNING)
    return (await getRequirementById(result.rows[0].id))!;
  } catch (error) {
    console.error("Error upserting ascension requirement:", error);
    throw error;
  }
};

// UPDATE REQUIREMENT QUANTITY 
export const updateAscensionRequirement = async (
  id: number,
  dto: UpdateAscensionRequirementDTO,
): Promise<AscensionRequirement | null> => {
  try {
    const result = await pool.query<{ id: number }>(
      `UPDATE ascension_requirements SET quantity = $1 WHERE id = $2 RETURNING id`,
      [dto.quantity, id],
    );
    if (!result.rows[0]) return null;
    return getRequirementById(id);
  } catch (error) {
    console.error("Error updating ascension requirement:", error);
    throw error;
  }
};

// DELETE REQUIREMENT 
export const deleteAscensionRequirement = async (
  id: number,
): Promise<boolean> => {
  try {
    const result = await pool.query(
      `DELETE FROM ascension_requirements WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error deleting ascension requirement:", error);
    throw error;
  }
};

// BULK UPSERT REQUIREMENTS 
// Replaces all requirements for a stage in one transaction.
// Useful for the admin panel when setting up a full stage at once.
export const bulkUpsertRequirements = async (
  stageId: number,
  items: Array<{ item_id: number; quantity: number }>,
): Promise<AscensionRequirement[]> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Remove requirements not in the new list
    const incomingItemIds = items.map((i) => i.item_id);
    await client.query(
      `DELETE FROM ascension_requirements
        WHERE stage_id = $1
        AND item_id != ALL($2::int[])`,
      [stageId, incomingItemIds],
    );

    // Upsert each item
    for (const { item_id, quantity } of items) {
      await client.query(
        `INSERT INTO ascension_requirements (stage_id, item_id, quantity)
          VALUES ($1, $2, $3)
          ON CONFLICT (stage_id, item_id)
          DO UPDATE SET quantity = EXCLUDED.quantity`,
        [stageId, item_id, quantity],
      );
    }

    await client.query("COMMIT");
    return getRequirementsForStage(stageId);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error bulk upserting requirements:", error);
    throw error;
  } finally {
    client.release();
  }
};
