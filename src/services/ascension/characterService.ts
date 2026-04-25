import pool from "../../db/index.js";
import { supabase } from "../../lib/supabase.js";
import type {
  Character,
  CreateCharacterDTO,
  UpdateCharacterDTO,
} from "../../types/ascension/characterTypes.js";

/**
 * Service for managing characters
 */

// get all characters
export const getAllCharacters = async (): Promise<Character[]> => {
  const result = await pool.query<Character>(
    `SELECT * FROM characters ORDER BY order_index, name`,
  );
  return result.rows;
};

// get character by id
export const getCharacterById = async (
  id: number,
): Promise<Character | null> => {
  const result = await pool.query<Character>(
    `SELECT * FROM characters WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
};

// create character
export const createCharacter = async (
  dto: CreateCharacterDTO,
): Promise<Character> => {
  const result = await pool.query<Character>(
    `
    INSERT INTO characters
      (name, rarity, element, weapon_type, race, faction, class, description, order_index)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
    [
      dto.name,
      dto.rarity,
      dto.element,
      dto.weapon_type,
      dto.race ?? null,
      dto.faction ?? null,
      dto.class ?? null,
      dto.description ?? null,
      dto.order_index ?? 0,
    ],
  );
  return result.rows[0];
};

// update character
export const updateCharacter = async (
  id: number,
  dto: UpdateCharacterDTO,
): Promise<Character | null> => {
  const fields = Object.entries(dto).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return getCharacterById(id);

  const setClauses = fields
    .map(([key], i) => `"${key}" = $${i + 2}`)
    .join(", ");
  const values = fields.map(([, v]) => v);

  const result = await pool.query<Character>(
    `UPDATE characters SET ${setClauses} WHERE id = $1 RETURNING *`,
    [id, ...values],
  );
  return result.rows[0] ?? null;
};

// upload character media
export const uploadCharacterMedia = async (
  id: number,
  field: "icon" | "splash_art" | "video_enter" | "video_idle" | "card_image",
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<Character | null> => {
  const isVideo = field === "video_enter" || field === "video_idle";
  const bucket = isVideo ? "videos" : "characters";

  const folderMap: Record<string, string> = {
    icon: "icon",
    splash_art: "splash_art",
    video_enter: "video_enter",
    video_idle: "video_idle",
    card_image: "card",
  };
  const folder = folderMap[field];
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${folder}/${id}-${sanitizedFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const result = await pool.query<Character>(
    `UPDATE characters SET ${field} = $1 WHERE id = $2 RETURNING *`,
    [publicUrl, id],
  );

  return result.rows[0] ?? null;
};

// delete character
export const deleteCharacter = async (id: number): Promise<boolean> => {
  const imageFolders = ["icon", "splash_art", "card"];
  const videoFolders = ["video_enter", "video_idle"];

  for (const folder of imageFolders) {
    const { data: files } = await supabase.storage
      .from("characters")
      .list(folder, { search: `${id}-` });
    if (files && files.length > 0) {
      const paths = files.map((f) => `${folder}/${f.name}`);
      await supabase.storage.from("characters").remove(paths);
    }
  }

  for (const folder of videoFolders) {
    const { data: files } = await supabase.storage
      .from("videos")
      .list(folder, { search: `${id}-` });
    if (files && files.length > 0) {
      const paths = files.map((f) => `${folder}/${f.name}`);
      await supabase.storage.from("videos").remove(paths);
    }
  }

  const result = await pool.query(`DELETE FROM characters WHERE id = $1`, [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
};
