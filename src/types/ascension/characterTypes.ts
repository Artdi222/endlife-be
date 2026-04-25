export interface Character {
  id: number;
  name: string;
  rarity: number;
  element: string;
  weapon_type: string;
  race: string | null;
  faction: string | null;
  class: string | null;
  description: string | null;
  icon: string | null;
  splash_art: string | null;
  video_enter: string | null;
  video_idle: string | null;
  card_image: string | null;
  order_index: number;
}

export interface CreateCharacterDTO {
  name: string;
  rarity: number;
  element: string;
  weapon_type: string;
  race?: string;
  faction?: string;
  class?: string;
  description?: string;
  order_index?: number;
}

export interface UpdateCharacterDTO {
  name?: string;
  rarity?: number;
  element?: string;
  weapon_type?: string;
  race?: string;
  faction?: string;
  class?: string;
  description?: string;
  icon?: string;
  splash_art?: string;
  video_enter?: string;
  video_idle?: string;
  card_image?: string;
  order_index?: number;
}

export interface UploadMediaDTO {
  bucket: "characters" | "videos";
  folder: string;
  field: "icon" | "splash_art" | "video_enter" | "video_idle" | "card_image";
}
