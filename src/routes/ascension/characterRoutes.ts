import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as characterService from "../../services/ascension/characterService.js";

/**
 * Routes for Characters
 */
export const characterRoutes = new Elysia({ prefix: "/characters" })

  // GET /characters
  .get("/", async ({ status }) => {
    try {
      const data = await characterService.getAllCharacters();
      return status(200, successResponse(200, "Characters fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch characters"));
    }
  })

  // GET /characters/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await characterService.getCharacterById(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Character not found"));
      return status(200, successResponse(200, "Character fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch character"));
    }
  })

  // POST /characters
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await characterService.createCharacter(body);
        return status(201, successResponse(201, "Character created", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to create character"));
      }
    },
    {
      body: t.Object({
        name: t.String(),
        rarity: t.Number(),
        element: t.String(),
        weapon_type: t.String(),
        race: t.Optional(t.String()),
        faction: t.Optional(t.String()),
        class: t.Optional(t.String()),
        description: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // PATCH /characters/:id
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await characterService.updateCharacter(Number(params.id), body);
        if (!data) return status(404, errorResponse(404, "Character not found"));
        return status(200, successResponse(200, "Character updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update character"));
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        rarity: t.Optional(t.Number()),
        element: t.Optional(t.String()),
        weapon_type: t.Optional(t.String()),
        race: t.Optional(t.String()),
        faction: t.Optional(t.String()),
        class: t.Optional(t.String()),
        description: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // POST /characters/:id/media
  .post(
    "/:id/media",
    async ({ status, params, body }) => {
      try {
        const file = body.file as File;
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await characterService.uploadCharacterMedia(
          Number(params.id),
          body.field as any,
          buffer,
          file.type,
          file.name,
        );
        if (!data) return status(404, errorResponse(404, "Character not found"));
        return status(200, successResponse(200, `${body.field} uploaded`, data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to upload media"));
      }
    },
    {
      body: t.Object({
        file: t.File(),
        field: t.Union([
          t.Literal("icon"),
          t.Literal("splash_art"),
          t.Literal("card_image"),
          t.Literal("video_enter"),
          t.Literal("video_idle"),
        ]),
      }),
    },
  )

  // DELETE /characters/:id
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await characterService.deleteCharacter(Number(params.id));
      if (!deleted) return status(404, errorResponse(404, "Character not found"));
      return status(200, successResponse(200, "Character deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete character"));
    }
  });
