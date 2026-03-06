export type UserRole = "user" | "admin";

export interface JWTPayload {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
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
  };
}

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
}
