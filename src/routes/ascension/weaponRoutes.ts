import { Elysia, t } from "elysia";
import {
  getAllWeapons,
  getWeaponById,
  createWeapon,
  updateWeapon,
  uploadWeaponIcon,
  deleteWeapon,
} from "../../controllers/ascension/weaponControllers.js";

export const weaponRoutes = new Elysia({ prefix: "/weapons" })

  // GET all weapons
  .get("/", async ({ status }) => {
    try {
      const data = await getAllWeapons();
      return status(200, { status: 200, message: "Weapons fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch weapons",
        data: null,
      });
    }
  })

  // GET weapon by id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await getWeaponById(Number(params.id));
      if (!data)
        return status(404, {
          status: 404,
          message: "Weapon not found",
          data: null,
        });
      return status(200, { status: 200, message: "Weapon fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch weapon",
        data: null,
      });
    }
  })

  // POST create weapon (text fields only, icon uploaded separately)
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await createWeapon(body);
        return status(201, { status: 201, message: "Weapon created", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to create weapon",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        name: t.String(),
        rarity: t.Number(),
        type: t.String(),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // PATCH update weapon text fields
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await updateWeapon(Number(params.id), body);
        if (!data)
          return status(404, {
            status: 404,
            message: "Weapon not found",
            data: null,
          });
        return status(200, { status: 200, message: "Weapon updated", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to update weapon",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        rarity: t.Optional(t.Number()),
        type: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // POST upload weapon icon
  .post(
    "/:id/icon",
    async ({ status, params, body }) => {
      try {
        const file = body.file as File;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await uploadWeaponIcon(
          Number(params.id),
          buffer,
          file.type,
          file.name,
        );

        if (!data)
          return status(404, {
            status: 404,
            message: "Weapon not found",
            data: null,
          });
        return status(200, { status: 200, message: "Icon uploaded", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to upload icon",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    },
  )

  // DELETE weapon
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteWeapon(Number(params.id));
      if (!deleted)
        return status(404, {
          status: 404,
          message: "Weapon not found",
          data: null,
        });
      return status(200, {
        status: 200,
        message: "Weapon deleted",
        data: null,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete weapon",
        data: null,
      });
    }
  });
