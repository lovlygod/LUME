const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { authenticateToken } = require('./auth');
const { asyncHandler, ValidationError, ForbiddenError, NotFoundError } = require('./errors');

const router = express.Router();

const hashSecret = (value) => crypto.createHash('sha256').update(value).digest('hex');

const generateClientId = () => uuidv4();
const generateClientSecret = () => crypto.randomBytes(32).toString('hex');
const generateApiKey = () => `lume_${crypto.randomBytes(32).toString('hex')}`;
const buildApiKeyPreview = (apiKey) => `...${apiKey.slice(-6)}`;

const fetchAppsForUser = (userId) => new Promise((resolve, reject) => {
  db.all(
    `SELECT id, name, description, website, client_id, created_at
     FROM developer_apps
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    }
  );
});

const logAppEvent = (appId, eventType, message) => {
  db.run(
    `INSERT INTO developer_app_events (app_id, event_type, message)
     VALUES ($1, $2, $3)`,
    [appId, eventType, message || null],
    () => {}
  );
};

const logKeyEvent = (appId, apiKeyId, eventType, message) => {
  db.run(
    `INSERT INTO developer_api_key_events (app_id, api_key_id, event_type, message)
     VALUES ($1, $2, $3, $4)`,
    [appId, apiKeyId || null, eventType, message || null],
    () => {}
  );
};

const fetchUsageStatsForApps = (appIds) => new Promise((resolve, reject) => {
  if (!appIds.length) return resolve(new Map());
  db.all(
    `SELECT app_id,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE timestamp >= date_trunc('day', NOW())) AS today
     FROM developer_api_usage
     WHERE app_id = ANY($1)
     GROUP BY app_id`,
    [appIds],
    (err, rows) => {
      if (err) return reject(err);
      const stats = new Map();
      (rows || []).forEach((row) => {
        stats.set(String(row.app_id), {
          total: Number(row.total || 0),
          today: Number(row.today || 0),
        });
      });
      resolve(stats);
    }
  );
});

const fetchLatestApiKey = (appId) => new Promise((resolve, reject) => {
  db.get(
    `SELECT api_key_preview, created_at, last_used
     FROM developer_api_keys
     WHERE app_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [appId],
    (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    }
  );
});

const fetchApiKeysForApp = (appId) => new Promise((resolve, reject) => {
  db.all(
    `SELECT id, api_key_preview, created_at, last_used
     FROM developer_api_keys
     WHERE app_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [appId],
    (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    }
  );
});

const fetchUserUsageStats = (userId) => new Promise((resolve, reject) => {
  db.get(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE u.timestamp >= date_trunc('day', NOW())) AS today
     FROM developer_api_usage u
     JOIN developer_apps a ON u.app_id = a.id
     WHERE a.user_id = $1`,
    [userId],
    (err, row) => {
      if (err) return reject(err);
      resolve({
        total: Number(row?.total || 0),
        today: Number(row?.today || 0),
      });
    }
  );
});

router.get('/dashboard', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const [apps, usage] = await Promise.all([
    fetchAppsForUser(userId),
    fetchUserUsageStats(userId),
  ]);

  res.json({
    applicationsCount: apps.length,
    apiRequestsToday: usage.today,
    apiRequestsTotal: usage.total,
  });
}));

router.get('/apps', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const apps = await fetchAppsForUser(userId);
  const appIds = apps.map((app) => Number(app.id)).filter((id) => Number.isFinite(id));
  const usageStats = await fetchUsageStatsForApps(appIds);

  const results = await Promise.all(apps.map(async (app) => {
    const apiKey = await fetchLatestApiKey(app.id);
    const stats = usageStats.get(String(app.id)) || { total: 0, today: 0 };
    return {
      id: String(app.id),
      name: app.name,
      description: app.description,
      website: app.website,
      clientId: app.client_id,
      createdAt: app.created_at,
      apiKeyPreview: apiKey?.api_key_preview || null,
      apiKeyLastUsed: apiKey?.last_used || null,
      apiRequestsToday: stats.today,
      apiRequestsTotal: stats.total,
    };
  }));

  res.json({ apps: results });
}));

