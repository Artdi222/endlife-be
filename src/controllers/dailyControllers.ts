import pool from "../db/index.js";
import type {
  DailyChecklistRow,
  UpdateTaskProgressDTO,
  ActivityLevelResult,
  GlobalProgressResult,
  SanityTracker,
  UpdateSanityDTO,
  SanityResult,
} from "../types/dailyTypes.js";

// ─── Auto-seed daily_task_progress for a user+date if not yet seeded ──────────
const seedDailyProgress = async (
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

// get daily checklist — auto-seeds progress rows on first call of the day
export const getDailyChecklist = async (
  user_id: number,
  date: string,
): Promise<DailyChecklistRow[]> => {
  try {
    // Auto-seed: insert 0-progress rows for all tasks if this is the first
    // time this user is fetching the checklist for this date
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
      LEFT JOIN sub_groups sg ON sg.group_id = g.id
      JOIN tasks t ON t.group_id = g.id
        AND (t.sub_group_id IS NULL OR t.sub_group_id = sg.id)
      LEFT JOIN daily_task_progress dtp
        ON dtp.task_id = t.id
        AND dtp.user_id = $1
        AND dtp.date = $2
      ORDER BY c.order_index, g.order_index, sg.order_index, t.order_index
      `,
      [user_id, date],
    );

    return result.rows;
  } catch (error) {
    console.error("Error getting daily checklist:", error);
    throw error;
  }
};

// update task progress
export const updateTaskProgress = async (payload: UpdateTaskProgressDTO) => {
  try {
    const { user_id, task_id, date, current_progress } = payload;

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

    return result.rows[0];
  } catch (error) {
    console.error("Error updating task progress:", error);
    throw error;
  }
};

// activity level
export const getActivityLevel = async (
  user_id: number,
  date: string,
): Promise<ActivityLevelResult> => {
  try {
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
      WHERE c.name = 'Operation Manual (Daily)'
        AND COALESCE(dtp.current_progress, 0) >= t.max_progress
      `,
      [user_id, date],
    );

    const total = Number(result.rows[0]?.total_point || 0);

    return {
      activity_level: Math.min(total, 100),
    };
  } catch (error) {
    console.error("Error getting activity level:", error);
    throw error;
  }
};

// global progress
export const getGlobalProgress = async (
  user_id: number,
  date: string,
): Promise<GlobalProgressResult> => {
  try {
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

    const detail = result.rows.map((row) => ({
      category_id: row.id,
      category_name: row.name,
      is_completed: Number(row.completed_tasks) === Number(row.total_tasks),
    }));

    const completedCount = detail.filter((c) => c.is_completed).length;

    return {
      total_categories: detail.length,
      completed_categories: completedCount,
      progress: detail.length === 0 ? 0 : completedCount / detail.length,
      detail,
    };
  } catch (error) {
    console.error("Error getting global progress:", error);
    throw error;
  }
};

// sanity
const REGEN_SECONDS = 7 * 60 + 12; // 7 minutes 12 seconds per sanity point

// get sanity
export const getSanity = async (user_id: number): Promise<SanityResult> => {
  try {
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

    let newCurrent = Math.min(sanity.current_sanity + regen, sanity.max_sanity);

    let fullInSeconds =
      newCurrent >= sanity.max_sanity
        ? 0
        : (sanity.max_sanity - newCurrent) * REGEN_SECONDS;

    if (newCurrent !== sanity.current_sanity) {
      await pool.query(
        `
        UPDATE sanity_tracker
        SET current_sanity = $1,
            last_update = NOW()
        WHERE user_id = $2
        `,
        [newCurrent, user_id],
      );
    }

    return {
      current_sanity: newCurrent,
      max_sanity: sanity.max_sanity,
      full_in_seconds: fullInSeconds,
    };
  } catch (error) {
    console.error("Error getting sanity:", error);
    throw error;
  }
};

// update sanity
export const updateSanity = async (
  payload: UpdateSanityDTO,
): Promise<SanityTracker> => {
  try {
    const { user_id, current_sanity, max_sanity } = payload;

    const result = await pool.query<SanityTracker>(
      `
      UPDATE sanity_tracker
      SET current_sanity = $1,
          max_sanity = $2,
          last_update = NOW()
      WHERE user_id = $3
      RETURNING *
      `,
      [current_sanity, max_sanity, user_id],
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error updating sanity:", error);
    throw error;
  }
};

// empty sanity
export const emptySanity = async (user_id: number): Promise<SanityTracker> => {
  try {
    const result = await pool.query<SanityTracker>(
      `
      UPDATE sanity_tracker
      SET current_sanity = 0,
          last_update = NOW()
      WHERE user_id = $1
      RETURNING *
      `,
      [user_id],
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error emptying sanity:", error);
    throw error;
  }
};
