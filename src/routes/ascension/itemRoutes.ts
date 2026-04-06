import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as itemService from "../../services/ascension/itemService.js";

/**
 * Routes for Items
 */
export const itemRoutes = new Elysia({ prefix: "/items" })

  // GET /items
  .get("/", async ({ status }) => {
    try {
      const data = await itemService.getAllItems();
      return status(200, successResponse(200, "Items fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch items"));
    }
  })

  // GET /items/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await itemService.getItemById(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Item not found"));
      return status(200, successResponse(200, "Item fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch item"));
    }
  })

  // POST /items
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await itemService.createItem(body);
        return status(201, successResponse(201, "Item created", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to create item"));
      }
    },
    {
      body: t.Object({
        name: t.String(),
        category: t.Union([
          t.Literal("Progression Materials"),
          t.Literal("Naturals"),
          t.Literal("Gatherables"),
          t.Literal("Rare Materials"),
          t.Literal("AIC Products"),
          t.Literal("Usables"),
          t.Literal("Functionals"),
          t.Literal("Operator Gifts"),
          t.Literal("Currency"),
        ]),
        exp_value: t.Optional(t.Number()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // PATCH /items/:id
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await itemService.updateItem(Number(params.id), body);
        if (!data) return status(404, errorResponse(404, "Item not found"));
        return status(200, successResponse(200, "Item updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update item"));
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        category: t.Optional(
          t.Union([
            t.Literal("Progression Materials"),
            t.Literal("Naturals"),
            t.Literal("Gatherables"),
            t.Literal("Rare Materials"),
            t.Literal("AIC Products"),
            t.Literal("Usables"),
            t.Literal("Functionals"),
            t.Literal("Operator Gifts"),
            t.Literal("Currency"),
          ]),
        ),
        exp_value: t.Optional(t.Number()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // POST /items/:id/image
  .post(
    "/:id/image",
    async ({ status, params, body }) => {
      try {
        const file = body.file as File;
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await itemService.uploadItemImage(
          Number(params.id),
          buffer,
          file.type,
          file.name,
        );
        if (!data) return status(404, errorResponse(404, "Item not found"));
        return status(200, successResponse(200, "Image uploaded", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to upload image"));
      }
    },
    { body: t.Object({ file: t.File() }) },
  )

  // DELETE /items/:id
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await itemService.deleteItem(Number(params.id));
      if (!deleted) return status(404, errorResponse(404, "Item not found"));
      return status(200, successResponse(200, "Item deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete item"));
    }
  });