router.get('/apps/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const appId = Number(req.params.id);

  if (!Number.isFinite(appId)) {
    throw new ValidationError('Invalid app id');
  }

  const app = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id, name, description, website, client_id, created_at
       FROM developer_apps
       WHERE id = $1`,
      [appId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }

  if (String(app.user_id) !== String(userId)) {
    throw new ForbiddenError('Access denied');
  }

  const [apiKey, usageStats] = await Promise.all([
    fetchLatestApiKey(appId),
    fetchUsageStatsForApps([appId]),
  ]);

  const stats = usageStats.get(String(appId)) || { total: 0, today: 0 };

  res.json({
    app: {
      id: String(app.id),
      name: app.name,
      description: app.description,
      website: app.website,
      clientId: app.client_id,
      createdAt: app.created_at,
      apiKeyPreview: apiKey?.api_key_preview || null,
      apiKeyLastUsed: apiKey?.last_used || null,
      apiRequestsToday: stats.today,
      apiRequestsTotal: stats.total,
    }
  });
}));

router.put('/apps/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const appId = Number(req.params.id);
  const { name, description, website } = req.body || {};

  if (!Number.isFinite(appId)) {
    throw new ValidationError('Invalid app id');
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new ValidationError('Application name is required');
  }

  const app = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id
       FROM developer_apps
       WHERE id = $1`,
      [appId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }

  if (String(app.user_id) !== String(userId)) {
    throw new ForbiddenError('Access denied');
  }

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE developer_apps
       SET name = $1, description = $2, website = $3
       WHERE id = $4`,
      [name.trim(), description ? String(description).trim() : null, website ? String(website).trim() : null, appId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });

  logAppEvent(appId, 'app.updated', 'Application profile updated');

  res.json({
    app: {
      id: String(appId),
      name: name.trim(),
      description: description ? String(description).trim() : null,
      website: website ? String(website).trim() : null,
    }
  });
}));

router.delete('/apps/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const appId = Number(req.params.id);

  if (!Number.isFinite(appId)) {
    throw new ValidationError('Invalid app id');
  }

  const app = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id, name
       FROM developer_apps
       WHERE id = $1`,
      [appId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }

  if (String(app.user_id) !== String(userId)) {
    throw new ForbiddenError('Access denied');
  }

  await new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM developer_apps WHERE id = $1`,
      [appId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });

  logAppEvent(appId, 'app.deleted', `Application deleted: ${app.name}`);

  res.json({ message: 'Application deleted' });
}));

router.get('/apps/:id/keys', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const appId = Number(req.params.id);

  if (!Number.isFinite(appId)) {
    throw new ValidationError('Invalid app id');
  }

  const app = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id
       FROM developer_apps
       WHERE id = $1`,
      [appId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }

  if (String(app.user_id) !== String(userId)) {
    throw new ForbiddenError('Access denied');
  }

  const keys = await fetchApiKeysForApp(appId);
  const enriched = await Promise.all(keys.map(async (key) => new Promise((resolve, reject) => {
    db.get(
      `SELECT status, compromised_at, deactivated_at
       FROM developer_api_key_status
       WHERE api_key_id = $1`,
      [key.id],
      (err, row) => {
        if (err) return reject(err);
        resolve({
          id: String(key.id),
          apiKeyPreview: key.api_key_preview,
          createdAt: key.created_at,
          lastUsed: key.last_used,
          status: row?.status || 'active',
          compromisedAt: row?.compromised_at || null,
          deactivatedAt: row?.deactivated_at || null,
        });
      }
    );
  })));

  res.json({ keys: enriched });
}));

router.post('/apps/:id/keys', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const appId = Number(req.params.id);

  if (!Number.isFinite(appId)) {
    throw new ValidationError('Invalid app id');
  }

  const app = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id
       FROM developer_apps
       WHERE id = $1`,
      [appId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }

  if (String(app.user_id) !== String(userId)) {
    throw new ForbiddenError('Access denied');
  }

  const apiKey = generateApiKey();
  const apiKeyPreview = buildApiKeyPreview(apiKey);

  const keyId = await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO developer_api_keys (app_id, api_key_hash, api_key_preview)
       VALUES ($1, $2, $3)`,
      [appId, hashSecret(apiKey), apiKeyPreview],
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });

  db.run(
    `INSERT INTO developer_api_key_status (api_key_id, status)
     VALUES ($1, 'active')`,
    [keyId],
    () => {}
  );

  logKeyEvent(appId, keyId, 'key.created', 'API key created');

  res.status(201).json({
    key: {
      id: String(keyId),
      apiKeyPreview,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      status: 'active',
      compromisedAt: null,
      deactivatedAt: null,
    },
    apiKey,
  });
}));

