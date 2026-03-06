import { Elysia, t } from "elysia";
import { getTasksByGroupId, getTaskById, createTask, deleteTask, updateTask } from "../controllers/taskControllers.js";
import type { CreateTaskDTO, UpdateTaskDTO } from "../types/taskTypes.js";
import { adminMiddleware } from "../middleware/authMiddleware.js";

export const taskRoutes = new Elysia({ prefix: "/tasks" })
  .use(adminMiddleware)

  // get all tasks by group id
  .get("/group/:groupId", async ({ status, params }) => {
    try {
      const data = await getTasksByGroupId(Number(params.groupId));
      return status(200, { status: 200, message: "Success to get all tasks", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch tasks by group id",
        data: null,
      });
    }
  })

  // get task by id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await getTaskById(Number(params.id));
      if (data) {
        return status(200, { status: 200, message: "Success to get task", data });
      } else {
        return status(404, {
          status: 404,
          message: "Task not found",
          data: null,
        });
      }
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch task by id",
        data: null,
      });
    }
  })

  // create task
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const {
          group_id,
          sub_group_id,
          name,
          max_progress,
          reward_point,
          order_index,
        } = body as CreateTaskDTO;

        const newTask = await createTask({
          group_id,
          sub_group_id,
          name,
          max_progress,
          reward_point,
          order_index,
        });

        return status(201, {
          status: 201,
          message: "Task created successfully",
          data: newTask,
        });
      } catch (error: any) {
        return status(500, {
          status: 500,
          message: "Failed to create task",
          data: null,
        });
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
  .put(
    "/:id",
    async ({ status, body, params }) => {
      try {
        const updated = await updateTask(Number(params.id), body as UpdateTaskDTO);
        return status(200, {
          status: 200,
          message: "Task updated",
          data: updated,
        });
      } catch (error: any) {
        if (error.message === "No fields to update") {
          return status(400, {
            status: 400,
            message: "No fields to update",
            data: null,
          });
        }

        return status(500, {
          status: 500,
          message: "Failed to update task",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        id: t.Number(),
        group_id: t.Number(),
        sub_group_id: t.Optional(t.Number()),
        name: t.String(),
        max_progress: t.Number(),
        reward_point: t.Number(),
        order_index: t.Number(),
      }),
    },
  )
  
  // delete task
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteTask(Number(params.id));
      return status(200, {
        status: 200,
        message: "Task deleted",
        data: deleted,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete task",
        data: null,
      });
    }
  });
