// ─── USER CHARACTER ───────────────────────────────────────────────────────────

export interface UserCharacter {
  id: number;
  user_id: number;
  character_id: number;
  current_level: number;
  target_level: number;
  current_ascension_stage: number; // 0 = not yet ascended
  target_ascension_stage: number; // max 9
}

export interface UserCharacterWithDetails extends UserCharacter {
  // joined from characters
  character_name: string;
  character_icon: string | null;
  character_rarity: number;
  character_element: string;
  character_class: string | null;
}

// ─── USER CHARACTER SKILL ─────────────────────────────────────────────────────

export interface UserCharacterSkill {
  id: number;
  user_character_id: number;
  skill_id: number;
  current_level: number;
  target_level: number;
}

export interface UserCharacterSkillWithDetails extends UserCharacterSkill {
  // joined from skills
  skill_name: string;
  skill_type: string;
  skill_icon: string | null;
  skill_order_index: number;
}

// ─── USER WEAPON ──────────────────────────────────────────────────────────────

export interface UserWeapon {
  id: number;
  user_id: number;
  weapon_id: number;
  current_level: number;
  target_level: number;
  current_ascension_stage: number;
  target_ascension_stage: number;
}

export interface UserWeaponWithDetails extends UserWeapon {
  // joined from weapons
  weapon_name: string;
  weapon_icon: string | null;
  weapon_rarity: number;
  weapon_type: string;
}

// ─── USER INVENTORY ───────────────────────────────────────────────────────────

export interface UserInventoryItem {
  id: number;
  user_id: number;
  item_id: number;
  quantity: number;
  // joined from items
  item_name: string;
  item_image: string | null;
  item_category: string;
  item_exp_value: number;
  item_order_index: number;
}

// ─── PLANNER SUMMARY ──────────────────────────────────────────────────────────

export interface SummaryMaterial {
  item_id: number;
  name: string;
  image: string | null;
  category: string;
  total_needed: number;
  have: number;
  remaining: number;
}

export interface PlannerSummary {
  materials: SummaryMaterial[];
  total_credits_needed: string; // BIGINT sum as string
  total_exp_needed: string; // BIGINT sum as string
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface AddUserCharacterDTO {
  character_id: number;
  current_level?: number;
  target_level?: number;
  current_ascension_stage?: number;
  target_ascension_stage?: number;
}

export interface UpdateUserCharacterDTO {
  current_level?: number;
  target_level?: number;
  current_ascension_stage?: number;
  target_ascension_stage?: number;
}

export interface AddUserWeaponDTO {
  weapon_id: number;
  current_level?: number;
  target_level?: number;
  current_ascension_stage?: number;
  target_ascension_stage?: number;
}

export interface UpdateUserWeaponDTO {
  current_level?: number;
  target_level?: number;
  current_ascension_stage?: number;
  target_ascension_stage?: number;
}

export interface UpdateUserCharacterSkillDTO {
  current_level?: number;
  target_level?: number;
}

export interface UpsertInventoryItemDTO {
  quantity: number;
}

export interface BulkUpsertInventoryDTO {
  items: Array<{ item_id: number; quantity: number }>;
}
