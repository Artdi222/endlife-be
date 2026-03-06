import pool from "../db/index.js";
import type {
  RegisterDTO,
  LoginDTO,
  UserRow,
  JWTPayload,
} from "../types/authTypes.js";

// register
export const registerUser = async (
  payload: RegisterDTO,
): Promise<JWTPayload> => {
  try {
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
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

// login
export const loginUser = async (payload: LoginDTO): Promise<JWTPayload> => {
  try {
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
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
};
