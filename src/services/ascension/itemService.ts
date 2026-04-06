import pool from "../../db/index.js";
import { supabase } from "../../lib/supabase.js";
import type {
  Item,
  CreateItemDTO,
  UpdateItemDTO,
} from "../../types/ascension/itemTypes.js";

/**
 * Service for managing items
 */

// get all items
export const getAllItems = async (): Promise<Item[]> => {
  const result = await pool.query<Item>(
    `SELECT * FROM items ORDER BY order_index, name`,
  );
  return result.rows;
};

// get item by id
export const getItemById = async (id: number): Promise<Item | null> => {
  const result = await pool.query<Item>(`SELECT * FROM items WHERE id = $1`, [
    id,
  ]);
  return result.rows[0] ?? null;
};

// create item
export const createItem = async (dto: CreateItemDTO): Promise<Item> => {
  const result = await pool.query<Item>(
    `
    INSERT INTO items
      (name, category, exp_value, order_index)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [dto.name, dto.category, dto.exp_value ?? 0, dto.order_index ?? 0],
  );
  return result.rows[0];
};

// update item
export const updateItem = async (
  id: number,
  dto: UpdateItemDTO,
): Promise<Item | null> => {
  const fields = Object.entries(dto).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return getItemById(id);

  const setClauses = fields
    .map(([key], i) => `"${key}" = $${i + 2}`)
    .join(", ");
  const values = fields.map(([, v]) => v);

  const result = await pool.query<Item>(
    `UPDATE items SET ${setClauses} WHERE id = $1 RETURNING *`,
    [id, ...values],
  );
  return result.rows[0] ?? null;
};

// upload item image
export const uploadItemImage = async (
  id: number,
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<Item | null> => {
  const bucket = "items";
  const path = `icon/${id}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const result = await pool.query<Item>(
    `UPDATE items SET image = $1 WHERE id = $2 RETURNING *`,
    [publicUrl, id],
  );

  return result.rows[0] ?? null;
};

// delete item
export const deleteItem = async (id: number): Promise<boolean> => {
  // Clean up Supabase storage
  const { data: files } = await supabase.storage
    .from("items")
    .list("icon", { search: `${id}-` });

  if (files && files.length > 0) {
    const paths = files.map((f) => `icon/${f.name}`);
    await supabase.storage.from("items").remove(paths);
  }

  const result = await pool.query(`DELETE FROM items WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
};
