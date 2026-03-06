export interface CreateCategoryDTO {
  name: string;
  order_index: number;
}

export interface UpdateCategoryDTO {
  id: number;
  name: string;
  order_index: number;
}

export interface Category {
  id: number;
  name: string;
  order_index: number;
}
