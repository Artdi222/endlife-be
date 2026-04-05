import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authMiddleware } from "./middleware/authMiddleware.js";

import { authRoutes } from "./routes/authRoutes.js";

import { dailyRoutes } from "./routes/daily/dailyRoutes.js";
import { taskRoutes } from "./routes/daily/taskRoutes.js";
import { groupRoutes } from "./routes/daily/groupRoutes.js";
import { categoryRoutes } from "./routes/daily/categoryRoutes.js";
import { adminRoutes } from "./routes/daily/adminRoutes.js";
import { userRoutes } from "./routes/daily/userRoutes.js";

import { characterRoutes } from "./routes/ascension/characterRoutes.js";
import { weaponRoutes } from "./routes/ascension/weaponRoutes.js";
import { itemRoutes } from "./routes/ascension/itemRoutes.js";
import { stageRoutes } from "./routes/ascension/stageRoutes.js";
import { requirementRoutes } from "./routes/ascension/requirementRoutes.js";
import { levelCostRoutes } from "./routes/ascension/levelCostRoutes.js";
import { skillRoutes } from "./routes/ascension/skillRoutes.js";
import { skillLevelRoutes } from "./routes/ascension/skillLevelRoutes.js";
import { userPlannerRoutes } from "./routes/ascension/userPlannerRoutes.js";
import { newsBannerRoutes } from "./routes/newsBannerRoutes.js";

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )

  // ── Public ────────────────────────────────────────────────────────────────
  .use(authRoutes)

  // ── Protected — all routes below require a valid JWT ──────────────────────
  .use(authMiddleware)

  // daily
  .use(adminRoutes)
  .use(userRoutes)
  .use(dailyRoutes)
  .use(categoryRoutes)
  .use(groupRoutes)
  .use(taskRoutes)

  // ascension — admin / shared data
  .use(characterRoutes)
  .use(weaponRoutes)
  .use(itemRoutes)
  .use(stageRoutes)
  .use(requirementRoutes)
  .use(levelCostRoutes)
  .use(skillRoutes)
  .use(skillLevelRoutes)

  // ascension — user planner (self-contained authMiddleware inside, user.user_id is safe)
  .use(userPlannerRoutes)

  // news banners
  .use(newsBannerRoutes)

  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
