require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const migrationsDir = path.join(__dirname, '../database/migrations');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const run = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )`
    );

    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const id = file;
      const { rows } = await client.query('SELECT 1 FROM migrations WHERE id = $1', [id]);
      if (rows.length > 0) continue;

      let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      sql = sql.replace(/^\s*\\i\s+(.+)$/gmi, (_, includePath) => {
        const cleaned = includePath.replace(/['"]/g, '').trim();
        const resolved = path.resolve(migrationsDir, cleaned);
        return fs.readFileSync(resolved, 'utf8');
      });
      await client.query(sql);
      await client.query('INSERT INTO migrations (id) VALUES ($1)', [id]);
    }

    await client.query('COMMIT');
    console.log('Database migrations complete.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database migrations failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((error) => {
  console.error('Database initialization failed:', error.message);
  process.exitCode = 1;
});
