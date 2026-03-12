export interface Weapon {
  id: number;
  name: string;
  rarity: number;
  type: string; // Sword, Gun, Greatsword, etc.
  icon: string | null;
  order_index: number;
}

export interface CreateWeaponDTO {
  name: string;
  rarity: number;
  type: string;
  order_index?: number;
}

export interface UpdateWeaponDTO {
  name?: string;
  rarity?: number;
  type?: string;
  icon?: string;
  order_index?: number;
}

export interface UploadWeaponMediaDTO {
  bucket: "weapons";
  folder: "icon";
  field: "icon";
}
