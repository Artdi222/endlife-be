import pool from "../../db/index.js";
import type {
  CreateGroupDTO,
  Group,
  CreateSubGroupDTO,
  SubGroup,
  UpdateGroupDTO,
  UpdateSubGroupDTO,
} from "../../types/daily/groupTypes.js";

// get groups by category id
export const getGroupsByCategoryId = async (category_id: number) => {
  try {
    const result = await pool.query<Group>(
      `SELECT * FROM groups WHERE category_id = $1 ORDER BY order_index ASC`,
      [category_id],
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching groups by category id:", error);
    throw error;
  }
};

// create group
export const createGroup = async (
  payload: CreateGroupDTO,
): Promise<Group | null> => {
  try {
    const { category_id, name, order_index } = payload;

    const result = await pool.query<Group>(
      `
    INSERT INTO groups (category_id, name, order_index)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
      [category_id, name, order_index],
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

// update group
export const updateGroup = async (id: number, payload: UpdateGroupDTO) => {
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

    if (payload.category_id) {
      fields.push(`category_id = $${idx++}`);
      values.push(payload.category_id);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    const result = await pool.query(
      `
      UPDATE groups
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING *
      `,
      [...values, id],
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error updating group:", error);
    throw error;
  }
};

// delete group
export const deleteGroup = async (id: number) => {
  try {
    const result = await pool.query(
      `DELETE FROM groups WHERE id = $1 RETURNING *`,
      [id],
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error deleting group:", error);
    throw error;
  }
};

// get sub groups by group id
export const getSubGroupsByGroupId = async (group_id: number) => {
  const result = await pool.query<SubGroup>(
    `SELECT * FROM sub_groups WHERE group_id = $1 ORDER BY order_index ASC`,
    [group_id],
  );
  return result.rows;
};

// create sub group
export const createSubGroup = async (
  payload: CreateSubGroupDTO,
): Promise<SubGroup | null> => {
  try {
    const { group_id, name, order_index } = payload;

    const result = await pool.query<SubGroup>(
      `
      INSERT INTO sub_groups (group_id, name, order_index)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [group_id, name, order_index],
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error creating sub group:", error);
    throw error;
  }
};

// update sub group
export const updateSubGroup = async (
  id: number,
  payload: UpdateSubGroupDTO,
) => {
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

    if (payload.group_id) {
      fields.push(`group_id = $${idx++}`);
      values.push(payload.group_id);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    const result = await pool.query(
      `
      UPDATE sub_groups
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING *
      `,
      [...values, id],
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error updating sub group:", error);
    throw error;
  }
};

// delete sub group
export const deleteSubGroup = async (id: number) => {
  try {
    const result = await pool.query(
      `DELETE FROM sub_groups WHERE id = $1 RETURNING *`,
      [id],
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error deleting sub group:", error);
    throw error;
  }
};
