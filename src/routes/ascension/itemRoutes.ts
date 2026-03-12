import { Elysia, t } from "elysia";
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  uploadItemImage,
  deleteItem,
} from "../../controllers/ascension/itemControllers.js";

const ITEM_CATEGORIES = [
  "Progression Materials",
  "Naturals",
  "Gatherables",
  "Rare Materials",
  "AIC Products",
  "Usables",
  "Functionals",
  "Operator Gifts",
  "Currency",
] as const;

export const itemRoutes = new Elysia({ prefix: "/items" })

  // GET all items
  .get("/", async ({ status }) => {
    try {
      const data = await getAllItems();
      return status(200, { status: 200, message: "Items fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch items",
        data: null,
      });
    }
  })

  // GET item by id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await getItemById(Number(params.id));
      if (!data)
        return status(404, {
          status: 404,
          message: "Item not found",
          data: null,
        });
      return status(200, { status: 200, message: "Item fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch item",
        data: null,
      });
    }
  })

  // POST create item
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await createItem(body);
        return status(201, { status: 201, message: "Item created", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to create item",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        name: t.String(),
        category: t.Union(ITEM_CATEGORIES.map((c) => t.Literal(c))),
        exp_value: t.Optional(t.Number()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // PATCH update item text fields
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await updateItem(Number(params.id), body);
        if (!data)
          return status(404, {
            status: 404,
            message: "Item not found",
            data: null,
          });
        return status(200, { status: 200, message: "Item updated", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to update item",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        category: t.Optional(t.Union(ITEM_CATEGORIES.map((c) => t.Literal(c)))),
        exp_value: t.Optional(t.Number()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // POST upload item image
  .post(
    "/:id/image",
    async ({ status, params, body }) => {
      try {
        const file = body.file as File;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await uploadItemImage(
          Number(params.id),
          buffer,
          file.type,
          file.name,
        );

        if (!data)
          return status(404, {
            status: 404,
            message: "Item not found",
            data: null,
          });
        return status(200, { status: 200, message: "Image uploaded", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to upload image",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    },
  )

  // DELETE item
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteItem(Number(params.id));
      if (!deleted)
        return status(404, {
          status: 404,
          message: "Item not found",
          data: null,
        });
      return status(200, {
        status: 200,
        message: "Item deleted",
        data: null,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete item",
        data: null,
      });
    }
  });
