import { Elysia } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import { getAdminStructure } from "../../services/daily/adminService.js";

export const adminRoutes = new Elysia({ prefix: "/admin" })

  .get("/structure", async ({ status }) => {
    try {
      const data = await getAdminStructure();
      return status(200, successResponse(200, "Admin structure fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch admin structure"));
    }
  });
