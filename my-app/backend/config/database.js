const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'edulearn',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'petit',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error(' Error connecting to PostgreSQL:', err.stack);
  } else {
    console.log(' Connected to PostgreSQL successfully');
    release();
  }
});

// Run migrations
const runMigrations = async () => {
  try {
    // Check if migrations table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    // If users table doesn't exist, run migrations
    if (!tableCheck.rows[0].exists) {
      console.log(' Running database migrations...');
      const migrationSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/init.sql'),
        'utf8'
      );
      
      await pool.query(migrationSQL);
      console.log(' Database migrations completed');
    } else {
      console.log(' Database schema already exists, skipping migrations');
    }
  } catch (error) {
    console.error(' Migration error:', error);
    throw error;
  }
};

// Helper function for queries with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query:', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  runMigrations
};