import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as dailyService from "../../services/daily/dailyService.js";

export const dailyRoutes = new Elysia({ prefix: "/daily" })

  // get daily checklist
  .get("/", async ({ status, query }) => {
    try {
      const data = await dailyService.getDailyChecklist(
        Number(query.user_id),
        query.date,
      );
      return status(200, successResponse(200, "Daily checklist fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch daily checklist"));
    }
  }, {
    query: t.Object({
      user_id: t.String(),
      date: t.String(),
    })
  })

  // update task progress
  .post(
    "/progress",
    async ({ status, body }) => {
      try {
        const { blocked, data } = await dailyService.updateTaskProgress(body);
        if (blocked) {
          return status(403, errorResponse(403, "Activity level already at maximum"));
        }
        return status(200, successResponse(200, "Task progress updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update task progress"));
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
  .get("/activity", async ({ status, query }) => {
    try {
      const data = await dailyService.getActivityLevel(
        Number(query.user_id),
        query.date,
      );
      return status(200, successResponse(200, "Activity level fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch activity level"));
    }
  }, {
    query: t.Object({
      user_id: t.String(),
      date: t.String(),
    })
  })

  // get global progress
  .get("/global-progress", async ({ status, query }) => {
    try {
      const data = await dailyService.getGlobalProgress(
        Number(query.user_id),
        query.date,
      );
      return status(200, successResponse(200, "Global progress fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch global progress"));
    }
  }, {
    query: t.Object({
      user_id: t.String(),
      date: t.String(),
    })
  })

  // get sanity
  .get("/sanity/:user_id", async ({ status, params }) => {
    try {
      const data = await dailyService.getSanity(Number(params.user_id));
      return status(200, successResponse(200, "Sanity fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch sanity"));
    }
  })

  // update sanity
  .post(
    "/sanity",
    async ({ status, body }) => {
      try {
        const data = await dailyService.updateSanity(body);
        return status(200, successResponse(200, "Sanity updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update sanity"));
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
  .post("/sanity/empty/:user_id", async ({ status, params }) => {
    try {
      const data = await dailyService.emptySanity(Number(params.user_id));
      return status(200, successResponse(200, "Sanity emptied", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to empty sanity"));
    }
  });
