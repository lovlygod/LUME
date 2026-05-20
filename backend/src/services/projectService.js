const crypto = require('crypto');
const db = require('../db');

const q = (text, params = []) => db.query(text, params);

const getMyProjects = async (userId) => {
  const { rows } = await q(
    `SELECT DISTINCT p.*
     FROM projects p
     LEFT JOIN project_members pm ON pm.project_id = p.id
     WHERE p.owner_id = $1 OR pm.user_id = $1
     ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC`,
    [userId]
  );
  return rows;
};

const getPublicProjects = async () => {
  const { rows } = await q(
    `SELECT * FROM projects WHERE visibility = 'public' ORDER BY created_at DESC LIMIT 100`
  );
  return rows;
};

const getProjectBySlug = async (slug) => {
  const { rows } = await q(`SELECT * FROM projects WHERE slug = $1 LIMIT 1`, [slug]);
  return rows[0] || null;
};

const createProject = async (ownerId, payload) => {
  const {
    workspaceId,
    name,
    slug,
    description,
    status = 'idea',
    visibility = 'public',
    stack = [],
    tags = [],
    githubUrl,
    demoUrl,
    logoUrl,
    bannerUrl,
    lookingForMembers = false,
    isOpenSource = false,
  } = payload;

  const { rows } = await q(
    `INSERT INTO projects (
      workspace_id, owner_id, name, slug, description, status, visibility,
      stack, tags, github_url, demo_url, logo_url, banner_url, looking_for_members, is_open_source
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *`,
    [
      workspaceId || null,
      ownerId,
      name,
      slug,
      description || null,
      status,
      visibility,
      stack,
      tags,
      githubUrl || null,
      demoUrl || null,
      logoUrl || null,
      bannerUrl || null,
      lookingForMembers,
      isOpenSource,
    ]
  );

  const project = rows[0];
  await q(
    `INSERT INTO project_members (project_id, user_id, role)
     VALUES ($1, $2, 'Founder')
     ON CONFLICT (project_id, user_id) DO NOTHING`,
    [project.id, ownerId]
  );
  return project;
};

const ensureProjectPermission = async (projectId, userId, allowedMemberRoles = []) => {
  const { rows } = await q(
    `SELECT p.owner_id, pm.role
     FROM projects p
     LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
     WHERE p.id = $1
     LIMIT 1`,
    [projectId, userId]
  );
  const row = rows[0];
  if (!row) return false;
  if (Number(row.owner_id) === Number(userId)) return true;
  const memberRole = String(row.role || '').toLowerCase();
  return allowedMemberRoles.map((r) => r.toLowerCase()).includes(memberRole);
};

const createProjectInvite = async (projectId, userId, expiresInHours = 72, maxUses = null) => {
  const code = crypto.randomBytes(16).toString('hex');
  const { rows } = await q(
    `INSERT INTO project_invites (project_id, created_by, code, expires_at, max_uses)
     VALUES ($1, $2, $3, NOW() + ($4 || ' hours')::interval, $5)
     RETURNING *`,
    [projectId, userId, code, String(expiresInHours), maxUses]
  );
  return rows[0];
};

module.exports = {
  getMyProjects,
  getPublicProjects,
  getProjectBySlug,
  createProject,
  ensureProjectPermission,
  createProjectInvite,
};

