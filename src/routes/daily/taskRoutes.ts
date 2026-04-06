import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as taskService from "../../services/daily/taskService.js";

export const taskRoutes = new Elysia({ prefix: "/tasks" })

  // get all tasks by group id
  .get("/", async ({ status, query }) => {
    try {
      const data = await taskService.getTasksByGroupId(Number(query.group_id));
      return status(200, successResponse(200, "Tasks fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch tasks"));
    }
  }, {
    query: t.Object({
      group_id: t.String(),
    })
  })

  // get task by id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await taskService.getTaskById(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Task not found"));
      return status(200, successResponse(200, "Task fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch task"));
    }
  })

  // create task
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await taskService.createTask(body);
        return status(201, successResponse(201, "Task created", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to create task"));
      }
    },
    {
      body: t.Object({
        group_id: t.Number(),
        sub_group_id: t.Optional(t.Number()),
        name: t.String(),
        max_progress: t.Number(),
        reward_point: t.Number(),
        order_index: t.Number(),
      }),
    },
  )

  // update task
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await taskService.updateTask(Number(params.id), body);
        if (!data) return status(404, errorResponse(404, "Task not found"));
        return status(200, successResponse(200, "Task updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update task"));
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        max_progress: t.Optional(t.Number()),
        reward_point: t.Optional(t.Number()),
        order_index: t.Optional(t.Number()),
        group_id: t.Optional(t.Number()),
        sub_group_id: t.Optional(t.Number()),
      }),
    },
  )

  // delete task
  .delete("/:id", async ({ status, params }) => {
    try {
      const data = await taskService.deleteTask(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Task not found"));
      return status(200, successResponse(200, "Task deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete task"));
    }
  });
