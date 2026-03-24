import { Elysia, t } from "elysia";
import {
  getRequirementsForStage,
  getRequirementById,
  upsertAscensionRequirement,
  updateAscensionRequirement,
  deleteAscensionRequirement,
  bulkUpsertRequirements,
} from "../../controllers/ascension/requirementControllers.js";

export const requirementRoutes = new Elysia({
  prefix: "/ascension/requirements",
})

  // GET /ascension/requirements?stage_id=3
  .get(
    "/",
    async ({ status, query }) => {
      try {
        const data = await getRequirementsForStage(Number(query.stage_id));
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
    },
    { query: t.Object({ stage_id: t.String() }) },
  )

  // GET /ascension/requirements/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await getRequirementById(Number(params.id));
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

  // POST /ascension/requirements — create or update (upsert) a single requirement
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await upsertAscensionRequirement(body);
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
        stage_id: t.Number(),
        item_id: t.Number(),
        quantity: t.Number(),
      }),
    },
  )

  // PATCH /ascension/requirements/:id — update quantity only
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await updateAscensionRequirement(Number(params.id), body);
        if (!data)
          return status(404, {
            status: 404,
            message: "Requirement not found",
            data: null,
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

  // DELETE /ascension/requirements/:id
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteAscensionRequirement(Number(params.id));
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
  })

  // POST /ascension/requirements/bulk — replace all requirements for a stage at once
  // Body: { stage_id: number, items: [{ item_id, quantity }] }
  .post(
    "/bulk",
    async ({ status, body }) => {
      try {
        const data = await bulkUpsertRequirements(body.stage_id, body.items);
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
        stage_id: t.Number(),
        items: t.Array(t.Object({ item_id: t.Number(), quantity: t.Number() })),
      }),
    },
  );
