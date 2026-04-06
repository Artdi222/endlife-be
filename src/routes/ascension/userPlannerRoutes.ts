import { Elysia, t } from "elysia";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as userCharacterService from "../../services/ascension/userCharacterService.js";
import * as userWeaponService from "../../services/ascension/userWeaponService.js";
import * as inventoryService from "../../services/ascension/inventoryService.js";
import * as plannerSummaryService from "../../services/ascension/plannerSummaryService.js";

/**
 * Routes for the User Planner (Characters, Weapons, Inventory, Summary)
 */
export const userPlannerRoutes = new Elysia({ prefix: "/user-planner" })
  .use(authMiddleware)

  // ── CHARACTERS ─────────────────────────────────────────────────────────────

  // GET /user-planner/characters
  .get("/characters", async ({ status, user }) => {
    try {
      const data = await userCharacterService.getUserCharacters(user.user_id);
      return status(200, successResponse(200, "User characters fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch user characters"));
    }
  })

  // GET /user-planner/characters/:id
  .get("/characters/:id", async ({ status, user, params }) => {
    try {
      const data = await userCharacterService.getUserCharacterById(Number(params.id));
      if (!data || data.user_id !== user.user_id) {
        return status(404, errorResponse(404, "User character not found"));
      }
      return status(200, successResponse(200, "User character fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch user character"));
    }
  })

  // POST /user-planner/characters
  .post(
    "/characters",
    async ({ status, user, body }) => {
      try {
        const data = await userCharacterService.addUserCharacter(user.user_id, body);
        return status(201, successResponse(201, "Character added to plan", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to add character"));
      }
    },
    {
      body: t.Object({
        character_id: t.Number(),
        current_level: t.Optional(t.Number()),
        target_level: t.Optional(t.Number()),
        current_ascension_stage: t.Optional(t.Number()),
        target_ascension_stage: t.Optional(t.Number()),
      }),
    },
  )

  // PATCH /user-planner/characters/:id
  .patch(
    "/characters/:id",
    async ({ status, user, params, body }) => {
      try {
        const data = await userCharacterService.updateUserCharacter(
          Number(params.id),
          user.user_id,
          body,
        );
        if (!data) return status(404, errorResponse(404, "User character not found"));
        return status(200, successResponse(200, "Character plan updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update character"));
      }
    },
    {
      body: t.Object({
        current_level: t.Optional(t.Number()),
        target_level: t.Optional(t.Number()),
        current_ascension_stage: t.Optional(t.Number()),
        target_ascension_stage: t.Optional(t.Number()),
      }),
    },
  )

  // DELETE /user-planner/characters/:id
  .delete("/characters/:id", async ({ status, user, params }) => {
    try {
      const deleted = await userCharacterService.removeUserCharacter(
        Number(params.id),
        user.user_id,
      );
      if (!deleted) return status(404, errorResponse(404, "User character not found"));
      return status(200, successResponse(200, "Character removed from plan", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to remove character"));
    }
  })

  // ── CHARACTER SKILLS ────────────────────────────────────────────────────────

  // GET /user-planner/characters/:id/skills
  .get("/characters/:id/skills", async ({ status, user, params }) => {
    try {
      const data = await userCharacterService.getUserCharacterSkills(
        Number(params.id),
        user.user_id,
      );
      return status(200, successResponse(200, "Skills fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch skills"));
    }
  })

  // PATCH /user-planner/skills/:id
  .patch(
    "/skills/:id",
    async ({ status, user, params, body }) => {
      try {
        const data = await userCharacterService.updateUserCharacterSkill(
          Number(params.id),
          user.user_id,
          body,
        );
        if (!data) return status(404, errorResponse(404, "Skill entry not found"));
        return status(200, successResponse(200, "Skill updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update skill"));
      }
    },
    {
      body: t.Object({
        current_level: t.Optional(t.Number()),
        target_level: t.Optional(t.Number()),
      }),
    },
  )

  // ── WEAPONS ────────────────────────────────────────────────────────────────

  // GET /user-planner/weapons
  .get("/weapons", async ({ status, user }) => {
    try {
      const data = await userWeaponService.getUserWeapons(user.user_id);
      return status(200, successResponse(200, "User weapons fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch user weapons"));
    }
  })

  // GET /user-planner/weapons/:id
  .get("/weapons/:id", async ({ status, user, params }) => {
    try {
      const data = await userWeaponService.getUserWeaponById(Number(params.id));
      if (!data || data.user_id !== user.user_id) {
        return status(404, errorResponse(404, "User weapon not found"));
      }
      return status(200, successResponse(200, "User weapon fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch user weapon"));
    }
  })

  // POST /user-planner/weapons
  .post(
    "/weapons",
    async ({ status, user, body }) => {
      try {
        const data = await userWeaponService.addUserWeapon(user.user_id, body);
        return status(201, successResponse(201, "Weapon added to plan", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to add weapon"));
      }
    },
    {
      body: t.Object({
        weapon_id: t.Number(),
        current_level: t.Optional(t.Number()),
        target_level: t.Optional(t.Number()),
        current_ascension_stage: t.Optional(t.Number()),
        target_ascension_stage: t.Optional(t.Number()),
      }),
    },
  )

  // PATCH /user-planner/weapons/:id
  .patch(
    "/weapons/:id",
    async ({ status, user, params, body }) => {
      try {
        const data = await userWeaponService.updateUserWeapon(
          Number(params.id),
          user.user_id,
          body,
        );
        if (!data) return status(404, errorResponse(404, "User weapon not found"));
        return status(200, successResponse(200, "Weapon plan updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update weapon"));
      }
    },
    {
      body: t.Object({
        current_level: t.Optional(t.Number()),
        target_level: t.Optional(t.Number()),
        current_ascension_stage: t.Optional(t.Number()),
        target_ascension_stage: t.Optional(t.Number()),
      }),
    },
  )

  // DELETE /user-planner/weapons/:id
  .delete("/weapons/:id", async ({ status, user, params }) => {
    try {
      const deleted = await userWeaponService.removeUserWeapon(
        Number(params.id),
        user.user_id,
      );
      if (!deleted) return status(404, errorResponse(404, "User weapon not found"));
      return status(200, successResponse(200, "Weapon removed from plan", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to remove weapon"));
    }
  })

  // ── INVENTORY ──────────────────────────────────────────────────────────────

  // GET /user-planner/inventory
  .get("/inventory", async ({ status, user }) => {
    try {
      const data = await inventoryService.getUserInventory(user.user_id);
      return status(200, successResponse(200, "Inventory fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch inventory"));
    }
  })

  // GET /user-planner/inventory/:item_id
  .get("/inventory/:item_id", async ({ status, user, params }) => {
    try {
      const data = await inventoryService.getInventoryItem(user.user_id, Number(params.item_id));
      if (!data) return status(404, errorResponse(404, "Inventory item not found"));
      return status(200, successResponse(200, "Inventory item fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch inventory item"));
    }
  })

  // PUT /user-planner/inventory/:item_id
  .put(
    "/inventory/:item_id",
    async ({ status, user, params, body }) => {
      try {
        const data = await inventoryService.upsertInventoryItem(
          user.user_id,
          Number(params.item_id),
          body,
        );
        return status(200, successResponse(200, "Inventory updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update inventory"));
      }
    },
    { body: t.Object({ quantity: t.Number() }) },
  )

  // POST /user-planner/inventory/bulk
  .post(
    "/inventory/bulk",
    async ({ status, user, body }) => {
      try {
        const data = await inventoryService.bulkUpsertInventory(user.user_id, body.items);
        return status(200, successResponse(200, "Inventory bulk updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to bulk update inventory"));
      }
    },
    {
      body: t.Object({
        items: t.Array(t.Object({ item_id: t.Number(), quantity: t.Number() })),
      }),
    },
  )

  // DELETE /user-planner/inventory/:item_id
  .delete("/inventory/:item_id", async ({ status, user, params }) => {
    try {
      const deleted = await inventoryService.removeInventoryItem(
        user.user_id,
        Number(params.item_id),
      );
      if (!deleted) return status(404, errorResponse(404, "Inventory item not found"));
      return status(200, successResponse(200, "Inventory item removed", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to remove inventory item"));
    }
  })

  // ── SUMMARY ────────────────────────────────────────────────────────────────

  // GET /user-planner/summary
  .get("/summary", async ({ status, user }) => {
    try {
      const data = await plannerSummaryService.getPlannerSummary(user.user_id);
      return status(200, successResponse(200, "Summary fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch summary"));
    }
  });