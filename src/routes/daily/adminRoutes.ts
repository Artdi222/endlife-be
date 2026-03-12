import { Elysia } from "elysia";
import { getAdminStructure } from "../../controllers/daily/adminControllers.js";
import { adminMiddleware } from "../../middleware/authMiddleware.js";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(adminMiddleware)
  .get(
  "/structure",
  async ({ status }) => {
    try {
      const data = await getAdminStructure();
      return status(200, {
        status: 200,
        message: "Admin structure fetched successfully",
        data,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch admin structure",
        data: null,
      });
    }
  },
);
