export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  profile_image: string | null;
  profile_banner: string | null;
  created_at: string;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  role?: string;
  profile_image?: string;
  profile_banner?: string;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  profile_image?: string;
  profile_banner?: string;
}