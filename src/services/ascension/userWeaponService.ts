import pool from "../../db/index.js";
import { levelToStageNumber } from "./stageService.js";
import type {
  UserWeapon,
  UserWeaponWithDetails,
  AddUserWeaponDTO,
  UpdateUserWeaponDTO,
} from "../../types/index.js";

/**
 * Service for managing user weapons in the planner
 */

// GET ALL USER WEAPONS
export const getUserWeapons = async (
  userId: number,
): Promise<UserWeaponWithDetails[]> => {
  const result = await pool.query<UserWeaponWithDetails>(
    `SELECT
      uw.*,
      w.name   AS weapon_name,
      w.icon   AS weapon_icon,
      w.rarity AS weapon_rarity,
      w.type   AS weapon_type
      FROM user_weapons uw
      JOIN weapons w ON w.id = uw.weapon_id
      WHERE uw.user_id = $1
      ORDER BY w.order_index, w.name`,
    [userId],
  );
  return result.rows;
};

// GET SINGLE USER WEAPON BY ID
export const getUserWeaponById = async (
  id: number,
): Promise<UserWeaponWithDetails | null> => {
  const result = await pool.query<UserWeaponWithDetails>(
    `SELECT
      uw.*,
      w.name   AS weapon_name,
      w.icon   AS weapon_icon,
      w.rarity AS weapon_rarity,
      w.type   AS weapon_type
      FROM user_weapons uw
      JOIN weapons w ON w.id = uw.weapon_id
      WHERE uw.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
};

// ADD USER WEAPON
export const addUserWeapon = async (
  userId: number,
  dto: AddUserWeaponDTO,
): Promise<UserWeaponWithDetails> => {
  let currentStage = dto.current_ascension_stage ?? 0;
  let targetStage = dto.target_ascension_stage ?? 9;

  if (
    dto.current_ascension_stage === undefined &&
    dto.current_level !== undefined
  ) {
    currentStage =
      (await levelToStageNumber(
        "weapon",
        dto.weapon_id,
        dto.current_level,
      )) ?? 0;
  }
  if (
    dto.target_ascension_stage === undefined &&
    dto.target_level !== undefined
  ) {
    targetStage =
      (await levelToStageNumber("weapon", dto.weapon_id, dto.target_level)) ??
      9;
  }

  const result = await pool.query<UserWeapon>(
    `INSERT INTO user_weapons
      (user_id, weapon_id, current_level, target_level,
        current_ascension_stage, target_ascension_stage)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, weapon_id)
        DO UPDATE SET
          current_level           = EXCLUDED.current_level,
          target_level            = EXCLUDED.target_level,
          current_ascension_stage = EXCLUDED.current_ascension_stage,
          target_ascension_stage  = EXCLUDED.target_ascension_stage
     RETURNING *`,
    [
      userId,
      dto.weapon_id,
      dto.current_level ?? 1,
      dto.target_level ?? 90,
      currentStage,
      targetStage,
    ],
  );
  return (await getUserWeaponById(result.rows[0].id))!;
};

// UPDATE USER WEAPON
export const updateUserWeapon = async (
  userWeaponId: number,
  userId: number,
  dto: UpdateUserWeaponDTO,
): Promise<UserWeaponWithDetails | null> => {
  const ownerCheck = await pool.query<{ weapon_id: number }>(
    `SELECT weapon_id FROM user_weapons WHERE id = $1 AND user_id = $2`,
    [userWeaponId, userId],
  );
  if (!ownerCheck.rows[0]) return null;

  const updates: Record<string, unknown> = { ...dto };
  const fields = Object.entries(updates).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return getUserWeaponById(userWeaponId);

  const setClauses = fields
    .map(([key], i) => `"${key}" = $${i + 2}`)
    .join(", ");
  const values = fields.map(([, v]) => v);

  await pool.query(`UPDATE user_weapons SET ${setClauses} WHERE id = $1`, [
    userWeaponId,
    ...values,
  ]);
  return getUserWeaponById(userWeaponId);
};

// REMOVE USER WEAPON
export const removeUserWeapon = async (
  userWeaponId: number,
  userId: number,
): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM user_weapons WHERE id = $1 AND user_id = $2`,
    [userWeaponId, userId],
  );
  return (result.rowCount ?? 0) > 0;
};
