# EndLife - Backend API

<div align="center">
  <h3>The blazingly fast backend powering the EndLife Arknights: Endfield companion app.</h3>
</div>

## 📖 Overview

This repository holds the **Backend** of the EndLife application. It is built using ElysiaJS and runs on the Bun runtime, providing incredibly fast performance and a standardized REST API for the Next.js frontend.

It serves as the main API for managing game data, user progression, ascension planner materials, and dashboard news feeds. It manages data persistency via PostgreSQL and Supabase.

## ✨ Features

- **Blazing Fast performance**: Built on [Bun](https://bun.sh/) and [ElysiaJS](https://elysiajs.com/), returning responses with extremely low latency.
- **Standardized Communication**: Uses a unified JSON response structure across all services, ensuring reliable data handling and error messaging for the frontend client.
- **Modular Architecture**: Employs a clean, maintainable structure splitting responsibilities across Routes, Controllers, Services, and Middlewares.
- **Secure Authentication**: Built-in authentication using JWT (`@elysiajs/jwt`, `@elysiajs/bearer`) and password hashing via `bcrypt`.
- **Database Integration**: Connects with PostgreSQL / [Supabase](https://supabase.com/) to process user game state, character progression, weapons, and administrative news data.

## 🛠️ Technology Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [ElysiaJS](https://elysiajs.com/)
- **Database:** PostgreSQL (via `pg`) & [Supabase](https://supabase.com/)
- **Authentication:** JWT, bcrypt
- **Language:** TypeScript

## 🚀 Getting Started

Follow these steps to get the API running locally.

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- A functional PostgreSQL database or Supabase project.

### Installation

1. **Navigate to the Backend Directory** (if standalone):
   ```bash
   cd endlife-be
   ```

2. **Install Dependencies**:
   ```bash
   bun install
   ```

3. **Configure Environment Variables**:
   Create a `.env` or `.env.local` file in the root directory. You will need to provide your database connection string and secret keys.
   ```env
   # Example required configuration
   DATABASE_URL="postgresql://user:password@localhost:5432/endlife"
   # Add SUPABASE or JWT configs as required by your specific environment
   ```

4. **Run the Development Server**:
   ```bash
   bun run dev
   ```
   This command starts the server in watch mode using `bun run --watch src/index.ts`.

## 📁 Project Structure

```text
endlife-be/
├── src/
│   ├── controllers/      # Parsing requests, forwarding to services, and returning responses
│   ├── db/               # Database connection instances and queries setup
│   ├── lib/              # Shared utility functions (e.g., standardized JSON responses)
│   ├── middleware/       # Request interceptors (e.g., JWT authentication checks)
│   ├── routes/           # API path definitions linking endpoints to controllers
│   ├── services/         # Core business logic and database interactions
│   ├── types/            # TypeScript interfaces and global schemas
│   └── index.ts          # Main application entry point and Elysia app initialization
├── bun.lock              # Bun lockfile
├── package.json          # Project metadata and dependencies
└── tsconfig.json         # TypeScript compiler options
```

## 🔌 API Communication

Frontend communication is handled through a standardized Fetch wrapper that expects the backend's unified `ApiResponse<T>` structure. The backend ensures all controllers return consistent status codes and message formats for a predictable client-side experience.

## 📄 License

This project is created for educational and community purposes. All Arknights: Endfield related assets, names, and concepts belong to Hypergryph / Gryphline.
