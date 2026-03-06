export interface Item {
  id: string;
  name: string;
  image_path: string | null;
  rarity: number;
  type: string;
  created_at: Date;
  updated_at: Date;
}

export interface createItemDTO {
  id: string;
  name: string;
  image_path?: string | null;
  rarity: number;
  type: string;
}

export interface UpdateItemDTO {
  name?: string;
  image_path?: string | null;
  rarity?: number;
  type?: string;
}

