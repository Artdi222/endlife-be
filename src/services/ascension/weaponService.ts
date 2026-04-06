import pool from "../../db/index.js";
import { supabase } from "../../lib/supabase.js";
import type {
  Weapon,
  CreateWeaponDTO,
  UpdateWeaponDTO,
} from "../../types/ascension/weaponTypes.js";

/**
 * Service for managing weapons
 */

// get all weapons
export const getAllWeapons = async (): Promise<Weapon[]> => {
  const result = await pool.query<Weapon>(
    `SELECT * FROM weapons ORDER BY order_index, name`,
  );
  return result.rows;
};

// get weapon by id
export const getWeaponById = async (id: number): Promise<Weapon | null> => {
  const result = await pool.query<Weapon>(
    `SELECT * FROM weapons WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
};

// create weapon
export const createWeapon = async (dto: CreateWeaponDTO): Promise<Weapon> => {
  const result = await pool.query<Weapon>(
    `
    INSERT INTO weapons
      (name, rarity, type, order_index)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [dto.name, dto.rarity, dto.type, dto.order_index ?? 0],
  );
  return result.rows[0];
};

// update weapon
export const updateWeapon = async (
  id: number,
  dto: UpdateWeaponDTO,
): Promise<Weapon | null> => {
  const fields = Object.entries(dto).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return getWeaponById(id);

  const setClauses = fields
    .map(([key], i) => `"${key}" = $${i + 2}`)
    .join(", ");
  const values = fields.map(([, v]) => v);

  const result = await pool.query<Weapon>(
    `UPDATE weapons SET ${setClauses} WHERE id = $1 RETURNING *`,
    [id, ...values],
  );
  return result.rows[0] ?? null;
};

// upload weapon icon
export const uploadWeaponIcon = async (
  id: number,
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<Weapon | null> => {
  const bucket = "weapons";
  const path = `icon/${id}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const result = await pool.query<Weapon>(
    `UPDATE weapons SET icon = $1 WHERE id = $2 RETURNING *`,
    [publicUrl, id],
  );

  return result.rows[0] ?? null;
};

// delete weapon
export const deleteWeapon = async (id: number): Promise<boolean> => {
  // Clean up Supabase storage icon folder
  const { data: files } = await supabase.storage
    .from("weapons")
    .list("icon", { search: `${id}-` });

  if (files && files.length > 0) {
    const paths = files.map((f) => `icon/${f.name}`);
    await supabase.storage.from("weapons").remove(paths);
  }

  const result = await pool.query(`DELETE FROM weapons WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
};
