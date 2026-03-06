import pool from "../db/index.js";
import { createItemDTO, Item, UpdateItemDTO } from "../types/itemTypes.js";

// get all items
export const getAllItems = async (): Promise<Item[]> => {
  try {
    const result = await pool.query<Item>("SELECT * FROM items");

    return result.rows;
  } catch (error) {
    console.error("Error fetching items:", error);
    throw error;
  }
};

// get item by id
export const getItemById = async (id: string): Promise<Item | null> => {
  try {
    const result = await pool.query<Item>("SELECT * FROM items WHERE id = $1", [
    id,
  ]);

    return result.rows[0] ?? null;
  } catch (error) {
    console.error(`Error fetching item with id ${id}:`, error);
    throw error;
  }
};

// create item
export const createItem = async (
  payload: createItemDTO,
): Promise<Item | null> => {
  try {
  const { id, name, image_path, rarity, type } = payload;
  const result = await pool.query<Item>(
    `INSERT INTO items (id, name, image_path, rarity, type) 
    VALUES($1, $2, $3, $4, $5)
    RETURNING * `,
    [id, name, image_path ?? null, rarity, type],
  );

    return result.rows[0];
  } catch (error) {
    console.error("Error creating item:", error);
    throw error;
  }
};

// update item
export const updateItem = async (
  id: string,
  payload: UpdateItemDTO,
): Promise<Item | null> => {
  try {
    const { name, image_path, rarity, type } = payload;

    const result = await pool.query<Item>(
      `
    UPDATE items
    SET
      name = COALESCE($1, name),
      image_path = COALESCE($2, image_path),
      rarity = COALESCE($3, rarity),
      type = COALESCE($4, type),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *
    `,
      [name ?? null, image_path ?? null, rarity ?? null, type ?? null, id],
    );

    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error updating item:", error);
    throw error;
  }
};

export const deleteItem = async (id: string): Promise<Item | null> => {
  try {
    const result = await pool.query<Item>(
      `
    DELETE FROM items
    WHERE id = $1
    RETURNING *
    `,
      [id],
    );

    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error deleting item:", error);
    throw error;
  }
};
