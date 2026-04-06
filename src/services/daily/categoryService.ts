import pool from "../../db/index.js";
import type {
  CreateCategoryDTO,
  Category,
  UpdateCategoryDTO,
} from "../../types/daily/categoryTypes.js";

/**
 * Service for managing daily task categories
 */

// get all categories
export const getCategories = async (): Promise<Category[]> => {
  const result = await pool.query<Category>(
    `SELECT id, name, order_index FROM categories ORDER BY order_index`,
  );
  return result.rows;
};

// create category
export const createCategory = async (
  payload: CreateCategoryDTO,
): Promise<Category | null> => {
  const { name, order_index } = payload;

  const result = await pool.query<Category>(
    `
    INSERT INTO categories (name, order_index)
    VALUES ($1, $2)
    RETURNING *
    `,
    [name, order_index],
  );

  return result.rows[0];
};

// update category
export const updateCategory = async (
  id: number,
  payload: UpdateCategoryDTO,
): Promise<Category | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (payload.name) {
    fields.push(`name = $${idx++}`);
    values.push(payload.name);
  }

  if (payload.order_index !== undefined) {
    fields.push(`order_index = $${idx++}`);
    values.push(payload.order_index);
  }

  if (fields.length === 0) {
    return null;
  }

  const result = await pool.query<Category>(
    `
    UPDATE categories
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING *
    `,
    [...values, id],
  );

  return result.rows[0];
};

// delete category
export const deleteCategory = async (id: number): Promise<Category | null> => {
  const result = await pool.query<Category>(
    `DELETE FROM categories WHERE id = $1 RETURNING *`,
    [id],
  );

  return result.rows[0];
};
