import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as groupService from "../../services/daily/groupService.js";

export const groupRoutes = new Elysia({ prefix: "/groups" })

  // get groups by category id
  .get("/", async ({ status, query }) => {
    try {
      const data = await groupService.getGroupsByCategoryId(Number(query.category_id));
      return status(200, successResponse(200, "Groups fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch groups"));
    }
  }, {
    query: t.Object({
      category_id: t.String(),
    })
  })

  // create group
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await groupService.createGroup(body);
        return status(201, successResponse(201, "Group created", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to create group"));
      }
    },
    {
      body: t.Object({
        category_id: t.Number(),
        name: t.String(),
        order_index: t.Number(),
      }),
    },
  )

  // update group
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await groupService.updateGroup(Number(params.id), body);
        if (!data) return status(404, errorResponse(404, "Group not found"));
        return status(200, successResponse(200, "Group updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update group"));
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
        category_id: t.Optional(t.Number()),
      }),
    },
  )

  // delete group
  .delete("/:id", async ({ status, params }) => {
    try {
      const data = await groupService.deleteGroup(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Group not found"));
      return status(200, successResponse(200, "Group deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete group"));
    }
  })

  // ── SUB GROUPS ─────────────────────────────────────────────────────────────

  // get sub groups by group id
  .get("/sub-groups", async ({ status, query }) => {
    try {
      const data = await groupService.getSubGroupsByGroupId(Number(query.group_id));
      return status(200, successResponse(200, "Sub groups fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch sub groups"));
    }
  }, {
    query: t.Object({
      group_id: t.String(),
    })
  })

  // create sub group
  .post(
    "/sub-groups",
    async ({ status, body }) => {
      try {
        const data = await groupService.createSubGroup(body);
        return status(201, successResponse(201, "Sub group created", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to create sub group"));
      }
    },
    {
      body: t.Object({
        group_id: t.Number(),
        name: t.String(),
        order_index: t.Number(),
      }),
    },
  )

  // update sub group
  .patch(
    "/sub-groups/:id",
    async ({ status, params, body }) => {
      try {
        const data = await groupService.updateSubGroup(Number(params.id), body);
        if (!data) return status(404, errorResponse(404, "Sub group not found"));
        return status(200, successResponse(200, "Sub group updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update sub group"));
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
        group_id: t.Optional(t.Number()),
      }),
    },
  )

  // delete sub group
  .delete("/sub-groups/:id", async ({ status, params }) => {
    try {
      const data = await groupService.deleteSubGroup(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Sub group not found"));
      return status(200, successResponse(200, "Sub group deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete sub group"));
    }
  });
