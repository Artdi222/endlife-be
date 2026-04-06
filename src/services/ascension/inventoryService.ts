import pool from "../../db/index.js";
import type {
  UserInventoryItem,
  UpsertInventoryItemDTO,
} from "../../types/index.js";

/**
 * Service for managing user inventory
 */

// GET ALL INVENTORY ITEMS
export const getUserInventory = async (
  userId: number,
): Promise<UserInventoryItem[]> => {
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
};

// GET SINGLE INVENTORY ITEM BY ITEM ID
export const getInventoryItem = async (
  userId: number,
  itemId: number,
): Promise<UserInventoryItem | null> => {
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
};

// UPSERT INVENTORY ITEM
export const upsertInventoryItem = async (
  userId: number,
  itemId: number,
  dto: UpsertInventoryItemDTO,
): Promise<UserInventoryItem> => {
  await pool.query(
    `INSERT INTO user_inventory (user_id, item_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, item_id)
      DO UPDATE SET quantity = EXCLUDED.quantity`,
    [userId, itemId, dto.quantity],
  );
  return (await getInventoryItem(userId, itemId))!;
};

// BULK UPSERT INVENTORY
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
    throw error;
  } finally {
    client.release();
  }
};

// REMOVE INVENTORY ITEM
export const removeInventoryItem = async (
  userId: number,
  itemId: number,
): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM user_inventory WHERE user_id = $1 AND item_id = $2`,
    [userId, itemId],
  );
  return (result.rowCount ?? 0) > 0;
};
