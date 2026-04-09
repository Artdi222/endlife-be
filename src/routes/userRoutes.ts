import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../lib/response.js";
import * as userService from "../services/userService.js";

export const userRoutes = new Elysia({ prefix: "/users" })

  // get all users
  .get("/", async ({ status }) => {
    try {
      const data = await userService.getUsers();
      return status(200, successResponse(200, "Users fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch users"));
    }
  })

  // get user by id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await userService.getUserById(Number(params.id));
      if (!data) return status(404, errorResponse(404, "User not found"));
      return status(200, successResponse(200, "User fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch user"));
    }
  })

  // create user
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await userService.createUser(body);
        return status(201, successResponse(201, "User created", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to create user"));
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
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await userService.updateUser(Number(params.id), body);
        if (!data) return status(404, errorResponse(404, "User not found"));
        return status(200, successResponse(200, "User updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update user"));
      }
    },
    {
      body: t.Object({
        username: t.Optional(t.String()),
        email: t.Optional(t.String()),
        role: t.Optional(t.String()),
        password: t.Optional(t.String()),
      }),
    },
  )

  // delete user
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await userService.deleteUser(Number(params.id));
      if (!deleted) return status(404, errorResponse(404, "User not found"));
      return status(200, successResponse(200, "User deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete user"));
    }
  })

  // POST upload profile image
  .post(
    "/:id/profile-image",
    async ({ status, params, body }) => {
      try {
        const file = body.file as File;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await userService.uploadProfileImage(
          Number(params.id),
          buffer,
          file.type,
          file.name,
        );

        if (!data) return status(404, errorResponse(404, "User not found"));
        return status(
          200,
          successResponse(200, "Profile image uploaded", data),
        );
      } catch (error) {
        console.error(error);
        return status(
          500,
          errorResponse(500, "Failed to upload profile image"),
        );
      }
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    },
  )

  // POST upload profile banner
  .post(
    "/:id/profile-banner",
    async ({ status, params, body }) => {
      try {
        const file = body.file as File;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await userService.uploadProfileBanner(
          Number(params.id),
          buffer,
          file.type,
          file.name,
        );

        if (!data) return status(404, errorResponse(404, "User not found"));
        return status(
          200,
          successResponse(200, "Profile banner uploaded", data),
        );
      } catch (error) {
        console.error(error);
        return status(
          500,
          errorResponse(500, "Failed to upload profile banner"),
        );
      }
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    },
  );
