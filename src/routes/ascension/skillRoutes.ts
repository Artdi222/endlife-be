import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as skillService from "../../services/ascension/skillService.js";

/**
 * Routes for Skills
 */
export const skillRoutes = new Elysia({ prefix: "/skills" })

  // GET /skills?character_id=1
  .get(
    "/",
    async ({ status, query }) => {
      try {
        const data = await skillService.getSkillsForCharacter(Number(query.character_id));
        return status(200, successResponse(200, "Skills fetched", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to fetch skills"));
      }
    },
    { query: t.Object({ character_id: t.String() }) },
  )

  // GET /skills/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await skillService.getSkillById(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Skill not found"));
      return status(200, successResponse(200, "Skill fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch skill"));
    }
  })

  // POST /skills
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await skillService.createSkill(body);
        return status(201, successResponse(201, "Skill created", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to create skill"));
      }
    },
    {
      body: t.Object({
        character_id: t.Number(),
        name: t.String(),
        type: t.Union([
          t.Literal("skill"),
          t.Literal("talent"),
          t.Literal("spaceship_talent"),
        ]),
        icon: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // PATCH /skills/:id
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await skillService.updateSkill(Number(params.id), body);
        if (!data) return status(404, errorResponse(404, "Skill not found"));
        return status(200, successResponse(200, "Skill updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update skill"));
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        type: t.Optional(
          t.Union([
            t.Literal("skill"),
            t.Literal("talent"),
            t.Literal("spaceship_talent"),
          ]),
        ),
        icon: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // DELETE /skills/:id
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await skillService.deleteSkill(Number(params.id));
      if (!deleted) return status(404, errorResponse(404, "Skill not found"));
      return status(200, successResponse(200, "Skill deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete skill"));
    }
  })

  // POST /skills/:id/icon
  .post(
    "/:id/icon",
    async ({ status, params, body }) => {
      try {
        const file = body.file as File;
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await skillService.uploadSkillIcon(
          Number(params.id),
          buffer,
          file.type,
          file.name,
        );
        if (!data) return status(404, errorResponse(404, "Skill not found"));
        return status(200, successResponse(200, "Icon uploaded", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to upload icon"));
      }
    },
    { body: t.Object({ file: t.File() }) },
  );
