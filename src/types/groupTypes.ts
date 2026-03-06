export interface CreateGroupDTO {
  category_id: number;
  name: string;
  order_index: number;
}

export interface UpdateGroupDTO {
  id: number;
  category_id: number;
  name: string;
  order_index: number;
}

export interface Group {
  id: number;
  category_id: number;
  name: string;
  order_index: number;
}

export interface CreateSubGroupDTO {
  group_id: number;
  name: string;
  order_index: number;
}

export interface UpdateSubGroupDTO {
  id: number;
  group_id: number;
  name: string;
  order_index: number;
}

export interface SubGroup {
  id: number;
  group_id: number;
  name: string;
  order_index: number;
}
