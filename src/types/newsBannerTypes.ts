export interface NewsBanner {
  id: number;
  title: string;
  type: string;
  content: string | null;
  image_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateNewsBannerDTO {
  title: string;
  type?: string;
  content?: string;
  order_index?: number;
  is_active?: boolean;
}

export interface UpdateNewsBannerDTO {
  title?: string;
  type?: string;
  content?: string;
  order_index?: number;
  is_active?: boolean;
}
