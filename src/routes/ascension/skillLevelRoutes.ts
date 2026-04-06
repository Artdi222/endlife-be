import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as skillLevelService from "../../services/ascension/skillLevelService.js";

/**
 * Routes for Skill Levels and Requirements
 */
export const skillLevelRoutes = new Elysia({ prefix: "/skill-levels" })

  // GET /skill-levels?skill_id=1
  .get(
    "/",
    async ({ status, query }) => {
      try {
        const data = await skillLevelService.getSkillLevels(Number(query.skill_id));
        return status(200, successResponse(200, "Skill levels fetched", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to fetch skill levels"));
      }
    },
    { query: t.Object({ skill_id: t.String() }) },
  )

  // GET /skill-levels/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await skillLevelService.getSkillLevelById(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Skill level not found"));
      return status(200, successResponse(200, "Skill level fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch skill level"));
    }
  })

  // PUT /skill-levels — upsert single level
  .put(
    "/",
    async ({ status, body }) => {
      try {
        const data = await skillLevelService.upsertSkillLevel(body);
        return status(200, successResponse(200, "Skill level saved", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to save skill level"));
      }
    },
    {
      body: t.Object({
        skill_id: t.Number(),
        level: t.Number(),
        credit_cost: t.Optional(t.Number()),
      }),
    },
  )

  // PATCH /skill-levels/:id — update credit_cost
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await skillLevelService.updateSkillLevel(
          Number(params.id),
          body,
        );
        if (!data) return status(404, errorResponse(404, "Skill level not found"));
        return status(200, successResponse(200, "Skill level updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update skill level"));
      }
    },
    {
      body: t.Object({
        credit_cost: t.Optional(t.Number()),
      }),
    },
  )

  // DELETE /skill-levels/:id
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await skillLevelService.deleteSkillLevel(Number(params.id));
      if (!deleted) return status(404, errorResponse(404, "Skill level not found"));
      return status(200, successResponse(200, "Skill level deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete skill level"));
    }
  })

  // ── REQUIREMENTS ────────────────────────────────────────────────────────────

  // GET /skill-levels/:id/requirements
  .get("/:id/requirements", async ({ status, params }) => {
    try {
      const data = await skillLevelService.getRequirementsForSkillLevel(
        Number(params.id),
      );
      return status(200, successResponse(200, "Requirements fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch requirements"));
    }
  })

  // PUT /skill-levels/requirements — upsert single requirement
  .put(
    "/requirements",
    async ({ status, body }) => {
      try {
        const data = await skillLevelService.upsertSkillLevelRequirement(body);
        return status(200, successResponse(200, "Requirement saved", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to save requirement"));
      }
    },
    {
      body: t.Object({
        skill_level_id: t.Number(),
        item_id: t.Number(),
        quantity: t.Number(),
      }),
    },
  )

  // POST /skill-levels/:id/requirements/bulk
  .post(
    "/:id/requirements/bulk",
    async ({ status, params, body }) => {
      try {
        const data = await skillLevelService.bulkUpsertSkillLevelRequirements(
          Number(params.id),
          body.items,
        );
        return status(200, successResponse(200, "Requirements bulk updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to bulk update requirements"));
      }
    },
    {
      body: t.Object({
        items: t.Array(t.Object({ item_id: t.Number(), quantity: t.Number() })),
      }),
    },
  )

  // DELETE /skill-levels/requirements/:id
  .delete("/requirements/:id", async ({ status, params }) => {
    try {
      const deleted = await skillLevelService.deleteSkillLevelRequirement(
        Number(params.id),
      );
      if (!deleted) return status(404, errorResponse(404, "Requirement not found"));
      return status(200, successResponse(200, "Requirement deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete requirement"));
    }
  });
