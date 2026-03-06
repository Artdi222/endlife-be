import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { registerUser, loginUser } from "../controllers/authControllers.js";

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
        const userPayload = await registerUser(body);

        const token = await jwt.sign({
          user_id: userPayload.user_id,
          username: userPayload.username,
          email: userPayload.email,
        });

        return status(201, {
          status: 201,
          message: "User registered successfully",
          data: {
            token,
            user: userPayload,
          },
        });
      } catch (error: any) {
        if (error?.message === "EMAIL_TAKEN") {
          return status(409, {
            status: 409,
            message: "Email already in use",
            data: null,
          });
        }
        return status(500, {
          status: 500,
          message: "Failed to register user",
          data: null,
        });
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
        const userPayload = await loginUser(body);

        const token = await jwt.sign({
          user_id: userPayload.user_id,
          username: userPayload.username,
          email: userPayload.email,
        });

        return status(200, {
          status: 200,
          message: "Login successful",
          data: {
            token,
            user: userPayload,
          },
        });
      } catch (error: any) {
        if (error?.message === "INVALID_CREDENTIALS") {
          return status(401, {
            status: 401,
            message: "Invalid email or password",
            data: null,
          });
        }
        return status(500, {
          status: 500,
          message: "Failed to login",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    },
  );
