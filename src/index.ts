import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { dailyRoutes } from "./routes/daily/dailyRoutes.js";
import { taskRoutes } from "./routes/daily/taskRoutes.js";
import { groupRoutes } from "./routes/daily/groupRoutes.js";
import { categoryRoutes } from "./routes/daily/categoryRoutes.js";
import { adminRoutes } from "./routes/daily/adminRoutes.js";
import { userRoutes } from "./routes/daily/userRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { characterRoutes } from "./routes/ascension/characterRoutes.js";
import { weaponRoutes } from "./routes/ascension/weaponRoutes.js";
import { itemRoutes } from "./routes/ascension/itemRoutes.js";

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )

  // Public routes
  .use(authRoutes)

  // Protected routes (JWT required)
  // daily
  .use(adminRoutes)
  .use(userRoutes)
  .use(dailyRoutes)
  .use(categoryRoutes)
  .use(groupRoutes)
  .use(taskRoutes)

  // ascension
  .use(characterRoutes)
  .use(weaponRoutes)
  .use(itemRoutes)

  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

// Export app type for Eden Treaty on the frontend
export type App = typeof app;
