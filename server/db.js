const { Pool } = require("pg");
require("dotenv").config();

// Use DATABASE_URL from generic .env or server/.env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "⚠️ WARNING: DATABASE_URL is missing. Chat history will not be saved.",
  );
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for many hosted Postgres services (Neon, Supabase, Render)
  },
});

// Initialize Tables
const initDB = async () => {
  if (!connectionString) return;

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS intelligence (
       id SERIAL PRIMARY KEY,
       session_id VARCHAR(255) NOT NULL,
       data JSONB NOT NULL,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log("✅ Database Tables Initialized (conversations, intelligence)");
  } catch (err) {
    console.error("❌ Database Initialization Failed:", err);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDB,
  pool,
};
