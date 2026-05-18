const express = require('express');
const { createValidator } = require('../validation');
const {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  createProjectInviteSchema,
} = require('../validators/projectSchemas');
const projectService = require('../services/projectService');
const { AuthError } = require('../errors');

module.exports = ({ authenticateToken, asyncHandler, db }) => {
  const router = express.Router();

  router.post('/projects', authenticateToken, createValidator(createProjectSchema), asyncHandler(async (req, res) => {
    const project = await projectService.createProject(req.user.userId, req.body);
    res.status(201).json({ project });
  }));

  router.get('/projects/my', authenticateToken, asyncHandler(async (req, res) => {
    const projects = await projectService.getMyProjects(req.user.userId);
    res.json({ projects });
  }));

  router.get('/projects/public', authenticateToken, asyncHandler(async (_req, res) => {
    const projects = await projectService.getPublicProjects();
    res.json({ projects });
  }));

  router.get('/projects/:slug', authenticateToken, asyncHandler(async (req, res) => {
    const project = await projectService.getProjectBySlug(req.params.slug);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  }));

  router.patch('/projects/:id', authenticateToken, createValidator(updateProjectSchema), asyncHandler(async (req, res) => {
    const allowed = await projectService.ensureProjectPermission(req.params.id, req.user.userId, ['admin', 'lead', 'manager']);
    if (!allowed) throw new AuthError('Insufficient permissions', 'FORBIDDEN');

    const map = {
      workspaceId: 'workspace_id', name: 'name', slug: 'slug', description: 'description', status: 'status', visibility: 'visibility',
      stack: 'stack', tags: 'tags', githubUrl: 'github_url', demoUrl: 'demo_url', logoUrl: 'logo_url', bannerUrl: 'banner_url',
      lookingForMembers: 'looking_for_members', isOpenSource: 'is_open_source',
    };
    const keys = Object.keys(req.body || {}).filter((k) => map[k]);
    if (!keys.length) return res.json({ project: null });

    const set = [];
    const values = [];
    let i = 1;
    for (const key of keys) {
      set.push(`${map[key]} = $${i++}`);
      values.push(req.body[key]);
    }
    set.push('updated_at = NOW()');
    values.push(req.params.id);

    const { rows } = await db.query(`UPDATE projects SET ${set.join(', ')} WHERE id = $${i} RETURNING *`, values);
    res.json({ project: rows[0] || null });
  }));

  router.delete('/projects/:id', authenticateToken, asyncHandler(async (req, res) => {
    const allowed = await projectService.ensureProjectPermission(req.params.id, req.user.userId);
    if (!allowed) throw new AuthError('Only project owner can delete project', 'FORBIDDEN');
    await db.query('DELETE FROM projects WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.userId]);
    res.json({ message: 'Project deleted' });
  }));

  router.post('/projects/:id/members', authenticateToken, createValidator(addProjectMemberSchema), asyncHandler(async (req, res) => {
    const allowed = await projectService.ensureProjectPermission(req.params.id, req.user.userId, ['admin', 'lead', 'manager']);
    if (!allowed) throw new AuthError('Insufficient permissions', 'FORBIDDEN');
    await db.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1,$2,$3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [req.params.id, req.body.userId, req.body.role]
    );
    res.status(201).json({ message: 'Project member upserted' });
  }));

  router.get('/projects/:id/members', authenticateToken, asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT pm.*, u.username, u.name, u.avatar
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at ASC`,
      [req.params.id]
    );
    const members = rows.map((m) => ({
      id: m.id,
      project_id: m.project_id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      user: {
        id: m.user_id,
        username: m.username,
        name: m.name,
        avatar: m.avatar,
      },
    }));
    res.json({ members });
  }));

  router.delete('/projects/:id/members/:userId', authenticateToken, asyncHandler(async (req, res) => {
    const allowed = await projectService.ensureProjectPermission(req.params.id, req.user.userId, ['admin', 'lead', 'manager']);
    if (!allowed) throw new AuthError('Insufficient permissions', 'FORBIDDEN');
    await db.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.id, req.params.userId]);
    res.json({ message: 'Project member removed' });
  }));

  router.post('/projects/:id/invite', authenticateToken, createValidator(createProjectInviteSchema), asyncHandler(async (req, res) => {
    const allowed = await projectService.ensureProjectPermission(req.params.id, req.user.userId, ['admin', 'lead', 'manager']);
    if (!allowed) throw new AuthError('Insufficient permissions', 'FORBIDDEN');
    const invite = await projectService.createProjectInvite(req.params.id, req.user.userId, req.body.expiresInHours, req.body.maxUses || null);
    res.status(201).json({ invite });
  }));

  return router;
};

