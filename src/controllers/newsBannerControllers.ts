import pool from "../db/index.js";
import { supabase } from "../lib/supabase.js";
import type {
  NewsBanner,
  CreateNewsBannerDTO,
  UpdateNewsBannerDTO,
} from "../types/newsBannerTypes.js";

// get all banners (admin)
export const getAllBanners = async (): Promise<NewsBanner[]> => {
  try {
    const result = await pool.query<NewsBanner>(
      `SELECT * FROM news_banners ORDER BY order_index, created_at DESC`,
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting banners:", error);
    throw error;
  }
};

// get active banners only (user home page)
export const getActiveBanners = async (): Promise<NewsBanner[]> => {
  try {
    const result = await pool.query<NewsBanner>(
      `SELECT * FROM news_banners WHERE is_active = true ORDER BY order_index, created_at DESC`,
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting active banners:", error);
    throw error;
  }
};

// get banner by id
export const getBannerById = async (
  id: number,
): Promise<NewsBanner | null> => {
  try {
    const result = await pool.query<NewsBanner>(
      `SELECT * FROM news_banners WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error getting banner:", error);
    throw error;
  }
};

// create banner
export const createBanner = async (
  dto: CreateNewsBannerDTO,
): Promise<NewsBanner> => {
  try {
    const result = await pool.query<NewsBanner>(
      `
      INSERT INTO news_banners (title, content, order_index, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        dto.title,
        dto.content ?? null,
        dto.order_index ?? 0,
        dto.is_active ?? true,
      ],
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating banner:", error);
    throw error;
  }
};

// update banner
export const updateBanner = async (
  id: number,
  dto: UpdateNewsBannerDTO,
): Promise<NewsBanner | null> => {
  try {
    const fields = Object.entries(dto).filter(([, v]) => v !== undefined);
    if (fields.length === 0) return getBannerById(id);

    const setClauses = fields
      .map(([key], i) => `"${key}" = $${i + 2}`)
      .join(", ");
    const values = fields.map(([, v]) => v);

    const result = await pool.query<NewsBanner>(
      `UPDATE news_banners SET ${setClauses} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error updating banner:", error);
    throw error;
  }
};

// upload banner image
export const uploadBannerImage = async (
  id: number,
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<NewsBanner | null> => {
  try {
    const path = `banners/${id}-${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("news")
      .upload(path, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("news").getPublicUrl(path);
    const publicUrl = data.publicUrl;

    const result = await pool.query<NewsBanner>(
      `UPDATE news_banners SET image_url = $1 WHERE id = $2 RETURNING *`,
      [publicUrl, id],
    );

    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error uploading banner image:", error);
    throw error;
  }
};

// delete banner
export const deleteBanner = async (id: number): Promise<boolean> => {
  try {
    // Clean up image from Supabase
    const { data: files } = await supabase.storage
      .from("news")
      .list("banners", { search: `${id}-` });
    if (files && files.length > 0) {
      const paths = files.map((f) => `banners/${f.name}`);
      await supabase.storage.from("news").remove(paths);
    }

    const result = await pool.query(`DELETE FROM news_banners WHERE id = $1`, [
      id,
    ]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error deleting banner:", error);
    throw error;
  }
};
