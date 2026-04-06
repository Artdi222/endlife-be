import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as requirementService from "../../services/ascension/requirementService.js";

/**
 * Routes for Ascension Requirements
 */
export const requirementRoutes = new Elysia({ prefix: "/requirements" })

  // GET /requirements?stage_id=1
  .get(
    "/",
    async ({ status, query }) => {
      try {
        const data = await requirementService.getRequirementsForStage(
          Number(query.stage_id),
        );
        return status(200, successResponse(200, "Requirements fetched", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to fetch requirements"));
      }
    },
    { query: t.Object({ stage_id: t.String() }) },
  )

  // GET /requirements/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await requirementService.getRequirementById(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Requirement not found"));
      return status(200, successResponse(200, "Requirement fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch requirement"));
    }
  })

  // PUT /requirements — upsert single
  .put(
    "/",
    async ({ status, body }) => {
      try {
        const data = await requirementService.upsertAscensionRequirement(body);
        return status(200, successResponse(200, "Requirement saved", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to save requirement"));
      }
    },
    {
      body: t.Object({
        stage_id: t.Number(),
        item_id: t.Number(),
        quantity: t.Number(),
      }),
    },
  )

  // PATCH /requirements/:id — update quantity
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await requirementService.updateAscensionRequirement(
          Number(params.id),
          body,
        );
        if (!data) return status(404, errorResponse(404, "Requirement not found"));
        return status(200, successResponse(200, "Requirement quantity updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update requirement"));
      }
    },
    {
      body: t.Object({
        quantity: t.Number(),
      }),
    },
  )

  // POST /requirements/bulk
  .post(
    "/bulk",
    async ({ status, body }) => {
      try {
        const data = await requirementService.bulkUpsertRequirements(
          body.stage_id,
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
        stage_id: t.Number(),
        items: t.Array(t.Object({ item_id: t.Number(), quantity: t.Number() })),
      }),
    },
  )

  // DELETE /requirements/:id
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await requirementService.deleteAscensionRequirement(
        Number(params.id),
      );
      if (!deleted) return status(404, errorResponse(404, "Requirement not found"));
      return status(200, successResponse(200, "Requirement deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete requirement"));
    }
  });
