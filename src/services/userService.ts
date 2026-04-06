import pool from "../db/index.js";
import type {
  RegisterDTO,
  LoginDTO,
  UserRow,
  JWTPayload,
} from "../types/authTypes.js";
import type {
  User,
  CreateUserDTO,
  UpdateUserDTO,
} from "../types/daily/userTypes.js";

/**
 * Service for user authentication and management
 */

// register
export const registerUser = async (
  payload: RegisterDTO,
): Promise<JWTPayload> => {
  const { username, email, password } = payload;

  // Check if email already exists
  const existing = await pool.query<UserRow>(
    `SELECT id FROM users WHERE email = $1`,
    [email],
  );

  if (existing.rows.length > 0) {
    throw new Error("EMAIL_TAKEN");
  }

  // Hash password with Bun's built-in
  const password_hash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const result = await pool.query<UserRow>(
    `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [username, email, password_hash],
  );

  const user = result.rows[0];

  return {
    user_id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
};

// login
export const loginUser = async (payload: LoginDTO): Promise<JWTPayload> => {
  const { email, password } = payload;

  const result = await pool.query<UserRow>(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );

  if (result.rows.length === 0) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = result.rows[0];

  const isValid = await Bun.password.verify(password, user.password_hash);

  if (!isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return {
    user_id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
};

// ── CRUD Operations (Admin) ──────────────────────────────────────────────────

// get all users
export const getUsers = async (): Promise<User[]> => {
  const result = await pool.query<User>(
    `SELECT id, username, email, role, created_at FROM users ORDER BY id`,
  );
  return result.rows;
};

// get user by id
export const getUserById = async (id: number): Promise<User | null> => {
  const result = await pool.query<User>(
    `SELECT id, username, email, role, created_at FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
};

// create user
export const createUser = async (payload: CreateUserDTO): Promise<User> => {
  const { username, email, password, role } = payload;

  const hash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const result = await pool.query<User>(
    `
    INSERT INTO users (username, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, username, email, role, created_at
    `,
    [username, email, hash, role ?? "user"],
  );

  return result.rows[0];
};

// update user
export const updateUser = async (
  id: number,
  payload: UpdateUserDTO,
): Promise<User | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (payload.username) {
    fields.push(`username = $${idx++}`);
    values.push(payload.username);
  }

  if (payload.email) {
    fields.push(`email = $${idx++}`);
    values.push(payload.email);
  }

  if (payload.role) {
    fields.push(`role = $${idx++}`);
    values.push(payload.role);
  }

  if (payload.password) {
    const hash = await Bun.password.hash(payload.password, {
      algorithm: "bcrypt",
      cost: 10,
    });
    fields.push(`password_hash = $${idx++}`);
    values.push(hash);
  }

  if (fields.length === 0) {
    return null;
  }

  const result = await pool.query<User>(
    `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING id, username, email, role, created_at
    `,
    [...values, id],
  );

  return result.rows[0] ?? null;
};

// delete user
export const deleteUser = async (id: number): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
};
