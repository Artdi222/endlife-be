import { Elysia, t } from "elysia";
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/itemControllers.js";
import { createItemDTO, UpdateItemDTO } from "../types/itemTypes.js";
import { adminMiddleware } from "../middleware/authMiddleware.js";

export const itemRoutes = new Elysia({ prefix: "/items" })
  .use(adminMiddleware)

  // get all items
  .get("/", async ({ status }) => {
    try {
      const items = await getAllItems();

      return status(200, {
        status: 200,
        message: "Items fetched successfully",
        data: items,
      });
    } catch (error) {
      return status(500, {
        status: 500,
        message: "Failed to fetch items",
      });
    }
  })

  // get item by id
  .get("/:id", async ({ status, params }) => {
    try {
      const item = await getItemById(params.id);

      if (!item) {
        return status(404, {
          status: 404,
          message: "Item not found",
        });
      }

      return status(200, {
        status: 200,
        message: "Item fetched successfully",
        data: item,
      });
    } catch (error) {
      return status(500, {
        status: 500,
        message: "Failed to fetch item",
      });
    }
  })

  // create item
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const { id, name, image_path, rarity, type } = body as createItemDTO;

        const newItem = await createItem({
          id,
          name,
          image_path,
          rarity,
          type,
        });

        return status(201, {
          status: 201,
          message: "Item created successfully",
          data: newItem,
        });
      } catch (error: any) {
        if (error.code === "23505") {
          return status(400, {
            status: 400,
            message: "Item with this ID already exists",
            data: null,
          });
        }
        return status(500, {
          status: 500,
          message: "Failed to create item",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        id: t.String(),
        name: t.String(),
        image_path: t.Nullable(t.String()),
        rarity: t.Number(),
        type: t.String(),
      }),
    },
  )

  // update item
  .put(
    "/:id",
    async ({ params, body, status }) => {
      try {
        const updated = await updateItem(params.id, body as UpdateItemDTO);

        if (!updated) {
          return status(404, {
            status: 404,
            message: "Item not found",
            data: null,
          });
        }

        return status(200, {
          status: 200,
          message: "Item updated successfully",
          data: updated,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to update item",
          data: null,
        });
      }
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String(),
          image_path: t.Nullable(t.String()),
          rarity: t.Number(),
          type: t.String(),
        }),
      ),
    },
  )

  .delete("/:id", async ({ params, status }) => {
    try {
      const deleted = await deleteItem(params.id);

      if (!deleted) {
        return status(404, {
          status: 404,
          message: "Item not found",
          data: null,
        });
      }

      return status(200, {
        status: 200,
        message: "Item deleted successfully",
        data: deleted,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete item",
      });
    }
  });

