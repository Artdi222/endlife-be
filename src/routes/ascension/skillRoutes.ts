import { Elysia, t } from "elysia";
import {
  getSkillsForCharacter,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  uploadSkillIcon,
} from "../../controllers/ascension/skillControllers.js";

export const skillRoutes = new Elysia({ prefix: "/skills" })

  // GET /skills?character_id=1
  .get(
    "/",
    async ({ status, query }) => {
      try {
        const data = await getSkillsForCharacter(Number(query.character_id));
        return status(200, { status: 200, message: "Skills fetched", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to fetch skills",
          data: null,
        });
      }
    },
    { query: t.Object({ character_id: t.String() }) },
  )

  // GET /skills/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await getSkillById(Number(params.id));
      if (!data)
        return status(404, {
          status: 404,
          message: "Skill not found",
          data: null,
        });
      return status(200, { status: 200, message: "Skill fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch skill",
        data: null,
      });
    }
  })

  // POST /skills
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await createSkill(body);
        return status(201, { status: 201, message: "Skill created", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to create skill",
          data: null,
        });
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
        const data = await updateSkill(Number(params.id), body);
        if (!data)
          return status(404, {
            status: 404,
            message: "Skill not found",
            data: null,
          });
        return status(200, { status: 200, message: "Skill updated", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to update skill",
          data: null,
        });
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

  // DELETE /skills/:id — cascades to skill_levels → skill_level_requirements
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteSkill(Number(params.id));
      if (!deleted)
        return status(404, {
          status: 404,
          message: "Skill not found",
          data: null,
        });
      return status(200, { status: 200, message: "Skill deleted", data: null });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete skill",
        data: null,
      });
    }
  })

  // POST /skills/:id/icon
  .post(
    "/:id/icon",
    async ({ status, params, body }) => {
      try {
        const file = body.file as File;
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await uploadSkillIcon(
          Number(params.id),
          buffer,
          file.type,
          file.name,
        );
        if (!data)
          return status(404, {
            status: 404,
            message: "Skill not found",
            data: null,
          });
        return status(200, { status: 200, message: "Icon uploaded", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to upload icon",
          data: null,
        });
      }
    },
    { body: t.Object({ file: t.File() }) },
  );