router.post('/apps/:id/keys/:keyId/deactivate', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const appId = Number(req.params.id);
  const keyId = Number(req.params.keyId);

  if (!Number.isFinite(appId) || !Number.isFinite(keyId)) {
    throw new ValidationError('Invalid id');
  }

  const app = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id
       FROM developer_apps
       WHERE id = $1`,
      [appId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }
  if (String(app.user_id) !== String(userId)) {
    throw new ForbiddenError('Access denied');
  }

  db.run(
    `INSERT INTO developer_api_key_status (api_key_id, status, deactivated_at)
     VALUES ($1, 'deactivated', NOW())
     ON CONFLICT (api_key_id) DO UPDATE SET status = 'deactivated', deactivated_at = NOW()`,
    [keyId],
    () => {}
  );

  logKeyEvent(appId, keyId, 'key.deactivated', 'API key deactivated');

  res.json({ message: 'Key deactivated' });
}));

router.post('/apps/:id/keys/:keyId/compromise', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const appId = Number(req.params.id);
  const keyId = Number(req.params.keyId);

  if (!Number.isFinite(appId) || !Number.isFinite(keyId)) {
    throw new ValidationError('Invalid id');
  }

  const app = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id
       FROM developer_apps
       WHERE id = $1`,
      [appId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }
  if (String(app.user_id) !== String(userId)) {
    throw new ForbiddenError('Access denied');
  }

  db.run(
    `INSERT INTO developer_api_key_status (api_key_id, status, compromised_at)
     VALUES ($1, 'compromised', NOW())
     ON CONFLICT (api_key_id) DO UPDATE SET status = 'compromised', compromised_at = NOW()`,
    [keyId],
    () => {}
  );

  logKeyEvent(appId, keyId, 'key.compromised', 'API key flagged as compromised');

  res.json({ message: 'Key flagged as compromised' });
}));

router.delete('/apps/:id/keys/:keyId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const appId = Number(req.params.id);
  const keyId = Number(req.params.keyId);

  if (!Number.isFinite(appId) || !Number.isFinite(keyId)) {
    throw new ValidationError('Invalid id');
  }

  const app = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id
       FROM developer_apps
       WHERE id = $1`,
      [appId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }
  if (String(app.user_id) !== String(userId)) {
    throw new ForbiddenError('Access denied');
  }

  await new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM developer_api_keys WHERE id = $1 AND app_id = $2`,
      [keyId, appId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });

  logKeyEvent(appId, keyId, 'key.deleted', 'API key deleted');

  res.json({ message: 'Key deleted' });
}));

router.get('/apps/:id/key-events', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const appId = Number(req.params.id);

  if (!Number.isFinite(appId)) {
    throw new ValidationError('Invalid app id');
  }

  const app = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id
       FROM developer_apps
       WHERE id = $1`,
      [appId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }
  if (String(app.user_id) !== String(userId)) {
    throw new ForbiddenError('Access denied');
  }

  const events = await new Promise((resolve, reject) => {
    db.all(
      `SELECT id, api_key_id, event_type, message, created_at
       FROM developer_api_key_events
       WHERE app_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [appId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });

  res.json({
    events: events.map((event) => ({
      id: String(event.id),
      apiKeyId: event.api_key_id ? String(event.api_key_id) : null,
      eventType: event.event_type,
      message: event.message,
      createdAt: event.created_at,
    }))
  });
}));

