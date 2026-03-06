import pool from "../db/index.js";
import type { AdminCategory } from "../types/adminTypes.js";

export const getAdminStructure = async (): Promise<AdminCategory[]> => {
  try {
    const result = await pool.query(`
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      c.order_index AS category_order,

      g.id AS group_id,
      g.name AS group_name,
      g.type AS group_type,
      g.order_index AS group_order,

      sg.id AS sub_group_id,
      sg.name AS sub_group_name,
      sg.order_index AS sub_group_order,

      t.id AS task_id,
      t.name AS task_name,
      t.max_progress,
      t.reward_point,
      t.order_index AS task_order
    FROM categories c
    JOIN groups g ON g.category_id = c.id
    LEFT JOIN sub_groups sg ON sg.group_id = g.id
    LEFT JOIN tasks t
      ON t.group_id = g.id
      AND (t.sub_group_id = sg.id OR t.sub_group_id IS NULL)
    ORDER BY
      c.order_index,
      g.order_index,
      sg.order_index,
      t.order_index
  `);

    const rows = result.rows;

    const map = new Map<number, AdminCategory>();

    for (const row of rows) {
      // category
      if (!map.has(row.category_id)) {
        map.set(row.category_id,
          {
          id: row.category_id,
          name: row.category_name,
          order_index: row.category_order,
          groups: [],
        });
      }

      const category = map.get(row.category_id)!;

      // group
      let group = category.groups.find((g) => g.id === row.group_id);
      if (!group) {
        group = {
          id: row.group_id,
          name: row.group_name,
          type: row.group_type,
          order_index: row.group_order,
          sub_groups: [],
          tasks: [],
        };
        category.groups.push(group);
      }

      // sub group
      if (row.sub_group_id) {
        let sub = group.sub_groups.find((s) => s.id === row.sub_group_id);
        if (!sub) {
          sub = {
            id: row.sub_group_id,
            name: row.sub_group_name,
            order_index: row.sub_group_order,
            tasks: [],
          };
          group.sub_groups.push(sub);
        }

        if (row.task_id) {
          sub.tasks.push({
            id: row.task_id,
            name: row.task_name,
            max_progress: row.max_progress,
            reward_point: row.reward_point,
            order_index: row.task_order,
            sub_group_id: row.sub_group_id,
          });
        }
      } else {
        // task without sub group
        if (row.task_id) {
          group.tasks.push({
            id: row.task_id,
            name: row.task_name,
            max_progress: row.max_progress,
            reward_point: row.reward_point,
            order_index: row.task_order,
            sub_group_id: null,
          });
        }
      }
    }

    return Array.from(map.values());
  } catch (error) {
    console.error("Error building admin structure:", error);
    throw error;
  }
};
