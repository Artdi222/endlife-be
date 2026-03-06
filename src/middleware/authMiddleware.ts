import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import type { JWTPayload } from "../types/authTypes.js";

const jwtPlugin = () =>
  jwt({
    name: "jwt",
    secret: process.env.JWT_SECRET!,
  });

// Reusable auth guard — verifies Bearer JWT and injects `user` into context
// Use on routes that require login but NOT admin
export const authMiddleware = new Elysia({ name: "authMiddleware" })
  .use(bearer())
  .use(jwtPlugin())
  .derive(async ({ bearer, jwt, status }) => {
    if (!bearer) {
      throw status(401, {
        status: 401,
        message: "Missing authorization token",
        data: null,
      });
    }

    const payload = await jwt.verify(bearer);

    if (!payload) {
      throw status(401, {
        status: 401,
        message: "Invalid or expired token",
        data: null,
      });
    }

    return {
      user: payload as unknown as JWTPayload,
    };
  });

// Admin-only guard — self-contained, verifies JWT AND checks role = admin
export const adminMiddleware = new Elysia({ name: "adminMiddleware" })
  .use(bearer())
  .use(jwtPlugin())
  .derive(async ({ bearer, jwt, status }) => {
    if (!bearer) {
      throw status(401, {
        status: 401,
        message: "Missing authorization token",
        data: null,
      });
    }

    const payload = await jwt.verify(bearer);

    if (!payload) {
      throw status(401, {
        status: 401,
        message: "Invalid or expired token",
        data: null,
      });
    }

    const user = payload as unknown as JWTPayload;

    if (user.role !== "admin") {
      throw status(403, {
        status: 403,
        message: "Forbidden: admin access only",
        data: null,
      });
    }

    return { user };
  });
