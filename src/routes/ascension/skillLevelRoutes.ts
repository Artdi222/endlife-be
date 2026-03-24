import { Elysia, t } from "elysia";
import {
  getSkillLevels,
  getSkillLevelById,
  upsertSkillLevel,
  updateSkillLevel,
  deleteSkillLevel,
  getRequirementsForSkillLevel,
  getSkillLevelRequirementById,
  upsertSkillLevelRequirement,
  deleteSkillLevelRequirement,
  bulkUpsertSkillLevelRequirements,
} from "../../controllers/ascension/skillLevelControllers.js";

export const skillLevelRoutes = new Elysia({ prefix: "/skill-levels" })

  // GET /skill-levels?skill_id=1
  .get(
    "/",
    async ({ status, query }) => {
      try {
        const data = await getSkillLevels(Number(query.skill_id));
        return status(200, {
          status: 200,
          message: "Skill levels fetched",
          data,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to fetch skill levels",
          data: null,
        });
      }
    },
    { query: t.Object({ skill_id: t.String() }) },
  )

  // GET /skill-levels/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await getSkillLevelById(Number(params.id));
      if (!data)
        return status(404, {
          status: 404,
          message: "Skill level not found",
          data: null,
        });
      return status(200, { status: 200, message: "Skill level fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch skill level",
        data: null,
      });
    }
  })

  // POST /skill-levels — create or update (upsert on skill_id + level conflict)
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await upsertSkillLevel(body);
        return status(201, { status: 201, message: "Skill level saved", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to save skill level",
          data: null,
        });
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
        const data = await updateSkillLevel(Number(params.id), body);
        if (!data)
          return status(404, {
            status: 404,
            message: "Skill level not found",
            data: null,
          });
        return status(200, {
          status: 200,
          message: "Skill level updated",
          data,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to update skill level",
          data: null,
        });
      }
    },
    { body: t.Object({ credit_cost: t.Optional(t.Number()) }) },
  )

  // DELETE /skill-levels/:id — cascades to requirements
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteSkillLevel(Number(params.id));
      if (!deleted)
        return status(404, {
          status: 404,
          message: "Skill level not found",
          data: null,
        });
      return status(200, {
        status: 200,
        message: "Skill level deleted",
        data: null,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete skill level",
        data: null,
      });
    }
  })

  // GET /skill-levels/:id/requirements
  .get("/:id/requirements", async ({ status, params }) => {
    try {
      const data = await getRequirementsForSkillLevel(Number(params.id));
      return status(200, {
        status: 200,
        message: "Requirements fetched",
        data,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch requirements",
        data: null,
      });
    }
  })

  // POST /skill-levels/:id/requirements/bulk — replace all requirements for a level
  .post(
    "/:id/requirements/bulk",
    async ({ status, params, body }) => {
      try {
        const data = await bulkUpsertSkillLevelRequirements(
          Number(params.id),
          body.items,
        );
        return status(200, {
          status: 200,
          message: "Requirements replaced",
          data,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to bulk upsert requirements",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        items: t.Array(t.Object({ item_id: t.Number(), quantity: t.Number() })),
      }),
    },
  )

  // GET /skill-levels/requirements/:id — single requirement by id
  .get("/requirements/:id", async ({ status, params }) => {
    try {
      const data = await getSkillLevelRequirementById(Number(params.id));
      if (!data)
        return status(404, {
          status: 404,
          message: "Requirement not found",
          data: null,
        });
      return status(200, { status: 200, message: "Requirement fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch requirement",
        data: null,
      });
    }
  })

  // POST /skill-levels/requirements — upsert a single requirement
  .post(
    "/requirements",
    async ({ status, body }) => {
      try {
        const data = await upsertSkillLevelRequirement(body);
        return status(201, { status: 201, message: "Requirement saved", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to save requirement",
          data: null,
        });
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

  // PATCH /skill-levels/requirements/:id — update quantity only
  .patch(
    "/requirements/:id",
    async ({ status, params, body }) => {
      try {
        // Reuse upsertSkillLevelRequirement isn't ideal for patch — fetch first then delegate
        const existing = await getSkillLevelRequirementById(Number(params.id));
        if (!existing)
          return status(404, {
            status: 404,
            message: "Requirement not found",
            data: null,
          });
        const data = await upsertSkillLevelRequirement({
          skill_level_id: existing.skill_level_id,
          item_id: existing.item_id,
          quantity: body.quantity,
        });
        return status(200, {
          status: 200,
          message: "Requirement updated",
          data,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to update requirement",
          data: null,
        });
      }
    },
    { body: t.Object({ quantity: t.Number() }) },
  )

  // DELETE /skill-levels/requirements/:id
  .delete("/requirements/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteSkillLevelRequirement(Number(params.id));
      if (!deleted)
        return status(404, {
          status: 404,
          message: "Requirement not found",
          data: null,
        });
      return status(200, {
        status: 200,
        message: "Requirement deleted",
        data: null,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete requirement",
        data: null,
      });
    }
  });