router.get('/apps/:id/analytics', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const appId = Number(req.params.id);

  if (!Number.isFinite(appId)) {
    throw new ValidationError('Invalid app id');
  }

  const app = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id
       FROM developer_apps
       WHERE id = $1`,
      [appId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }
  if (String(app.user_id) !== String(userId)) {
    throw new ForbiddenError('Access denied');
  }

  const daily = await new Promise((resolve, reject) => {
    db.all(
      `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
              COUNT(*) AS total
       FROM developer_api_request_logs
       WHERE app_id = $1 AND created_at >= NOW() - INTERVAL '14 days'
       GROUP BY day
       ORDER BY day`,
      [appId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });

  const endpoints = await new Promise((resolve, reject) => {
    db.all(
      `SELECT endpoint, COUNT(*) AS total
       FROM developer_api_request_logs
       WHERE app_id = $1
       GROUP BY endpoint
       ORDER BY total DESC
       LIMIT 10`,
      [appId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });

  const statuses = await new Promise((resolve, reject) => {
    db.all(
      `SELECT CASE
         WHEN status_code BETWEEN 200 AND 299 THEN '2xx'
         WHEN status_code BETWEEN 400 AND 499 THEN '4xx'
         WHEN status_code BETWEEN 500 AND 599 THEN '5xx'
         ELSE 'other' END AS bucket,
         COUNT(*) AS total
       FROM developer_api_request_logs
       WHERE app_id = $1
       GROUP BY bucket`,
      [appId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });

  res.json({
    daily: daily.map((row) => ({ day: row.day, total: Number(row.total) })),
    endpoints: endpoints.map((row) => ({ endpoint: row.endpoint, total: Number(row.total) })),
    statuses: statuses.map((row) => ({ bucket: row.bucket, total: Number(row.total) })),
  });
}));

router.get('/apps/:id/logs', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const appId = Number(req.params.id);
  const { from, to, endpoint, status, ip, format } = req.query || {};

  if (!Number.isFinite(appId)) {
    throw new ValidationError('Invalid app id');
  }

  const app = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id
       FROM developer_apps
       WHERE id = $1`,
      [appId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }
  if (String(app.user_id) !== String(userId)) {
    throw new ForbiddenError('Access denied');
  }

  const filters = ['app_id = $1'];
  const values = [appId];

  if (from) {
    values.push(String(from));
    filters.push(`created_at >= $${values.length}`);
  }
  if (to) {
    values.push(String(to));
    filters.push(`created_at <= $${values.length}`);
  }
  if (endpoint) {
    values.push(`%${endpoint}%`);
    filters.push(`endpoint ILIKE $${values.length}`);
  }
  if (status) {
    values.push(Number(status));
    filters.push(`status_code = $${values.length}`);
  }
  if (ip) {
    values.push(String(ip));
    filters.push(`ip = $${values.length}`);
  }

  const logs = await new Promise((resolve, reject) => {
    db.all(
      `SELECT id, endpoint, method, status_code, ip, created_at
       FROM developer_api_request_logs
       WHERE ${filters.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT 500`,
      values,
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });

  if (format === 'csv') {
    const header = 'id,endpoint,method,status,ip,created_at';
    const lines = logs.map((row) =>
      [row.id, row.endpoint, row.method, row.status_code, row.ip, row.created_at]
        .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    res.setHeader('Content-Type', 'text/csv');
    return res.send([header, ...lines].join('\n'));
  }

  res.json({
    logs: logs.map((row) => ({
      id: String(row.id),
      endpoint: row.endpoint,
      method: row.method,
      status: row.status_code,
      ip: row.ip,
      createdAt: row.created_at,
    }))
  });
}));

router.get('/apps/:id/events', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const appId = Number(req.params.id);

  if (!Number.isFinite(appId)) {
    throw new ValidationError('Invalid app id');
  }

  const app = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id
       FROM developer_apps
       WHERE id = $1`,
      [appId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }
  if (String(app.user_id) !== String(userId)) {
    throw new ForbiddenError('Access denied');
  }

  const events = await new Promise((resolve, reject) => {
    db.all(
      `SELECT id, event_type, message, created_at
       FROM developer_app_events
       WHERE app_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [appId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });

  res.json({
    events: events.map((event) => ({
      id: String(event.id),
      eventType: event.event_type,
      message: event.message,
      createdAt: event.created_at,
    }))
  });
}));

router.get('/status', asyncHandler(async (req, res) => {
  const incidents = await new Promise((resolve, reject) => {
    db.all(
      `SELECT id, title, status, severity, description, started_at, resolved_at
       FROM developer_incidents
       ORDER BY started_at DESC
       LIMIT 20`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });

  res.json({
    status: incidents.some((incident) => incident.status !== 'resolved') ? 'degraded' : 'operational',
    incidents: incidents.map((incident) => ({
      id: String(incident.id),
      title: incident.title,
      status: incident.status,
      severity: incident.severity,
      description: incident.description,
      startedAt: incident.started_at,
      resolvedAt: incident.resolved_at,
    }))
  });
}));

router.post('/apps', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { name, description, website } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new ValidationError('Application name is required');
  }

  const clientId = generateClientId();
  const clientSecret = generateClientSecret();
  const apiKey = generateApiKey();

  const appId = await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO developer_apps (user_id, name, description, website, client_id, client_secret_hash)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        name.trim(),
        description ? String(description).trim() : null,
        website ? String(website).trim() : null,
        clientId,
        hashSecret(clientSecret),
      ],
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });

  await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO developer_api_keys (app_id, api_key_hash, api_key_preview)
       VALUES ($1, $2, $3)`,
      [appId, hashSecret(apiKey), buildApiKeyPreview(apiKey)],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });

  res.status(201).json({
    app: {
      id: String(appId),
      name: name.trim(),
      description: description ? String(description).trim() : null,
      website: website ? String(website).trim() : null,
      clientId,
    },
    clientSecret,
    apiKey,
  });
}));

module.exports = router;
