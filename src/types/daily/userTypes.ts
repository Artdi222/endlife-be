export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}