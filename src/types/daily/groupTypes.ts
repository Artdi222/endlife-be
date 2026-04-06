export interface CreateGroupDTO {
  category_id: number;
  name: string;
  order_index: number;
}

export interface UpdateGroupDTO {
  category_id?: number;
  name?: string;
  order_index?: number;
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
  group_id?: number;
  name?: string;
  order_index?: number;
}

export interface SubGroup {
  id: number;
  group_id: number;
  name: string;
  order_index: number;
}
