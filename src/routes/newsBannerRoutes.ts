import { Elysia, t } from "elysia";
import {
  getAllBanners,
  getActiveBanners,
  getBannerById,
  createBanner,
  updateBanner,
  uploadBannerImage,
  deleteBanner,
} from "../controllers/newsBannerControllers.js";

export const newsBannerRoutes = new Elysia({ prefix: "/news-banners" })

  // GET all banners (admin)
  .get("/", async ({ status }) => {
    try {
      const data = await getAllBanners();
      return status(200, { status: 200, message: "Banners fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch banners",
        data: null,
      });
    }
  })

  // GET active banners only (user home page)
  .get("/active", async ({ status }) => {
    try {
      const data = await getActiveBanners();
      return status(200, {
        status: 200,
        message: "Active banners fetched",
        data,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch active banners",
        data: null,
      });
    }
  })

  // GET banner by id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await getBannerById(Number(params.id));
      if (!data)
        return status(404, {
          status: 404,
          message: "Banner not found",
          data: null,
        });
      return status(200, { status: 200, message: "Banner fetched", data });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to fetch banner",
        data: null,
      });
    }
  })

  // POST create banner
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await createBanner(body);
        return status(201, { status: 201, message: "Banner created", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to create banner",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        title: t.String(),
        content: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
        is_active: t.Optional(t.Boolean()),
      }),
    },
  )

  // PATCH update banner
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await updateBanner(Number(params.id), body);
        if (!data)
          return status(404, {
            status: 404,
            message: "Banner not found",
            data: null,
          });
        return status(200, { status: 200, message: "Banner updated", data });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to update banner",
          data: null,
        });
      }
    },
    {
      body: t.Object({
        title: t.Optional(t.String()),
        content: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
        is_active: t.Optional(t.Boolean()),
      }),
    },
  )

  // POST upload banner image
  .post(
    "/:id/image",
    async ({ status, params, body }) => {
      try {
        const file = body.file as File;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await uploadBannerImage(
          Number(params.id),
          buffer,
          file.type,
          file.name,
        );

        if (!data)
          return status(404, {
            status: 404,
            message: "Banner not found",
            data: null,
          });
        return status(200, {
          status: 200,
          message: "Banner image uploaded",
          data,
        });
      } catch {
        return status(500, {
          status: 500,
          message: "Failed to upload banner image",
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

  // DELETE banner
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteBanner(Number(params.id));
      if (!deleted)
        return status(404, {
          status: 404,
          message: "Banner not found",
          data: null,
        });
      return status(200, {
        status: 200,
        message: "Banner deleted",
        data: null,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete banner",
        data: null,
      });
    }
  });
