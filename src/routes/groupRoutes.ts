import { Elysia, t } from "elysia";
import {
  getGroupsByCategoryId,
  createGroup,
  createSubGroup,
  deleteGroup,
  deleteSubGroup,
  updateGroup,
  updateSubGroup,
  getSubGroupsByGroupId,
} from "../controllers/groupControllers.js";
import type {
  CreateGroupDTO,
  CreateSubGroupDTO,
  UpdateGroupDTO,
  UpdateSubGroupDTO,
} from "../types/groupTypes.js";
import { adminMiddleware } from "../middleware/authMiddleware.js";

export const groupRoutes = new Elysia({ prefix: "/groups" })
  .use(adminMiddleware)

  // get all groups by category id
  .get("/category/:id", async ({ status, params }) => {
    try {
      const groups = await getGroupsByCategoryId(Number(params.id));
      return status(200, {
        status: 200,
        message: "Success to get all groups by category id",
        data: groups,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to get groups by category id",
        data: null,
      });
    }
  })

  // create group
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const { category_id, name, order_index } = body as CreateGroupDTO;

        const newGroup = await createGroup({
          category_id,
          name,
          order_index,
        });

        return status(201, {
          status: 201,
          message: "Group created successfully",
          data: newGroup,
        });
      } catch (error: any) {
        return status(500, {
          status: 500,
          message: "Failed to create group",
          data: null,
        });
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
  .put(
    "/:id",
    async ({ status, body, params }) => {
      try {
        const updated = await updateGroup(
          Number(params.id),
          body as UpdateGroupDTO,
        );
        return status(200, {
          status: 200,
          message: "Group updated",
          data: updated,
        });
      } catch (error: any) {
        if (error.message === "No fields to update") {
          return status(400, {
            status: 400,
            message: "No fields to update",
            data: null,
          });
        }

        return status(500, {
          status: 500,
          message: "Failed to update group",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        id: t.Number(),
        category_id: t.Number(),
        name: t.String(),
        order_index: t.Number(),
      }),
    },
  )

  // delete group
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteGroup(Number(params.id));
      return status(200, {
        status: 200,
        message: "Group deleted",
        data: deleted,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete group",
        data: null,
      });
    }
  })

  // get sub groups by group id
  .get("/sub/:groupId", async ({ status, params }) => {
    try {
      const subGroups = await getSubGroupsByGroupId(Number(params.groupId));
      return status(200, { status: 200, message: "Success", data: subGroups });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to get sub groups by group id",
        data: null,
      });
    }
  })

  // create sub group
  .post(
    "/sub",
    async ({ status, body }) => {
      try {
        const { group_id, name, order_index } = body as CreateSubGroupDTO;

        const newSubGroup = await createSubGroup({
          group_id,
          name,
          order_index,
        });

        return status(201, {
          status: 201,
          message: "Sub group created successfully",
          data: newSubGroup,
        });
      } catch (error: any) {
        return status(500, {
          status: 500,
          message: "Failed to create sub group",
          data: null,
        });
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
  .put(
    "/sub/:id",
    async ({ status, body, params }) => {
      try {
        const updated = await updateSubGroup(
          Number(params.id),
          body as UpdateSubGroupDTO,
        );
        return status(200, {
          status: 200,
          message: "Sub group updated",
          data: updated,
        });
      } catch (error: any) {
        if (error.message === "No fields to update") {
          return status(400, {
            status: 400,
            message: "No fields to update",
            data: null,
          });
        }

        return status(500, {
          status: 500,
          message: "Failed to update sub group",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        id: t.Number(),
        group_id: t.Number(),
        name: t.String(),
        order_index: t.Number(),
      }),
    },
  )

  // delete sub group
  .delete("/sub/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteSubGroup(Number(params.id));
      return status(200, {
        status: 200,
        message: "Sub group deleted",
        data: deleted,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete sub group",
        data: null,
      });
    }
  });
