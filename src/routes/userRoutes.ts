import { Elysia, t } from "elysia";
import {
  createUser,
  getUserById,
  getUsers,
  updateUser,
  deleteUser,
} from "../controllers/userControllers.js";
import type { CreateUserDTO, UpdateUserDTO } from "../types/userTypes.js";
import { adminMiddleware } from "../middleware/authMiddleware.js";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(adminMiddleware) 

  // get all users
  .get("/", async ({ status }) => {
    try {
      const users = await getUsers();
      return status(200, {
        status: 200,
        message: "Success to get all users",
        data: users,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to get all users",
        data: null,
      });
    }
  })

  // get user by id
  .get("/:id", async ({ status, params }) => {
    try {
      const user = await getUserById(Number(params.id));
      if (!user)
        return status(404, {
          status: 404,
          message: "User not found",
          data: null,
        });
      return status(200, {
        status: 200,
        message: "Success to get user",
        data: user,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to get user",
        data: null,
      });
    }
  })

  // create user
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const user = await createUser(body as CreateUserDTO);
        return status(201, {
          status: 201,
          message: "User created",
          data: user,
        });
      } catch (error: any) {
        if (error.code === "23505") {
          return status(409, {
            status: 409,
            message: "Username or email already exists",
            data: null,
          });
        }
        return status(500, {
          status: 500,
          message: "Failed to create user",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        username: t.String(),
        email: t.String(),
        password: t.String(),
        role: t.Optional(t.String()),
      }),
    },
  )

  // update user
  .put(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const user = await updateUser(Number(params.id), body as UpdateUserDTO);
        return status(200, {
          status: 200,
          message: "User updated",
          data: user,
        });
      } catch (error: any) {
        if (error.message === "No fields to update") {
          return status(400, {
            status: 400,
            message: "No fields to update",
            data: null,
          });
        }
        if (error.message === "User not found") {
          return status(404, {
            status: 404,
            message: "User not found",
            data: null,
          });
        }
        return status(500, {
          status: 500,
          message: "Failed to update user",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        username: t.Optional(t.String()),
        email: t.Optional(t.String()),
        password: t.Optional(t.String()),
        role: t.Optional(t.String()),
      }),
    },
  )

  // delete user
  .delete("/:id", async ({ status, params }) => {
    try {
      await deleteUser(Number(params.id));
      return status(200, { status: 200, message: "User deleted", data: null });
    } catch (error: any) {
      if (error.message === "User not found") {
        return status(404, {
          status: 404,
          message: "User not found",
          data: null,
        });
      }
      return status(500, {
        status: 500,
        message: "Failed to delete user",
        data: null,
      });
    }
  });
