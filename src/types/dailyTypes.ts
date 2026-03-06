export interface DailyChecklistRow {
  category_id: number;
  category_name: string;
  group_id: number;
  group_name: string;
  sub_group_id: number | null;
  sub_group_name: string | null;
  task_id: number;
  task_name: string;
  max_progress: number;
  reward_point: number;
  current_progress: number;
}

export interface UpdateTaskProgressDTO {
  user_id: number;
  task_id: number;
  date: string;
  current_progress: number;
}

export interface ActivityLevelResult {
  activity_level: number;
}

export interface GlobalCategoryProgress {
  category_id: number;
  category_name: string;
  is_completed: boolean;
}

export interface GlobalProgressResult {
  total_categories: number;
  completed_categories: number;
  progress: number;
  detail: GlobalCategoryProgress[];
}

export interface SanityTracker {
  id: number;
  user_id: number;
  current_sanity: number;
  max_sanity: number;
  last_update: string;
}

export interface UpdateSanityDTO {
  user_id: number;
  current_sanity: number;
  max_sanity: number;
}

export interface SanityResult {
  current_sanity: number;
  max_sanity: number;
  full_in_seconds: number;
}
