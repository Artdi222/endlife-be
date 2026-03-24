import { Elysia, t } from "elysia";
import {
  getStagesForEntity,
  getStageById,
  levelToStageNumber,
  createAscensionStage,
  updateAscensionStage,
  deleteAscensionStage,
} from "../../controllers/ascension/stageControllers.js";

export const stageRoutes = new Elysia({ prefix: "/ascension/stages" })

  // GET /ascension/stages?entity_type=character&entity_id=1
  .get(
    "/",
    async ({ status, query }) => {
      try {
        const entityType = query.entity_type as "character" | "weapon";
        if (!["character", "weapon"].includes(entityType)) {
          return status(400, {
            status: 400,
            message: "entity_type must be 'character' or 'weapon'",
            data: null,
          });
        }
        const data = await getStagesForEntity(
          entityType,
          Number(query.entity_id),
        );
        return status(200, { status: 200, message: "Stages fetched", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to fetch stages",
          data: null,
        });
      }
    },
    { query: t.Object({ entity_type: t.String(), entity_id: t.String() }) },
  )

  // GET /ascension/stages/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await getStageById(Number(params.id));
      if (!data)
        return status(404, {
          status: 404,
          message: "Stage not found",
          data: null,
        });
      return status(200, { status: 200, message: "Stage fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch stage",
        data: null,
      });
    }
  })

  // GET /ascension/stages/level-to-stage?entity_type=character&entity_id=1&level=40
  .get(
    "/level-to-stage",
    async ({ status, query }) => {
      try {
        const entityType = query.entity_type as "character" | "weapon";
        if (!["character", "weapon"].includes(entityType)) {
          return status(400, {
            status: 400,
            message: "entity_type must be 'character' or 'weapon'",
            data: null,
          });
        }
        const stageNumber = await levelToStageNumber(
          entityType,
          Number(query.entity_id),
          Number(query.level),
        );
        if (stageNumber === null) {
          return status(404, {
            status: 404,
            message: "No matching stage found for this level",
            data: null,
          });
        }
        return status(200, {
          status: 200,
          message: "Stage number resolved",
          data: { stage_number: stageNumber },
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to resolve level to stage",
          data: null,
        });
      }
    },
    {
      query: t.Object({
        entity_type: t.String(),
        entity_id: t.String(),
        level: t.String(),
      }),
    },
  )

  // POST /ascension/stages
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await createAscensionStage(body);
        return status(201, { status: 201, message: "Stage created", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to create stage",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        entity_type: t.Union([t.Literal("character"), t.Literal("weapon")]),
        entity_id: t.Number(),
        stage_number: t.Number(),
        level_from: t.Number(),
        level_to: t.Number(),
        is_breakthrough: t.Optional(t.Boolean()),
        credit_cost: t.Optional(t.Number()),
      }),
    },
  )

  // PATCH /ascension/stages/:id — credit_cost only
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await updateAscensionStage(Number(params.id), body);
        if (!data)
          return status(404, {
            status: 404,
            message: "Stage not found",
            data: null,
          });
        return status(200, { status: 200, message: "Stage updated", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to update stage",
          data: null,
        });
      }
    },
    { body: t.Object({ credit_cost: t.Optional(t.Number()) }) },
  )

  // DELETE /ascension/stages/:id — cascades to requirements
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteAscensionStage(Number(params.id));
      if (!deleted)
        return status(404, {
          status: 404,
          message: "Stage not found",
          data: null,
        });
      return status(200, { status: 200, message: "Stage deleted", data: null });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete stage",
        data: null,
      });
    }
  });
