import pool from "../../db/index.js";
import { supabase } from "../../lib/supabase.js";
import type {
  Skill,
  SkillWithLevels,
  SkillLevel,
  SkillLevelRequirement,
  SkillLevelWithRequirements,
  CreateSkillDTO,
} from "../../types/index.js";

/**
 * Service for managing character skills
 */

// GET ALL SKILLS FOR A CHARACTER
export const getSkillsForCharacter = async (
  characterId: number,
): Promise<SkillWithLevels[]> => {
  const skillsResult = await pool.query<Skill>(
    `SELECT * FROM skills WHERE character_id = $1 ORDER BY order_index, id`,
    [characterId],
  );
  if (skillsResult.rows.length === 0) return [];

  const skillIds = skillsResult.rows.map((s) => s.id);

  const levelsResult = await pool.query<SkillLevel>(
    `SELECT * FROM skill_levels
      WHERE skill_id = ANY($1)
      ORDER BY skill_id, level`,
    [skillIds],
  );

  if (levelsResult.rows.length === 0) {
    return skillsResult.rows.map((s) => ({ ...s, levels: [] }));
  }

  const levelIds = levelsResult.rows.map((l) => l.id);

  const reqResult = await pool.query<SkillLevelRequirement>(
    `SELECT
      slr.id, slr.skill_level_id, slr.item_id, slr.quantity,
      i.name     AS item_name,
      i.image    AS item_image,
      i.category AS item_category
      FROM skill_level_requirements slr
      JOIN items i ON i.id = slr.item_id
      WHERE slr.skill_level_id = ANY($1)
      ORDER BY i.order_index, i.name`,
    [levelIds],
  );

  const reqByLevel = new Map<number, SkillLevelRequirement[]>();
  for (const req of reqResult.rows) {
    const list = reqByLevel.get(req.skill_level_id) ?? [];
    list.push(req);
    reqByLevel.set(req.skill_level_id, list);
  }

  const levelsBySkill = new Map<number, SkillLevelWithRequirements[]>();
  for (const level of levelsResult.rows) {
    const withReqs: SkillLevelWithRequirements = {
      ...level,
      requirements: reqByLevel.get(level.id) ?? [],
    };
    const list = levelsBySkill.get(level.skill_id) ?? [];
    list.push(withReqs);
    levelsBySkill.set(level.skill_id, list);
  }

  return skillsResult.rows.map((skill) => ({
    ...skill,
    levels: levelsBySkill.get(skill.id) ?? [],
  }));
};

// GET SINGLE SKILL BY ID
export const getSkillById = async (
  id: number,
): Promise<SkillWithLevels | null> => {
  const skillResult = await pool.query<Skill>(
    `SELECT * FROM skills WHERE id = $1`,
    [id],
  );
  if (!skillResult.rows[0]) return null;

  const skill = skillResult.rows[0];

  const levelsResult = await pool.query<SkillLevel>(
    `SELECT * FROM skill_levels WHERE skill_id = $1 ORDER BY level`,
    [id],
  );

  if (levelsResult.rows.length === 0) {
    return { ...skill, levels: [] };
  }

  const levelIds = levelsResult.rows.map((l) => l.id);

  const reqResult = await pool.query<SkillLevelRequirement>(
    `SELECT
      slr.id, slr.skill_level_id, slr.item_id, slr.quantity,
      i.name     AS item_name,
      i.image    AS item_image,
      i.category AS item_category
      FROM skill_level_requirements slr
      JOIN items i ON i.id = slr.item_id
      WHERE slr.skill_level_id = ANY($1)
      ORDER BY i.order_index, i.name`,
    [levelIds],
  );

  const reqByLevel = new Map<number, SkillLevelRequirement[]>();
  for (const req of reqResult.rows) {
    const list = reqByLevel.get(req.skill_level_id) ?? [];
    list.push(req);
    reqByLevel.set(req.skill_level_id, list);
  }

  return {
    ...skill,
    levels: levelsResult.rows.map((level) => ({
      ...level,
      requirements: reqByLevel.get(level.id) ?? [],
    })),
  };
};

// CREATE SKILL
export const createSkill = async (dto: CreateSkillDTO): Promise<Skill> => {
  const result = await pool.query<Skill>(
    `INSERT INTO skills (character_id, name, type, icon, order_index)
      VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      dto.character_id,
      dto.name,
      dto.type,
      dto.icon ?? null,
      dto.order_index ?? 0,
    ],
  );
  return result.rows[0];
};

// UPDATE SKILL
export const updateSkill = async (
  id: number,
  dto: Partial<CreateSkillDTO>,
): Promise<Skill | null> => {
  const fields = Object.entries(dto).filter(([, v]) => v !== undefined);
  if (fields.length === 0) {
    const r = await pool.query<Skill>(`SELECT * FROM skills WHERE id = $1`, [
      id,
    ]);
    return r.rows[0] ?? null;
  }
  const setClauses = fields
    .map(([key], i) => `"${key}" = $${i + 2}`)
    .join(", ");
  const values = fields.map(([, v]) => v);
  const result = await pool.query<Skill>(
    `UPDATE skills SET ${setClauses} WHERE id = $1 RETURNING *`,
    [id, ...values],
  );
  return result.rows[0] ?? null;
};

// DELETE SKILL
export const deleteSkill = async (id: number): Promise<boolean> => {
  const result = await pool.query(`DELETE FROM skills WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
};

// UPLOAD SKILL ICON
export const uploadSkillIcon = async (
  id: number,
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<Skill | null> => {
  const path = `icon/${id}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("skills")
    .upload(path, fileBuffer, { contentType: mimeType, upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("skills").getPublicUrl(path);

  const result = await pool.query<Skill>(
    `UPDATE skills SET icon = $1 WHERE id = $2 RETURNING *`,
    [data.publicUrl, id],
  );
  return result.rows[0] ?? null;
};
