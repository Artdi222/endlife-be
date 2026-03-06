import { Elysia, t } from "elysia";
import {
  getDailyChecklist,
  updateTaskProgress,
  getActivityLevel,
  getGlobalProgress,
  getSanity,
  updateSanity,
  emptySanity,
} from "../controllers/dailyControllers.js";

// No auth middleware — daily routes are public
export const dailyRoutes = new Elysia({ prefix: "/daily" })

  // get daily checklist
  .get("/:userId/:date", async ({ status, params }) => {
    try {
      const data = await getDailyChecklist(Number(params.userId), params.date);
      return status(200, { status: 200, message: "Success to get daily checklist", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch checklist",
        data: null,
      });
    }
  })

  // update task progress
  .post(
    "/progress",
    async ({ status, body }) => {
      try {
        const data = await updateTaskProgress(body);
        return status(200, {
          status: 200,
          message: "Progress updated",
          data,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to update progress",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        user_id: t.Number(),
        task_id: t.Number(),
        date: t.String(),
        current_progress: t.Number(),
      }),
    },
  )

  // get activity level
  .get("/:userId/:date/activity", async ({ status, params }) => {
    try {
      const data = await getActivityLevel(Number(params.userId), params.date);
      return status(200, {
        status: 200,
        message: "Activity fetched",
        data,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch activity",
        data: null,
      });
    }
  })

  // get global progress
  .get("/:userId/:date/global", async ({ status, params }) => {
    try {
      const data = await getGlobalProgress(Number(params.userId), params.date);
      return status(200, {
        status: 200,
        message: "Global fetched",
        data,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch global progress",
        data: null,
      });
    }
  })

  // get sanity
  .get("/:userId/sanity", async ({ status, params }) => {
    try {
      const data = await getSanity(Number(params.userId));
      return status(200, {
        status: 200,
        message: "Sanity fetched",
        data,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch sanity",
        data: null,
      });
    }
  })

  // update sanity
  .post(
    "/sanity",
    async ({ status, body }) => {
      try {
        const data = await updateSanity(body);
        return status(200, {
          status: 200,
          message: "Sanity updated",
          data,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to update sanity",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        user_id: t.Number(),
        current_sanity: t.Number(),
        max_sanity: t.Number(),
      }),
    },
  )

  // empty sanity
  .post("/:userId/sanity/empty", async ({ status, params }) => {
    try {
      const data = await emptySanity(Number(params.userId));
      return status(200, {
        status: 200,
        message: "Sanity emptied",
        data,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to empty sanity",
        data: null,
      });
    }
  });
