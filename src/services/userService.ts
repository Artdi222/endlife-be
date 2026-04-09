import pool from "../db/index.js";
import type {
  RegisterDTO,
  LoginDTO,
  UserRow,
  JWTPayload,
} from "../types/authTypes.js";
import type { User, CreateUserDTO, UpdateUserDTO } from "../types/userTypes.js";
import { supabase } from "../lib/supabase.js";

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
    profile_image: user.profile_image,
    profile_banner: user.profile_banner,
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
    profile_image: user.profile_image,
    profile_banner: user.profile_banner,
  };
};

// ── CRUD Operations (Admin) ──────────────────────────────────────────────────

// get all users
export const getUsers = async (): Promise<User[]> => {
  const result = await pool.query<User>(
    `SELECT id, username, email, role, profile_image, profile_banner, created_at FROM users ORDER BY id`,
  );
  return result.rows;
};

// get user by id
export const getUserById = async (id: number): Promise<User | null> => {
  const result = await pool.query<User>(
    `SELECT id, username, email, role, profile_image, profile_banner, created_at FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
};

// create user
export const createUser = async (payload: CreateUserDTO): Promise<User> => {
  const { username, email, password, role, profile_image, profile_banner } =
    payload;

  const hash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const result = await pool.query<User>(
    `
    INSERT INTO users (username, email, password_hash, role, profile_image, profile_banner)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, username, email, role, profile_image, profile_banner, created_at
    `,
    [
      username,
      email,
      hash,
      role ?? "user",
      profile_image ?? null,
      profile_banner ?? null,
    ],
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

  if (payload.username !== undefined) {
    fields.push(`username = $${idx++}`);
    values.push(payload.username);
  }

  if (payload.email !== undefined) {
    fields.push(`email = $${idx++}`);
    values.push(payload.email);
  }

  if (payload.role !== undefined) {
    fields.push(`role = $${idx++}`);
    values.push(payload.role);
  }

  if (payload.profile_image !== undefined) {
    fields.push(`profile_image = $${idx++}`);
    values.push(payload.profile_image);
  }

  if (payload.profile_banner !== undefined) {
    fields.push(`profile_banner = $${idx++}`);
    values.push(payload.profile_banner);
  }

  if (payload.password !== undefined) {
    const hash = await Bun.password.hash(payload.password, {
      algorithm: "bcrypt",
      cost: 10,
    });
    fields.push(`password_hash = $${idx++}`);
    values.push(hash);
  }

  if (fields.length === 0) {
    return getUserById(id);
  }

  const result = await pool.query<User>(
    `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING id, username, email, role, profile_image, profile_banner, created_at
    `,
    [...values, id],
  );

  return result.rows[0] ?? null;
};

// delete user
export const deleteUser = async (id: number): Promise<boolean> => {
  // Clean up user images from Supabase
  const { data: iconFiles } = await supabase.storage
    .from("users")
    .list("icon", { search: `${id}-` });
  if (iconFiles && iconFiles.length > 0) {
    const paths = iconFiles.map((f) => `icon/${f.name}`);
    await supabase.storage.from("users").remove(paths);
  }

  const { data: bannerFiles } = await supabase.storage
    .from("users")
    .list("banner", { search: `${id}-` });
  if (bannerFiles && bannerFiles.length > 0) {
    const paths = bannerFiles.map((f) => `banner/${f.name}`);
    await supabase.storage.from("users").remove(paths);
  }

  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
};

// upload profile image (icon)
export const uploadProfileImage = async (
  id: number,
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<User | null> => {
  // Cleanup old icons for this user
  const { data: oldFiles } = await supabase.storage
    .from("users")
    .list("icon", { search: `${id}-` });
  if (oldFiles && oldFiles.length > 0) {
    await supabase.storage
      .from("users")
      .remove(oldFiles.map((f) => `icon/${f.name}`));
  }

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const timestamp = Date.now();
  const path = `icon/${id}-${timestamp}-${sanitizedFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("users")
    .upload(path, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("users").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const result = await pool.query<User>(
    `UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING id, username, email, role, profile_image, profile_banner, created_at`,
    [publicUrl, id],
  );

  return result.rows[0] ?? null;
};

// upload profile banner
export const uploadProfileBanner = async (
  id: number,
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<User | null> => {
  // Cleanup old banners for this user
  const { data: oldFiles } = await supabase.storage
    .from("users")
    .list("banner", { search: `${id}-` });
  if (oldFiles && oldFiles.length > 0) {
    await supabase.storage
      .from("users")
      .remove(oldFiles.map((f) => `banner/${f.name}`));
  }

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const timestamp = Date.now();
  const path = `banner/${id}-${timestamp}-${sanitizedFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("users")
    .upload(path, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("users").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const result = await pool.query<User>(
    `UPDATE users SET profile_banner = $1 WHERE id = $2 RETURNING id, username, email, role, profile_image, profile_banner, created_at`,
    [publicUrl, id],
  );

  return result.rows[0] ?? null;
};
