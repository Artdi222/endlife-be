export interface NewsBanner {
  id: number;
  title: string;
  content: string | null;
  image_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateNewsBannerDTO {
  title: string;
  content?: string;
  order_index?: number;
  is_active?: boolean;
}

export interface UpdateNewsBannerDTO {
  title?: string;
  content?: string;
  order_index?: number;
  is_active?: boolean;
}
