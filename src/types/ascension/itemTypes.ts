export type ItemCategory =
  | "Progression Materials"
  | "Naturals"
  | "Gatherables"
  | "Rare Materials"
  | "AIC Products"
  | "Usables"
  | "Functionals"
  | "Operator Gifts"
  | "Currency";

export interface Item {
  id: number;
  name: string;
  image: string | null;
  category: ItemCategory;
  exp_value: number;
  order_index: number;
}

export interface CreateItemDTO {
  name: string;
  category: ItemCategory;
  exp_value?: number;
  order_index?: number;
}

export interface UpdateItemDTO {
  name?: string;
  image?: string;
  category?: ItemCategory;
  exp_value?: number;
  order_index?: number;
}


