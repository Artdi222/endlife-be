import pool from "../../db/index.js";
import type {
  CreateTaskDTO,
  Task,
  UpdateTaskDTO,
} from "../../types/daily/taskTypes.js";

/**
 * Service for managing individual daily tasks
 */

// get all tasks by group id
export const getTasksByGroupId = async (groupId: number): Promise<Task[]> => {
  const result = await pool.query<Task>(
    `SELECT * FROM tasks WHERE group_id = $1 ORDER BY order_index ASC`,
    [groupId],
  );
  return result.rows;
};

// get task by id
export const getTaskById = async (id: number): Promise<Task | null> => {
  const result = await pool.query<Task>(`SELECT * FROM tasks WHERE id = $1`, [
    id,
  ]);
  return result.rows[0] || null;
};

// create task
export const createTask = async (
  payload: CreateTaskDTO,
): Promise<Task | null> => {
  const {
    group_id,
    sub_group_id,
    name,
    max_progress,
    reward_point,
    order_index,
  } = payload;

  const result = await pool.query<Task>(
    `
    INSERT INTO tasks (group_id, sub_group_id, name, max_progress, reward_point, order_index)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      group_id,
      sub_group_id ?? null,
      name,
      max_progress,
      reward_point,
      order_index,
    ],
  );

  return result.rows[0];
};

// update task
export const updateTask = async (id: number, payload: UpdateTaskDTO): Promise<Task | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (payload.name) {
    fields.push(`name = $${idx++}`);
    values.push(payload.name);
  }

  if (payload.max_progress !== undefined) {
    fields.push(`max_progress = $${idx++}`);
    values.push(payload.max_progress);
  }

  if (payload.reward_point !== undefined) {
    fields.push(`reward_point = $${idx++}`);
    values.push(payload.reward_point);
  }

  if (payload.order_index !== undefined) {
    fields.push(`order_index = $${idx++}`);
    values.push(payload.order_index);
  }

  if (payload.group_id) {
    fields.push(`group_id = $${idx++}`);
    values.push(payload.group_id);
  }

  if (payload.sub_group_id !== undefined) {
    fields.push(`sub_group_id = $${idx++}`);
    values.push(payload.sub_group_id);
  }

  if (fields.length === 0) {
    return null;
  }

  const result = await pool.query<Task>(
    `
    UPDATE tasks
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING *
    `,
    [...values, id],
  );

  return result.rows[0];
};

// delete task
export const deleteTask = async (id: number): Promise<Task | null> => {
  const result = await pool.query<Task>(
    `DELETE FROM tasks WHERE id = $1 RETURNING *`,
    [id],
  );

  return result.rows[0];
};
