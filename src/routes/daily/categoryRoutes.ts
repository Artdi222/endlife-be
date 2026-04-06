import { Elysia, t } from "elysia";
import { successResponse, errorResponse } from "../../lib/response.js";
import * as categoryService from "../../services/daily/categoryService.js";

export const categoryRoutes = new Elysia({ prefix: "/categories" })

  // get all categories
  .get("/", async ({ status }) => {
    try {
      const data = await categoryService.getCategories();
      return status(200, successResponse(200, "Categories fetched", data));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to fetch categories"));
    }
  })

  // create category
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const data = await categoryService.createCategory(body);
        return status(201, successResponse(201, "Category created", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to create category"));
      }
    },
    {
      body: t.Object({
        name: t.String(),
        order_index: t.Number(),
      }),
    },
  )

  // update category
  .patch(
    "/:id",
    async ({ status, params, body }) => {
      try {
        const data = await categoryService.updateCategory(Number(params.id), body);
        if (!data) return status(404, errorResponse(404, "Category not found"));
        return status(200, successResponse(200, "Category updated", data));
      } catch (error) {
        console.error(error);
        return status(500, errorResponse(500, "Failed to update category"));
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        order_index: t.Optional(t.Number()),
      }),
    },
  )

  // delete category
  .delete("/:id", async ({ status, params }) => {
    try {
      const data = await categoryService.deleteCategory(Number(params.id));
      if (!data) return status(404, errorResponse(404, "Category not found"));
      return status(200, successResponse(200, "Category deleted", null));
    } catch (error) {
      console.error(error);
      return status(500, errorResponse(500, "Failed to delete category"));
    }
  });
