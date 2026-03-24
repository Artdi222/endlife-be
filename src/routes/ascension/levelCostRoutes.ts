import { Elysia, t } from "elysia";
import {
  getLevelCosts,
  getLevelCostById,
  getLevelCostByLevel,
  getLevelCostRange,
  upsertLevelCost,
  bulkUpsertLevelCosts,
  deleteLevelCost,
} from "../../controllers/ascension/levelCostControllers.js";

export const levelCostRoutes = new Elysia({ prefix: "/ascension/level-costs" })

  // GET /ascension/level-costs?entity_type=character
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
        const data = await getLevelCosts(entityType);
        return status(200, {
          status: 200,
          message: "Level costs fetched",
          data,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to fetch level costs",
          data: null,
        });
      }
    },
    { query: t.Object({ entity_type: t.String() }) },
  )

  // GET /ascension/level-costs/range?entity_type=character&from=1&to=20
  .get(
    "/range",
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
        const data = await getLevelCostRange(
          entityType,
          Number(query.from),
          Number(query.to),
        );
        return status(200, {
          status: 200,
          message: "Level cost range fetched",
          data,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to fetch range",
          data: null,
        });
      }
    },
    {
      query: t.Object({
        entity_type: t.String(),
        from: t.String(),
        to: t.String(),
      }),
    },
  )

  // GET /ascension/level-costs/by-level?entity_type=character&level=40
  .get(
    "/by-level",
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
        const data = await getLevelCostByLevel(entityType, Number(query.level));
        if (!data)
          return status(404, {
            status: 404,
            message: "Level cost not found",
            data: null,
          });
        return status(200, {
          status: 200,
          message: "Level cost fetched",
          data,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to fetch level cost",
          data: null,
        });
      }
    },
    { query: t.Object({ entity_type: t.String(), level: t.String() }) },
  )

  // GET /ascension/level-costs/:id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await getLevelCostById(Number(params.id));
      if (!data)
        return status(404, {
          status: 404,
          message: "Level cost not found",
          data: null,
        });
      return status(200, { status: 200, message: "Level cost fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch level cost",
        data: null,
      });
    }
  })

  // POST /ascension/level-costs — upsert a single level cost
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await upsertLevelCost(body);
        return status(200, {
          status: 200,
          message: `Level ${body.level} cost saved`,
          data,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to save level cost",
          data: null,
        });
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

  // POST /ascension/level-costs/bulk — seed all 90 levels at once
  // Body: { entity_type, rows: [{ level, exp_required, credit_cost }] }
  .post(
    "/bulk",
    async ({ status, body }) => {
      try {
        const data = await bulkUpsertLevelCosts(body.entity_type, body.rows);
        return status(200, {
          status: 200,
          message: `${data.length} level costs saved`,
          data,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to bulk save level costs",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        entity_type: t.Union([t.Literal("character"), t.Literal("weapon")]),
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

  // DELETE /ascension/level-costs/:id
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteLevelCost(Number(params.id));
      if (!deleted)
        return status(404, {
          status: 404,
          message: "Level cost not found",
          data: null,
        });
      return status(200, {
        status: 200,
        message: "Level cost deleted",
        data: null,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete level cost",
        data: null,
      });
    }
  });
