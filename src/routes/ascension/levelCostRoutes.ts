import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as levelCostService from "../../services/ascension/levelCostService.js";

/**
 * Routes for Level Upgrade Costs
 */
export const levelCostRoutes = new Elysia({ prefix: "/level-costs" })

  // GET /level-costs?entity_type=character
  .get(
    "/",
    async ({ status, query }) => {
      try {
        const data = await levelCostService.getLevelCosts(
          query.entity_type as any,
        );
        return status(200, successResponse(200, "Level costs fetched", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to fetch level costs"));
      }
    },
    { query: t.Object({ entity_type: t.String() }) },
  )

  // GET /level-costs/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await levelCostService.getLevelCostById(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Level cost not found"));
      return status(200, successResponse(200, "Level cost fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch level cost"));
    }
  })

  // GET /level-costs/range — calculate total for a range
  .get(
    "/range",
    async ({ status, query }) => {
      try {
        const data = await levelCostService.getLevelCostRange(
          query.entity_type as any,
          Number(query.from_level),
          Number(query.to_level),
        );
        return status(200, successResponse(200, "Level cost range calculated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to calculate range costs"));
      }
    },
    {
      query: t.Object({
        entity_type: t.String(),
        from_level: t.String(),
        to_level: t.String(),
      }),
    },
  )

  // PUT /level-costs — upsert single
  .put(
    "/",
    async ({ status, body }) => {
      try {
        const data = await levelCostService.upsertLevelCost(body);
        return status(200, successResponse(200, "Level cost saved", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to save level cost"));
      }
    },
    {
      body: t.Object({
        entity_type: t.Union([t.Literal("character"), t.Literal("weapon")]),
        level: t.Number(),
        exp_required: t.Number(),
        credit_cost: t.Number(),
      }),
    },
  )

  // POST /level-costs/bulk
  .post(
    "/bulk",
    async ({ status, body }) => {
      try {
        const data = await levelCostService.bulkUpsertLevelCosts(
          body.entity_type as any,
          body.rows,
        );
        return status(200, successResponse(200, "Level costs bulk updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to bulk update level costs"));
      }
    },
    {
      body: t.Object({
        entity_type: t.String(),
        rows: t.Array(
          t.Object({
            level: t.Number(),
            exp_required: t.Number(),
            credit_cost: t.Number(),
          }),
        ),
      }),
    },
  )

  // DELETE /level-costs/:id
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await levelCostService.deleteLevelCost(Number(params.id));
      if (!deleted) return status(404, errorResponse(404, "Level cost not found"));
      return status(200, successResponse(200, "Level cost deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete level cost"));
    }
  });
