import pool from "../db/index.js";
import type { User, CreateUserDTO, UpdateUserDTO } from "../types/userTypes.js";

// get all users
export const getUsers = async (): Promise<User[]> => {
  try {
    const result = await pool.query<User>(
      `SELECT id, username, email, role, created_at FROM users ORDER BY id`,
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
};

// get user by id
export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const result = await pool.query<User>(
      `SELECT id, username, email, role, created_at FROM users WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

// create user
export const createUser = async (payload: CreateUserDTO): Promise<User> => {
  try {
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
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// update user
export const updateUser = async (
  id: number,
  payload: UpdateUserDTO,
): Promise<User> => {
  try {
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
      throw new Error("No fields to update");
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

    if (!result.rows[0]) {
      throw new Error("User not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// delete user
export const deleteUser = async (id: number): Promise<void> => {
  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [id],
    );
    if (result.rows.length === 0) {
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
