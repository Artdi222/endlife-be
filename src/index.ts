import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { itemRoutes } from "./routes/itemRoutes.js";
import { dailyRoutes } from "./routes/dailyRoutes.js";
import { taskRoutes } from "./routes/taskRoutes.js";
import { groupRoutes } from "./routes/groupRoutes.js";
import { categoryRoutes } from "./routes/categoryRoutes.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";

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
  .use(adminRoutes)
  .use(userRoutes)
  .use(dailyRoutes)
  .use(categoryRoutes)
  .use(groupRoutes)
  .use(taskRoutes)
  .use(itemRoutes)

  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

// Export app type for Eden Treaty on the frontend
export type App = typeof app;