export type UserRole = "user" | "admin";

export interface JWTPayload {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
  profile_image?: string | null;
  profile_banner?: string | null;
}

export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: {
    user_id: number;
    username: string;
    email: string;
    role: UserRole;
    profile_image?: string | null;
    profile_banner?: string | null;
  };
}

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  profile_image: string | null;
  profile_banner: string | null;
  created_at: string;
}
