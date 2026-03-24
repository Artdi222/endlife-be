// ─── LEVEL COST ───────────────────────────────────────────────────────────────
// Stores the EXP and credit cost for leveling from (level - 1) to level.
// Shared across all characters of the same entity_type — costs are uniform.

export interface LevelCost {
  id: number; // present in DB — was missing from original type
  entity_type: "character" | "weapon";
  level: number;
  exp_required: string; // BIGINT as string
  credit_cost: string; // BIGINT as string
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateLevelCostDTO {
  entity_type: "character" | "weapon";
  level: number;
  exp_required: number;
  credit_cost: number;
}

export interface UpdateLevelCostDTO {
  exp_required?: number;
  credit_cost?: number;
}

export interface BulkUpsertLevelCostsDTO {
  rows: Array<{
    level: number;
    exp_required: number;
    credit_cost: number;
  }>;
}
