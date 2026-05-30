const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const migrationsDir = path.resolve(__dirname, '..', 'database', 'migrations');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getApplied(client) {
  const { rows } = await client.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((r) => r.filename));
}

function getMigrationFiles() {
  return fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, 'en'));
}

function resolvePsqlIncludes(sql, baseDir) {
  const includeRegex = /^\s*\\i\s+(.+)\s*$/gm;
  return sql.replace(includeRegex, (_line, includePathRaw) => {
    const cleaned = String(includePathRaw || '').trim().replace(/^['"]|['"]$/g, '');
    const includeFullPath = path.resolve(baseDir, cleaned);
    if (!fs.existsSync(includeFullPath)) {
      throw new Error(`Include file not found: ${cleaned}`);
    }
    return fs.readFileSync(includeFullPath, 'utf8');
  });
}

function sanitizeSql(sql) {
  return String(sql || '')
    .replace(/^\uFEFF/, '')
    .replace(/^\s*\\[a-zA-Z]+.*$/gm, '');
}

async function applyFile(client, filename) {
  const fullPath = path.join(migrationsDir, filename);
  const rawSql = fs.readFileSync(fullPath, 'utf8');
  const sql = sanitizeSql(resolvePsqlIncludes(rawSql, path.dirname(fullPath)));

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(filename) VALUES($1)', [filename]);
    await client.query('COMMIT');
    console.log(`[migrate] applied: ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Failed migration ${filename}: ${error.message}`);
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);
    const files = getMigrationFiles();

    let appliedCount = 0;
    for (const filename of files) {
      if (applied.has(filename)) {
        console.log(`[migrate] skip: ${filename}`);
        continue;
      }
      await applyFile(client, filename);
      appliedCount += 1;
    }

    console.log(`[migrate] done. newly applied: ${appliedCount}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[migrate] error:', error.message);
  process.exitCode = 1;
});

