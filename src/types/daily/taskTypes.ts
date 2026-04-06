export interface CreateTaskDTO {
  group_id: number;
  sub_group_id?: number;
  name: string;
  max_progress: number;
  reward_point: number;
  order_index: number;
}

export interface UpdateTaskDTO {
  group_id?: number;
  sub_group_id?: number;
  name?: string;
  max_progress?: number;
  reward_point?: number;
  order_index?: number;
}

export interface Task {
  id: number;
  group_id: number;
  sub_group_id: number | null;
  name: string;
  max_progress: number;
  reward_point: number;
  order_index: number;
}
