import { Elysia, t } from "elysia";
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from "../../controllers/daily/categoryControllers.js";
import type {
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "../../types/daily/categoryTypes.js";
import { adminMiddleware } from "../../middleware/authMiddleware.js";

export const categoryRoutes = new Elysia({ prefix: "/categories" })
  .use(adminMiddleware)

  // get all categories
  .get("/", async ({ status }) => {
    try {
      const categories = await getCategories();
      return status(200, {
        status: 200,
        message: "Success to get all category",
        data: categories,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to get all categories",
        data: null,
      });
    }
  })

  // create category
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const { name, order_index } = body as CreateCategoryDTO;

        const newCategory = await createCategory({
          name,
          order_index,
        });

        return status(201, {
          status: 201,
          message: "Category created successfully",
          data: newCategory,
        });
      } catch (error: any) {
        return status(500, {
          status: 500,
          message: "Failed to create category",
          data: null,
        });
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
  .put(
    "/:id",
    async ({ status, body, params }) => {
      try {
        const data = await updateCategory(
          Number(params.id),
          body as UpdateCategoryDTO,
        );
        return status(200, { status: 200, message: "Updated", data });
      } catch (error: any) {
        if (error.message === "No fields to update") {
          return status(400, {
            status: 400,
            message: "No fields provided to update",
            data: null,
          });
        }
        return status(500, { status: 500, message: "Failed", data: null });
      }
    },
    {
      body: t.Object({
        name: t.String(),
        order_index: t.Number(),
      }),
    },
  )

  // delete category
  .delete("/:id", async ({ status, params }) => {
    try {
      const deleted = await deleteCategory(Number(params.id));
      return status(200, {
        status: 200,
        message: "Category deleted",
        data: deleted,
      });
    } catch {
      return status(500, {
        status: 500,
        message: "Failed to delete category",
        data: null,
      });
    }
  });
