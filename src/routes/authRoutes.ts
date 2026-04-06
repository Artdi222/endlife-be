import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { successResponse, errorResponse } from "../lib/response.js";
import * as userService from "../services/userService.js";

/**
 * Routes for Authentication (Register/Login)
 */
export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )

  // register
  .post(
    "/register",
    async ({ status, body, jwt }) => {
      try {
        const userPayload = await userService.registerUser(body);

        const token = await jwt.sign({
          user_id: userPayload.user_id,
          username: userPayload.username,
          email: userPayload.email,
          role: userPayload.role,
        });

        return status(201, successResponse(201, "User registered successfully", {
          token,
          user: userPayload,
        }));
      } catch (error: any) {
        if (error?.message === "EMAIL_TAKEN") {
          return status(409, errorResponse(409, "Email already in use"));
        }
        console.error(error);
        return status(500, errorResponse(500, "Failed to register user"));
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
    },
  )

  // login
  .post(
    "/login",
    async ({ status, body, jwt }) => {
      try {
        const userPayload = await userService.loginUser(body);

        const token = await jwt.sign({
          user_id: userPayload.user_id,
          username: userPayload.username,
          email: userPayload.email,
          role: userPayload.role,
        });

        return status(200, successResponse(200, "Login successful", {
          token,
          user: userPayload,
        }));
      } catch (error: any) {
        if (error?.message === "INVALID_CREDENTIALS") {
          return status(401, errorResponse(401, "Invalid email or password"));
        }
        console.error(error);
        return status(500, errorResponse(500, "Failed to login"));
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    },
  );
