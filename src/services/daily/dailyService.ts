import pool from "../../db/index.js";
import type {
  DailyChecklistRow,
  UpdateTaskProgressDTO,
  ActivityLevelResult,
  GlobalProgressResult,
  SanityTracker,
  UpdateSanityDTO,
  SanityResult,
} from "../../types/daily/dailyTypes.js";

/**
 * Service for managing daily checklists, task progress, and sanity tracking
 */

const ACTIVITY_CATEGORY = "Operation Manual (Daily)";
const REGEN_SECONDS = 7 * 60 + 12;

// seed daily progress
export const seedDailyProgress = async (
  user_id: number,
  date: string,
): Promise<void> => {
  await pool.query(
    `
    INSERT INTO daily_task_progress (user_id, task_id, date, current_progress)
    SELECT $1, t.id, $2, 0
    FROM tasks t
    WHERE NOT EXISTS (
      SELECT 1 FROM daily_task_progress dtp
      WHERE dtp.user_id = $1
        AND dtp.date = $2
      LIMIT 1
    )
    ON CONFLICT (user_id, task_id, date) DO NOTHING
    `,
    [user_id, date],
  );
};

// get daily checklist
export const getDailyChecklist = async (
  user_id: number,
  date: string,
): Promise<DailyChecklistRow[]> => {
  await seedDailyProgress(user_id, date);

  const result = await pool.query<DailyChecklistRow>(
    `
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      g.id AS group_id,
      g.name AS group_name,
      sg.id AS sub_group_id,
      sg.name AS sub_group_name,
      t.id AS task_id,
      t.name AS task_name,
      t.max_progress,
      t.reward_point,
      COALESCE(dtp.current_progress, 0) AS current_progress
    FROM categories c
    JOIN groups g ON g.category_id = c.id
    JOIN tasks t ON t.group_id = g.id
    LEFT JOIN sub_groups sg ON sg.id = t.sub_group_id
    LEFT JOIN daily_task_progress dtp
      ON dtp.task_id = t.id
      AND dtp.user_id = $1
      AND dtp.date = $2
    ORDER BY c.order_index, g.order_index, sg.order_index, t.order_index
    `,
    [user_id, date],
  );

  return result.rows;
};

// activity level
export const getActivityLevel = async (
  user_id: number,
  date: string,
): Promise<ActivityLevelResult> => {
  const result = await pool.query(
    `
    SELECT SUM(t.reward_point) AS total_point
    FROM tasks t
    JOIN groups g ON g.id = t.group_id
    JOIN categories c ON c.id = g.category_id
    LEFT JOIN daily_task_progress dtp
      ON dtp.task_id = t.id
      AND dtp.user_id = $1
      AND dtp.date = $2
    WHERE c.name = $3
      AND COALESCE(dtp.current_progress, 0) >= t.max_progress
    `,
    [user_id, date, ACTIVITY_CATEGORY],
  );

  const total = Number(result.rows[0]?.total_point || 0);

  return {
    activity_level: Math.min(total, 100),
  };
};

// update task progress
export const updateTaskProgress = async (
  payload: UpdateTaskProgressDTO,
): Promise<{ blocked: boolean; data: any }> => {
  const { user_id, task_id, date, current_progress } = payload;

  const categoryCheck = await pool.query<{
    category_name: string;
    max_progress: number;
  }>(
    `
    SELECT c.name AS category_name, t.max_progress
    FROM tasks t
    JOIN groups g ON g.id = t.group_id
    JOIN categories c ON c.id = g.category_id
    WHERE t.id = $1
    `,
    [task_id],
  );

  const taskInfo = categoryCheck.rows[0];
  const isActivityTask = taskInfo?.category_name === ACTIVITY_CATEGORY;

  // If trying to increase progress on an activity task, check current level
  if (isActivityTask && current_progress > 0) {
    const activityResult = await getActivityLevel(user_id, date);
    if (activityResult.activity_level >= 100) {
      // Block the increase — only allow unchecking (current_progress === 0)
      return { blocked: true, data: null };
    }
  }

  const result = await pool.query(
    `
    INSERT INTO daily_task_progress (user_id, task_id, date, current_progress)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, task_id, date)
    DO UPDATE SET current_progress = EXCLUDED.current_progress
    RETURNING *
    `,
    [user_id, task_id, date, current_progress],
  );

  return { blocked: false, data: result.rows[0] };
};

