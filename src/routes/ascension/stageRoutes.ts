import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as stageService from "../../services/ascension/stageService.js";

/**
 * Routes for Ascension Stages
 */
export const stageRoutes = new Elysia({ prefix: "/stages" })

  // GET /stages?entity_type=character&entity_id=1
  .get(
    "/",
    async ({ status, query }) => {
      try {
        const data = await stageService.getStagesForEntity(
          query.entity_type as any,
          Number(query.entity_id),
        );
        return status(200, successResponse(200, "Stages fetched", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to fetch stages"));
      }
    },
    { query: t.Object({ entity_type: t.String(), entity_id: t.String() }) },
  )

  // GET /stages/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await stageService.getStageById(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Stage not found"));
      return status(200, successResponse(200, "Stage fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch stage"));
    }
  })

  // POST /stages
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await stageService.createAscensionStage(body);
        return status(201, successResponse(201, "Stage created", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to create stage"));
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

  // PATCH /stages/:id
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await stageService.updateAscensionStage(
          Number(params.id),
          body,
        );
        if (!data) return status(404, errorResponse(404, "Stage not found"));
        return status(200, successResponse(200, "Stage updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update stage"));
      }
    },
    {
      body: t.Object({
        level_from: t.Optional(t.Number()),
        level_to: t.Optional(t.Number()),
        is_breakthrough: t.Optional(t.Boolean()),
        credit_cost: t.Optional(t.Number()),
      }),
    },
  )

  // DELETE /stages/:id
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await stageService.deleteAscensionStage(Number(params.id));
      if (!deleted) return status(404, errorResponse(404, "Stage not found"));
      return status(200, successResponse(200, "Stage deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete stage"));
    }
  });
