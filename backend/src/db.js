const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

const convertPlaceholders = (text) => {
  if (!text || typeof text !== 'string') return text;
  let index = 0;
  return text.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
};

const ensureReturningId = (text) => {
  if (!text || typeof text !== 'string') return text;
  const normalized = text.trim().toLowerCase();
  if (!normalized.startsWith('insert')) {
    return text;
  }
  if (normalized.includes('insert into rate_limits')) {
    return text;
  }
  if (normalized.includes('insert into message_deletions')) {
    return text;
  }
  if (normalized.includes('insert into server_message_deletions')) {
    return text;
  }
  if (normalized.includes('insert into link_previews')) {
    return text;
  }
  if (normalized.includes('returning')) {
    return text;
  }
  return `${text.trim()} RETURNING id`;
};

const runWithContext = (result, callback) => {
  if (!callback) return;
  const ctx = {
    lastID: result?.rows?.[0]?.id,
    changes: result?.rowCount ?? 0,
  };
  callback.call(ctx, null);
};

const handleError = (error, callback) => {
  if (callback) {
    callback(error);
  }
};

module.exports = {
  pool,
  getClient: () => pool.connect(),
  query: (text, params) => pool.query(text, params),
  exec: (text, callback) => {
    const sql = convertPlaceholders(text);
    pool.query(sql)
      .then(() => runWithContext({ rowCount: 0, rows: [] }, callback))
      .catch((error) => handleError(error, callback));
  },
  run: (text, params, callback) => {
    const values = Array.isArray(params) ? params : [];
    const cb = typeof params === 'function' ? params : callback;
    const sql = typeof params === 'function' ? text : text;
    const prepared = convertPlaceholders(ensureReturningId(sql));
    pool.query(prepared, values)
      .then((result) => runWithContext(result, cb))
      .catch((error) => handleError(error, cb));
  },
  get: (text, params, callback) => {
    const values = Array.isArray(params) ? params : [];
    const cb = typeof params === 'function' ? params : callback;
    const sql = typeof params === 'function' ? text : text;
    const prepared = convertPlaceholders(sql);
    pool.query(prepared, values)
      .then((result) => cb(null, result.rows[0]))
      .catch((error) => cb(error));
  },
  all: (text, params, callback) => {
    const values = Array.isArray(params) ? params : [];
    const cb = typeof params === 'function' ? params : callback;
    const sql = typeof params === 'function' ? text : text;
    const prepared = convertPlaceholders(sql);
    pool.query(prepared, values)
      .then((result) => cb(null, result.rows))
      .catch((error) => cb(error));
  },
  serialize: (fn) => {
    if (typeof fn === 'function') {
      fn();
    }
  },
};

