import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as weaponService from "../../services/ascension/weaponService.js";

/**
 * Routes for Weapons
 */
export const weaponRoutes = new Elysia({ prefix: "/weapons" })

  // GET /weapons
  .get("/", async ({ status }) => {
    try {
      const data = await weaponService.getAllWeapons();
      return status(200, successResponse(200, "Weapons fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch weapons"));
    }
  })

  // GET /weapons/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await weaponService.getWeaponById(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Weapon not found"));
      return status(200, successResponse(200, "Weapon fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch weapon"));
    }
  })

  // POST /weapons
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await weaponService.createWeapon(body);
        return status(201, successResponse(201, "Weapon created", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to create weapon"));
      }
    },
    {
      body: t.Object({
        name: t.String(),
        rarity: t.Number(),
        type: t.String(),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // PATCH /weapons/:id
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await weaponService.updateWeapon(Number(params.id), body);
        if (!data) return status(404, errorResponse(404, "Weapon not found"));
        return status(200, successResponse(200, "Weapon updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update weapon"));
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        rarity: t.Optional(t.Number()),
        type: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // POST /weapons/:id/icon
  .post(
    "/:id/icon",
    async ({ status, params, body }) => {
      try {
        const file = body.file as File;
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await weaponService.uploadWeaponIcon(
          Number(params.id),
          buffer,
          file.type,
          file.name,
        );
        if (!data) return status(404, errorResponse(404, "Weapon not found"));
        return status(200, successResponse(200, "Icon uploaded", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to upload icon"));
      }
    },
    { body: t.Object({ file: t.File() }) },
  )

  // DELETE /weapons/:id
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await weaponService.deleteWeapon(Number(params.id));
      if (!deleted) return status(404, errorResponse(404, "Weapon not found"));
      return status(200, successResponse(200, "Weapon deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete weapon"));
    }
  });