// global progress
export const getGlobalProgress = async (
  user_id: number,
  date: string,
): Promise<GlobalProgressResult> => {
  // Regular per-category task completion
  const result = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      COUNT(t.id) AS total_tasks,
      COUNT(
        CASE
          WHEN COALESCE(dtp.current_progress, 0) >= t.max_progress
          THEN 1
        END
      ) AS completed_tasks
    FROM categories c
    JOIN groups g ON g.category_id = c.id
    JOIN tasks t ON t.group_id = g.id
    LEFT JOIN daily_task_progress dtp
      ON dtp.task_id = t.id
      AND dtp.user_id = $1
      AND dtp.date = $2
    GROUP BY c.id, c.name
    ORDER BY c.order_index
    `,
    [user_id, date],
  );

  // Get activity level to override completion for activity category
  const { activity_level } = await getActivityLevel(user_id, date);

  const detail = result.rows.map((row) => {
    const isActivityCategory = row.name === ACTIVITY_CATEGORY;
    const is_completed = isActivityCategory
      ? activity_level >= 100
      : Number(row.completed_tasks) === Number(row.total_tasks);
    const total_tasks = isActivityCategory ? 100 : Number(row.total_tasks);
    const completed_tasks = isActivityCategory
      ? Math.min(activity_level, 100)
      : Number(row.completed_tasks);

    return {
      category_id: row.id,
      category_name: row.name,
      is_completed,
      total_tasks,
      completed_tasks,
    };
  });

  const completedCount = detail.filter((c) => c.is_completed).length;

  return {
    total_categories: detail.length,
    completed_categories: completedCount,
    progress: detail.length === 0 ? 0 : completedCount / detail.length,
    detail,
  };
};

// get sanity
export const getSanity = async (user_id: number): Promise<SanityResult> => {
  const result = await pool.query<SanityTracker>(
    `SELECT * FROM sanity_tracker WHERE user_id = $1`,
    [user_id],
  );

  let sanity: SanityTracker;

  if (result.rows.length === 0) {
    const init = await pool.query<SanityTracker>(
      `
      INSERT INTO sanity_tracker (user_id, current_sanity, max_sanity)
      VALUES ($1, 0, 0)
      RETURNING *
      `,
      [user_id],
    );
    sanity = init.rows[0];
  } else {
    sanity = result.rows[0];
  }

  const now = new Date();
  const last = new Date(sanity.last_update);
  const diffSeconds = Math.floor((now.getTime() - last.getTime()) / 1000);
  const regen = Math.floor(diffSeconds / REGEN_SECONDS);
  const newCurrent = Math.min(
    sanity.current_sanity + regen,
    sanity.max_sanity,
  );

  const fullInSeconds =
    newCurrent >= sanity.max_sanity
      ? 0
      : (sanity.max_sanity - newCurrent) * REGEN_SECONDS -
        (diffSeconds % REGEN_SECONDS);

  if (newCurrent !== sanity.current_sanity) {
    await pool.query(
      `UPDATE sanity_tracker SET current_sanity = $1, last_update = NOW() WHERE user_id = $2`,
      [newCurrent, user_id],
    );
  }

  return {
    current_sanity: newCurrent,
    max_sanity: sanity.max_sanity,
    full_in_seconds: Math.max(0, fullInSeconds),
  };
};

// update sanity
export const updateSanity = async (
  payload: UpdateSanityDTO,
): Promise<SanityResult> => {
  const { user_id, current_sanity, max_sanity } = payload;

  await pool.query(
    `
    UPDATE sanity_tracker
    SET current_sanity = $1, max_sanity = $2, last_update = NOW()
    WHERE user_id = $3
    `,
    [current_sanity, max_sanity, user_id],
  );

  const fullInSeconds =
    current_sanity >= max_sanity
      ? 0
      : (max_sanity - current_sanity) * REGEN_SECONDS;

  return {
    current_sanity,
    max_sanity,
    full_in_seconds: fullInSeconds,
  };
};

// empty sanity
export const emptySanity = async (user_id: number): Promise<SanityResult> => {
  const maxResult = await pool.query<{ max_sanity: number }>(
    `UPDATE sanity_tracker SET current_sanity = 0, last_update = NOW() WHERE user_id = $1 RETURNING max_sanity`,
    [user_id],
  );

  const max_sanity = maxResult.rows[0]?.max_sanity ?? 0;

  return {
    current_sanity: 0,
    max_sanity,
    full_in_seconds: max_sanity * REGEN_SECONDS,
  };
};
