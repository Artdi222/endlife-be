import pool from "../db/index.js";
import type { CreateCategoryDTO, Category, UpdateCategoryDTO } from "../types/categoryTypes.js";

// get all categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const result = await pool.query<Category>(
      `SELECT id, name, order_index FROM categories ORDER BY order_index`
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
};

// create category
export const createCategory = async (
  payload: CreateCategoryDTO,
): Promise<Category | null> => {
  try {
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
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

// update category
export const updateCategory = async (id: number, payload:   UpdateCategoryDTO) => {
  try {
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
      throw new Error("No fields to update");
    }

    const result = await pool.query(
      `
      UPDATE categories
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING *
      `,
      [...values, id],
    );


    return result.rows[0];
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

// delete category
export const deleteCategory = async (id: number) => {
  try {
    const result = await pool.query(
    `DELETE FROM categories WHERE id = $1 RETURNING *`,
    [id],
  );


    return result.rows[0];
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};
