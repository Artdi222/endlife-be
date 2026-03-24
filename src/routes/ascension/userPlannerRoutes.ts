import { Elysia, t } from "elysia";
import type { JWTPayload } from "../../types/authTypes.js";
import {
  getUserCharacters,
  getUserCharacterById,
  addUserCharacter,
  updateUserCharacter,
  removeUserCharacter,
  getUserCharacterSkills,
  updateUserCharacterSkill,
  getUserWeapons,
  getUserWeaponById,
  addUserWeapon,
  updateUserWeapon,
  removeUserWeapon,
  getUserInventory,
  getInventoryItem,
  upsertInventoryItem,
  bulkUpsertInventory,
  removeInventoryItem,
  getPlannerSummary,
} from "../../controllers/ascension/userPlannerControllers.js";
import * as jose from "jose";


// ─── ROUTES ───────────────────────────────────────────────────────────────────

export const userPlannerRoutes = new Elysia({ prefix: "/user-planner" })
  .derive(async ({ headers, status }) => {
    const authHeader = headers["authorization"];
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      throw status(401, { status: 401, message: "Missing token", data: null });
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jose.jwtVerify(token, secret);
      return { user: payload as unknown as JWTPayload };
    } catch {
      throw status(401, {
        status: 401,
        message: "Invalid or expired token",
        data: null,
      });
    }
  })

  // ── CHARACTERS ─────────────────────────────────────────────────────────────

  // GET /user-planner/characters
  .get("/characters", async ({ status, user }) => {
    try {
      const userId = user.user_id;
      const data = await getUserCharacters(userId);
      return status(200, {
        status: 200,
        message: "User characters fetched",
        data,
      });
    } catch (error) {
      console.error(error);
      return status(500, {
        status: 500,
        message: "Failed to fetch user characters",
        data: null,
      });
    }
  })

  // GET /user-planner/characters/:id
  .get("/characters/:id", async ({ status, user, params }) => {
    try {
      const userId = user.user_id;
      const data = await getUserCharacterById(Number(params.id));
      // Verify it belongs to this user
      if (!data || data.user_id !== userId) {
        return status(404, {
          status: 404,
          message: "User character not found",
          data: null,
        });
      }
      return status(200, {
        status: 200,
        message: "User character fetched",
        data,
      });
    } catch (error) {
      console.error(error);
      return status(500, {
        status: 500,
        message: "Failed to fetch user character",
        data: null,
      });
    }
  })

  // POST /user-planner/characters
  .post(
    "/characters",
    async ({ status, user, body }) => {
      try {
        const userId = user.user_id;
        const data = await addUserCharacter(userId, body);
        return status(201, {
          status: 201,
          message: "Character added to plan",
          data,
        });
      } catch (error) {
        console.error(error);
        return status(500, {
          status: 500,
          message: "Failed to add character",
          data: null,
        });
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
        const userId = user.user_id;
        const data = await updateUserCharacter(Number(params.id), userId, body);
        if (!data)
          return status(404, {
            status: 404,
            message: "User character not found",
            data: null,
          });
        return status(200, {
          status: 200,
          message: "Character plan updated",
          data,
        });
      } catch (error) {
        console.error(error);
        return status(500, {
          status: 500,
          message: "Failed to update character",
          data: null,
        });
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
      const userId = user.user_id;
      const deleted = await removeUserCharacter(Number(params.id), userId);
      if (!deleted)
        return status(404, {
          status: 404,
          message: "User character not found",
          data: null,
        });
      return status(200, {
        status: 200,
        message: "Character removed from plan",
        data: null,
      });
    } catch (error) {
      console.error(error);
      return status(500, {
        status: 500,
        message: "Failed to remove character",
        data: null,
      });
    }
  })

  // ── CHARACTER SKILLS ────────────────────────────────────────────────────────

  // GET /user-planner/characters/:id/skills
  .get("/characters/:id/skills", async ({ status, user, params }) => {
    try {
      const userId = user.user_id;
      const data = await getUserCharacterSkills(Number(params.id), userId);
      return status(200, { status: 200, message: "Skills fetched", data });
    } catch (error) {
      console.error(error);
      return status(500, {
        status: 500,
        message: "Failed to fetch skills",
        data: null,
      });
    }
  })

  // PATCH /user-planner/skills/:id — update a single user_character_skill row
  .patch(
    "/skills/:id",
    async ({ status, user, params, body }) => {
      try {
        const userId = user.user_id;
        const data = await updateUserCharacterSkill(
          Number(params.id),
          userId,
          body,
        );
        if (!data)
          return status(404, {
            status: 404,
            message: "Skill entry not found",
            data: null,
          });
        return status(200, { status: 200, message: "Skill updated", data });
      } catch (error) {
        console.error(error);
        return status(500, {
          status: 500,
          message: "Failed to update skill",
          data: null,
        });
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
      const userId = user.user_id;
      const data = await getUserWeapons(userId);
      return status(200, {
        status: 200,
        message: "User weapons fetched",
        data,
      });
    } catch (error) {
      console.error(error);
      return status(500, {
        status: 500,
        message: "Failed to fetch user weapons",
        data: null,
      });
    }
  })

  // GET /user-planner/weapons/:id
  .get("/weapons/:id", async ({ status, user, params }) => {
    try {
      const userId = user.user_id;
      const data = await getUserWeaponById(Number(params.id));
      if (!data || data.user_id !== userId) {
        return status(404, {
          status: 404,
          message: "User weapon not found",
          data: null,
        });
      }
      return status(200, { status: 200, message: "User weapon fetched", data });
    } catch (error) {
      console.error(error);
      return status(500, {
        status: 500,
        message: "Failed to fetch user weapon",
        data: null,
      });
    }
  })

  // POST /user-planner/weapons
  .post(
    "/weapons",
    async ({ status, user, body }) => {
      try {
        const userId = user.user_id;
        const data = await addUserWeapon(userId, body);
        return status(201, {
          status: 201,
          message: "Weapon added to plan",
          data,
        });
      } catch (error) {
        console.error(error);
        return status(500, {
          status: 500,
          message: "Failed to add weapon",
          data: null,
        });
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
        const userId = user.user_id;
        const data = await updateUserWeapon(Number(params.id), userId, body);
        if (!data)
          return status(404, {
            status: 404,
            message: "User weapon not found",
            data: null,
          });
        return status(200, {
          status: 200,
          message: "Weapon plan updated",
          data,
        });
      } catch (error) {
        console.error(error);
        return status(500, {
          status: 500,
          message: "Failed to update weapon",
          data: null,
        });
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
      const userId = user.user_id;
      const deleted = await removeUserWeapon(Number(params.id), userId);
      if (!deleted)
        return status(404, {
          status: 404,
          message: "User weapon not found",
          data: null,
        });
      return status(200, {
        status: 200,
        message: "Weapon removed from plan",
        data: null,
      });
    } catch (error) {
      console.error(error);
      return status(500, {
        status: 500,
        message: "Failed to remove weapon",
        data: null,
      });
    }
  })

  // ── INVENTORY ──────────────────────────────────────────────────────────────

  // GET /user-planner/inventory
  .get("/inventory", async ({ status, user }) => {
    try {
      const userId = user.user_id;
      const data = await getUserInventory(userId);
      return status(200, { status: 200, message: "Inventory fetched", data });
    } catch (error) {
      console.error(error);
      return status(500, {
        status: 500,
        message: "Failed to fetch inventory",
        data: null,
      });
    }
  })

  // GET /user-planner/inventory/:item_id
  .get("/inventory/:item_id", async ({ status, user, params }) => {
    try {
      const userId = user.user_id;
      const data = await getInventoryItem(userId, Number(params.item_id));
      if (!data)
        return status(404, {
          status: 404,
          message: "Inventory item not found",
          data: null,
        });
      return status(200, {
        status: 200,
        message: "Inventory item fetched",
        data,
      });
    } catch (error) {
      console.error(error);
      return status(500, {
        status: 500,
        message: "Failed to fetch inventory item",
        data: null,
      });
    }
  })

  // PUT /user-planner/inventory/:item_id — set exact quantity for one item
  .put(
    "/inventory/:item_id",
    async ({ status, user, params, body }) => {
      try {
        const userId = user.user_id;
        const data = await upsertInventoryItem(
          userId,
          Number(params.item_id),
          body,
        );
        return status(200, { status: 200, message: "Inventory updated", data });
      } catch (error) {
        console.error(error);
        return status(500, {
          status: 500,
          message: "Failed to update inventory",
          data: null,
        });
      }
    },
    { body: t.Object({ quantity: t.Number() }) },
  )

  // POST /user-planner/inventory/bulk — update many items at once
  .post(
    "/inventory/bulk",
    async ({ status, user, body }) => {
      try {
        const userId = user.user_id;
        const data = await bulkUpsertInventory(userId, body.items);
        return status(200, {
          status: 200,
          message: "Inventory bulk updated",
          data,
        });
      } catch (error) {
        console.error(error);
        return status(500, {
          status: 500,
          message: "Failed to bulk update inventory",
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

  // DELETE /user-planner/inventory/:item_id — hard delete the row
  .delete("/inventory/:item_id", async ({ status, user, params }) => {
    try {
      const userId = user.user_id;
      const deleted = await removeInventoryItem(userId, Number(params.item_id));
      if (!deleted)
        return status(404, {
          status: 404,
          message: "Inventory item not found",
          data: null,
        });
      return status(200, {
        status: 200,
        message: "Inventory item removed",
        data: null,
      });
    } catch (error) {
      console.error(error);
      return status(500, {
        status: 500,
        message: "Failed to remove inventory item",
        data: null,
      });
    }
  })

  // ── SUMMARY ────────────────────────────────────────────────────────────────

  // GET /user-planner/summary
  // Aggregated materials + credits + EXP across all planned characters/weapons/skills
  .get("/summary", async ({ status, user }) => {
    try {
      const userId = user.user_id;
      const data = await getPlannerSummary(userId);
      return status(200, { status: 200, message: "Summary fetched", data });
    } catch (error) {
      console.error(error);
      return status(500, {
        status: 500,
        message: "Failed to fetch summary",
        data: null,
      });
    }
  })