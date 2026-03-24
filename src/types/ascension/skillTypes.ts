// ─── SKILL ───────────────────────────────────────────────────────────────────

export type SkillType = "skill" | "talent" | "spaceship_talent";

export interface Skill {
  id: number;
  character_id: number;
  name: string;
  type: SkillType;
  icon: string | null;
  order_index: number;
}

// ─── SKILL LEVEL ─────────────────────────────────────────────────────────────

export interface SkillLevel {
  id: number;
  skill_id: number;
  level: number; // 1–12
  credit_cost: string; // BIGINT as string
}

// ─── SKILL LEVEL REQUIREMENT ─────────────────────────────────────────────────

export interface SkillLevelRequirement {
  id: number;
  skill_level_id: number;
  item_id: number;
  quantity: number;
  // joined from items
  item_name: string;
  item_image: string | null;
  item_category: string;
}

// ─── COMPOSED TYPES ──────────────────────────────────────────────────────────

export interface SkillLevelWithRequirements extends SkillLevel {
  requirements: SkillLevelRequirement[];
}

export interface SkillWithLevels extends Skill {
  levels: SkillLevelWithRequirements[];
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateSkillDTO {
  character_id: number;
  name: string;
  type: SkillType;
  icon?: string;
  order_index?: number;
}

export interface UpdateSkillDTO {
  name?: string;
  type?: SkillType;
  icon?: string;
  order_index?: number;
}

export interface CreateSkillLevelDTO {
  skill_id: number;
  level: number;
  credit_cost?: number;
}

export interface UpdateSkillLevelDTO {
  credit_cost?: number;
}

export interface CreateSkillLevelRequirementDTO {
  skill_level_id: number;
  item_id: number;
  quantity: number;
}

export interface UpdateSkillLevelRequirementDTO {
  quantity: number;
}

export interface BulkUpsertSkillLevelRequirementsDTO {
  items: Array<{ item_id: number; quantity: number }>;
}
