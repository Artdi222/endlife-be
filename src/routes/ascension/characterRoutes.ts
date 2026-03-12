import { Elysia, t } from "elysia";
import {
  getAllCharacters,
  getCharacterById,
  createCharacter,
  updateCharacter,
  uploadCharacterMedia,
  deleteCharacter,
} from "../../controllers/ascension/characterControllers.js";

export const characterRoutes = new Elysia({ prefix: "/characters" })

  // GET all characters
  .get("/", async ({ status }) => {
    try {
      const data = await getAllCharacters();
      return status(200, { status: 200, message: "Characters fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch characters",
        data: null,
      });
    }
  })

  // GET character by id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await getCharacterById(Number(params.id));
      if (!data)
        return status(404, {
          status: 404,
          message: "Character not found",
          data: null,
        });
      return status(200, { status: 200, message: "Character fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch character",
        data: null,
      });
    }
  })

  // POST create character (text fields only, media uploaded separately)
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await createCharacter(body);
        return status(201, { status: 201, message: "Character created", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to create character",
          data: null,
        });
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
        description: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // PATCH update character text fields
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await updateCharacter(Number(params.id), body);
        if (!data)
          return status(404, {
            status: 404,
            message: "Character not found",
            data: null,
          });
        return status(200, { status: 200, message: "Character updated", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to update character",
          data: null,
        });
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
        description: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // POST upload character media
  .post(
    "/:id/media",
    async ({ status, params, body }) => {
      try {
        const field = body.field as
          | "icon"
          | "splash_art"
          | "video_enter"
          | "video_idle";
        const validFields = ["icon", "splash_art", "video_enter", "video_idle"];
        if (!validFields.includes(field)) {
          return status(400, {
            status: 400,
            message: `Invalid field. Must be one of: ${validFields.join(", ")}`,
            data: null,
          });
        }

        const file = body.file as File;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await uploadCharacterMedia(
          Number(params.id),
          field,
          buffer,
          file.type,
          file.name,
        );

        if (!data)
          return status(404, {
            status: 404,
            message: "Character not found",
            data: null,
          });
        return status(200, { status: 200, message: `${field} uploaded`, data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to upload media",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        field: t.String(),
        file: t.File(),
      }),
    },
  )

  // DELETE character
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteCharacter(Number(params.id));
      if (!deleted)
        return status(404, {
          status: 404,
          message: "Character not found",
          data: null,
        });
      return status(200, {
        status: 200,
        message: "Character deleted",
        data: null,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete character",
        data: null,
      });
    }
  });
