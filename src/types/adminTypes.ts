export interface AdminTask {
  id: number;
  name: string;
  max_progress: number;
  reward_point: number;
  order_index: number;
  sub_group_id: number | null;
}

export interface AdminSubGroup {
  id: number;
  name: string;
  order_index: number;
  tasks: AdminTask[];
}

export interface AdminGroup {
  id: number;
  name: string;
  type: string;
  order_index: number;
  sub_groups: AdminSubGroup[];
  tasks: AdminTask[];
}

export interface AdminCategory {
  id: number;
  name: string;
  order_index: number;
  groups: AdminGroup[];
}
