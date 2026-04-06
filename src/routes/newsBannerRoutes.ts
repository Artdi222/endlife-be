import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../lib/response.js";
import * as newsBannerService from "../services/newsBannerService.js";

/**
 * Routes for News Banners (Admin and Public)
 */
export const newsBannerRoutes = new Elysia({ prefix: "/news-banners" })

  // GET all banners (admin)
  .get("/", async ({ status }) => {
    try {
      const data = await newsBannerService.getAllBanners();
      return status(200, successResponse(200, "Banners fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch banners"));
    }
  })

  // GET active banners only (user home page)
  .get("/active", async ({ status }) => {
    try {
      const data = await newsBannerService.getActiveBanners();
      return status(200, successResponse(200, "Active banners fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch active banners"));
    }
  })

  // GET banner by id
  .get("/:id", async ({ status, params }) => {
    try {
      const data = await newsBannerService.getBannerById(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Banner not found"));
      return status(200, successResponse(200, "Banner fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch banner"));
    }
  })

  // POST create banner
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await newsBannerService.createBanner(body);
        return status(201, successResponse(201, "Banner created", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to create banner"));
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
        const data = await newsBannerService.updateBanner(Number(params.id), body);
        if (!data) return status(404, errorResponse(404, "Banner not found"));
        return status(200, successResponse(200, "Banner updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update banner"));
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

        const data = await newsBannerService.uploadBannerImage(
          Number(params.id),
          buffer,
          file.type,
          file.name,
        );

        if (!data) return status(404, errorResponse(404, "Banner not found"));
        return status(200, successResponse(200, "Banner image uploaded", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to upload banner image"));
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
      const deleted = await newsBannerService.deleteBanner(Number(params.id));
      if (!deleted) return status(404, errorResponse(404, "Banner not found"));
      return status(200, successResponse(200, "Banner deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete banner"));
    }
  });
