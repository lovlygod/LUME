const crypto = require('crypto');
const db = require('../db');

const q = (text, params = []) => db.query(text, params);

const getMyWorkspaces = async (userId) => {
  const { rows } = await q(
    `SELECT w.*
     FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = $1
     ORDER BY w.updated_at DESC NULLS LAST, w.created_at DESC`,
    [userId]
  );
  return rows;
};

const getPublicWorkspaces = async () => {
  const { rows } = await q(
    `SELECT * FROM workspaces WHERE type = 'public' ORDER BY created_at DESC LIMIT 100`
  );
  return rows;
};

const getWorkspaceBySlug = async (slug) => {
  const { rows } = await q(`SELECT * FROM workspaces WHERE slug = $1 LIMIT 1`, [slug]);
  return rows[0] || null;
};

const createWorkspace = async (ownerId, payload) => {
  const { name, slug, description, type = 'private', focusTags = [] } = payload;
  const { rows } = await q(
    `INSERT INTO workspaces (name, slug, description, type, owner_id, focus_tags)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [name, slug, description || null, type, ownerId, focusTags]
  );
  const workspace = rows[0];
  await q(
    `INSERT INTO workspace_members (workspace_id, user_id, role)
     VALUES ($1, $2, 'owner')
     ON CONFLICT (workspace_id, user_id) DO NOTHING`,
    [workspace.id, ownerId]
  );
  return workspace;
};

const ensureWorkspacePermission = async (workspaceId, userId, allowedRoles = ['owner']) => {
  const { rows } = await q(
    `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 LIMIT 1`,
    [workspaceId, userId]
  );
  return !!rows[0] && allowedRoles.includes(String(rows[0].role || '').toLowerCase());
};

const generateInvite = async (workspaceId, userId, expiresInHours = 72, maxUses = null) => {
  const code = crypto.randomBytes(16).toString('hex');
  const { rows } = await q(
    `INSERT INTO workspace_invites (workspace_id, created_by, code, expires_at, max_uses)
     VALUES ($1, $2, $3, NOW() + ($4 || ' hours')::interval, $5)
     RETURNING *`,
    [workspaceId, userId, code, String(expiresInHours), maxUses]
  );
  return rows[0];
};

module.exports = {
  getMyWorkspaces,
  getPublicWorkspaces,
  getWorkspaceBySlug,
  createWorkspace,
  ensureWorkspacePermission,
  generateInvite,
};

