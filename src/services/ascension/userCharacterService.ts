import pool from "../../db/index.js";
import { levelToStageNumber } from "./stageService.js";
import type {
  UserCharacter,
  UserCharacterWithDetails,
  UserCharacterSkillWithDetails,
  UserCharacterSkill,
  AddUserCharacterDTO,
  UpdateUserCharacterDTO,
  UpdateUserCharacterSkillDTO,
} from "../../types/index.js";

/**
 * Service for managing user characters in the planner
 */

// GET ALL USER CHARACTERS
export const getUserCharacters = async (
  userId: number,
): Promise<UserCharacterWithDetails[]> => {
  const result = await pool.query<UserCharacterWithDetails>(
    `SELECT
      uc.*,
      c.name    AS character_name,
      c.icon    AS character_icon,
      c.rarity  AS character_rarity,
      c.element AS character_element,
      c.class   AS character_class
      FROM user_characters uc
      JOIN characters c ON c.id = uc.character_id
      WHERE uc.user_id = $1
      ORDER BY c.order_index, c.name`,
    [userId],
  );
  return result.rows;
};

// GET SINGLE USER CHARACTER BY ID
export const getUserCharacterById = async (
  id: number,
): Promise<UserCharacterWithDetails | null> => {
  const result = await pool.query<UserCharacterWithDetails>(
    `SELECT
      uc.*,
      c.name    AS character_name,
      c.icon    AS character_icon,
      c.rarity  AS character_rarity,
      c.element AS character_element,
      c.class   AS character_class
      FROM user_characters uc
      JOIN characters c ON c.id = uc.character_id
      WHERE uc.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
};

// ADD USER CHARACTER
export const addUserCharacter = async (
  userId: number,
  dto: AddUserCharacterDTO,
): Promise<UserCharacterWithDetails> => {
  let currentStage = dto.current_ascension_stage ?? 0;
  let targetStage = dto.target_ascension_stage ?? 9;

  if (
    dto.current_ascension_stage === undefined &&
    dto.current_level !== undefined
  ) {
    currentStage =
      (await levelToStageNumber(
        "character",
        dto.character_id,
        dto.current_level,
      )) ?? 0;
  }
  if (
    dto.target_ascension_stage === undefined &&
    dto.target_level !== undefined
  ) {
    targetStage =
      (await levelToStageNumber(
        "character",
        dto.character_id,
        dto.target_level,
      )) ?? 9;
  }

  const result = await pool.query<UserCharacter>(
    `INSERT INTO user_characters
      (user_id, character_id, current_level, target_level,
        current_ascension_stage, target_ascension_stage)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, character_id)
        DO UPDATE SET
          current_level           = EXCLUDED.current_level,
          target_level            = EXCLUDED.target_level,
          current_ascension_stage = EXCLUDED.current_ascension_stage,
          target_ascension_stage  = EXCLUDED.target_ascension_stage
     RETURNING *`,
    [
      userId,
      dto.character_id,
      dto.current_level ?? 1,
      dto.target_level ?? 90,
      currentStage,
      targetStage,
    ],
  );

  const uc = result.rows[0];

  // Auto-seed skill rows
  await pool.query(
    `INSERT INTO user_character_skills (user_character_id, skill_id, current_level, target_level)
      SELECT $1, s.id, 1, 1
      FROM skills s
      WHERE s.character_id = $2
      ON CONFLICT (user_character_id, skill_id) DO NOTHING`,
    [uc.id, dto.character_id],
  );

  return (await getUserCharacterById(uc.id))!;
};

// UPDATE USER CHARACTER
export const updateUserCharacter = async (
  userCharacterId: number,
  userId: number,
  dto: UpdateUserCharacterDTO,
): Promise<UserCharacterWithDetails | null> => {
  const ownerCheck = await pool.query<{ character_id: number }>(
    `SELECT character_id FROM user_characters WHERE id = $1 AND user_id = $2`,
    [userCharacterId, userId],
  );
  if (!ownerCheck.rows[0]) return null;

  const updates: Record<string, unknown> = { ...dto };
  const fields = Object.entries(updates).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return getUserCharacterById(userCharacterId);

  const setClauses = fields
    .map(([key], i) => `"${key}" = $${i + 2}`)
    .join(", ");
  const values = fields.map(([, v]) => v);

  await pool.query(`UPDATE user_characters SET ${setClauses} WHERE id = $1`, [
    userCharacterId,
    ...values,
  ]);
  return getUserCharacterById(userCharacterId);
};

// REMOVE USER CHARACTER
export const removeUserCharacter = async (
  userCharacterId: number,
  userId: number,
): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM user_characters WHERE id = $1 AND user_id = $2`,
    [userCharacterId, userId],
  );
  return (result.rowCount ?? 0) > 0;
};

// GET ALL SKILLS FOR A USER CHARACTER
export const getUserCharacterSkills = async (
  userCharacterId: number,
  userId: number,
): Promise<UserCharacterSkillWithDetails[]> => {
  const result = await pool.query<UserCharacterSkillWithDetails>(
    `SELECT
      ucs.*,
      s.name        AS skill_name,
      s.type        AS skill_type,
      s.icon        AS skill_icon,
      s.order_index AS skill_order_index
      FROM user_character_skills ucs
      JOIN skills s ON s.id = ucs.skill_id
      JOIN user_characters uc ON uc.id = ucs.user_character_id
      WHERE ucs.user_character_id = $1 AND uc.user_id = $2
      ORDER BY s.order_index, s.id`,
    [userCharacterId, userId],
  );
  return result.rows;
};

// UPDATE USER CHARACTER SKILL
export const updateUserCharacterSkill = async (
  userCharacterSkillId: number,
  userId: number,
  dto: UpdateUserCharacterSkillDTO,
): Promise<UserCharacterSkill | null> => {
  const ownerCheck = await pool.query(
    `SELECT ucs.id FROM user_character_skills ucs
      JOIN user_characters uc ON uc.id = ucs.user_character_id
      WHERE ucs.id = $1 AND uc.user_id = $2`,
    [userCharacterSkillId, userId],
  );
  if (!ownerCheck.rows[0]) return null;

  const fields = Object.entries(dto).filter(([, v]) => v !== undefined);
  if (fields.length === 0) {
    const r = await pool.query<UserCharacterSkill>(
      `SELECT * FROM user_character_skills WHERE id = $1`,
      [userCharacterSkillId],
    );
    return r.rows[0] ?? null;
  }

  const setClauses = fields
    .map(([key], i) => `"${key}" = $${i + 2}`)
    .join(", ");
  const values = fields.map(([, v]) => v);

  const result = await pool.query<UserCharacterSkill>(
    `UPDATE user_character_skills SET ${setClauses} WHERE id = $1 RETURNING *`,
    [userCharacterSkillId, ...values],
  );
  return result.rows[0] ?? null;
};
