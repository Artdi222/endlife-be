import pool from "../../db/index.js";
import type {
  CreateGroupDTO,
  Group,
  CreateSubGroupDTO,
  SubGroup,
  UpdateGroupDTO,
  UpdateSubGroupDTO,
} from "../../types/daily/groupTypes.js";

/**
 * Service for managing daily task groups and sub-groups
 */

// get groups by category id
export const getGroupsByCategoryId = async (category_id: number): Promise<Group[]> => {
  const result = await pool.query<Group>(
    `SELECT * FROM groups WHERE category_id = $1 ORDER BY order_index ASC`,
    [category_id],
  );
  return result.rows;
};

// create group
export const createGroup = async (
  payload: CreateGroupDTO,
): Promise<Group | null> => {
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
};

// update group
export const updateGroup = async (id: number, payload: UpdateGroupDTO): Promise<Group | null> => {
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
    return null;
  }

  const result = await pool.query<Group>(
    `
    UPDATE groups
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING *
    `,
    [...values, id],
  );

  return result.rows[0];
};

// delete group
export const deleteGroup = async (id: number): Promise<Group | null> => {
  const result = await pool.query<Group>(
    `DELETE FROM groups WHERE id = $1 RETURNING *`,
    [id],
  );

  return result.rows[0];
};

// get sub groups by group id
export const getSubGroupsByGroupId = async (group_id: number): Promise<SubGroup[]> => {
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
};

// update sub group
export const updateSubGroup = async (
  id: number,
  payload: UpdateSubGroupDTO,
): Promise<SubGroup | null> => {
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
    return null;
  }

  const result = await pool.query<SubGroup>(
    `
    UPDATE sub_groups
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING *
    `,
    [...values, id],
  );

  return result.rows[0];
};

// delete sub group
export const deleteSubGroup = async (id: number): Promise<SubGroup | null> => {
  const result = await pool.query<SubGroup>(
    `DELETE FROM sub_groups WHERE id = $1 RETURNING *`,
    [id],
  );

  return result.rows[0];
};
