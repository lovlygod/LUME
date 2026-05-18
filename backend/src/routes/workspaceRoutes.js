const express = require('express');
const { createValidator } = require('../validation');
const {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addWorkspaceMemberSchema,
  updateWorkspaceMemberSchema,
  createWorkspaceInviteSchema,
} = require('../validators/workspaceSchemas');
const workspaceService = require('../services/workspaceService');
const { AuthError } = require('../errors');

module.exports = ({ authenticateToken, asyncHandler, db }) => {
  const router = express.Router();

  router.post('/workspaces', authenticateToken, createValidator(createWorkspaceSchema), asyncHandler(async (req, res) => {
    const workspace = await workspaceService.createWorkspace(req.user.userId, req.body);
    res.status(201).json({ workspace });
  }));

  router.get('/workspaces/my', authenticateToken, asyncHandler(async (req, res) => {
    const workspaces = await workspaceService.getMyWorkspaces(req.user.userId);
    res.json({ workspaces });
  }));

  router.get('/workspaces/public', authenticateToken, asyncHandler(async (_req, res) => {
    const workspaces = await workspaceService.getPublicWorkspaces();
    res.json({ workspaces });
  }));

  router.get('/workspaces/:slug', authenticateToken, asyncHandler(async (req, res) => {
    const workspace = await workspaceService.getWorkspaceBySlug(req.params.slug);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    res.json({ workspace });
  }));

  router.patch('/workspaces/:id', authenticateToken, createValidator(updateWorkspaceSchema), asyncHandler(async (req, res) => {
    const allowed = await workspaceService.ensureWorkspacePermission(req.params.id, req.user.userId, ['owner', 'admin']);
    if (!allowed) throw new AuthError('Insufficient permissions', 'FORBIDDEN');

    const keys = Object.keys(req.body || {});
    if (!keys.length) {
      return res.json({ workspace: null });
    }

    const map = { name: 'name', slug: 'slug', description: 'description', type: 'type', focusTags: 'focus_tags' };
    const values = [];
    const set = [];
    let i = 1;
    for (const key of keys) {
      if (!map[key]) continue;
      set.push(`${map[key]} = $${i++}`);
      values.push(req.body[key]);
    }
    set.push('updated_at = NOW()');
    values.push(req.params.id);

    const { rows } = await db.query(`UPDATE workspaces SET ${set.join(', ')} WHERE id = $${i} RETURNING *`, values);
    res.json({ workspace: rows[0] || null });
  }));

  router.delete('/workspaces/:id', authenticateToken, asyncHandler(async (req, res) => {
    const allowed = await workspaceService.ensureWorkspacePermission(req.params.id, req.user.userId, ['owner']);
    if (!allowed) throw new AuthError('Only owner can delete workspace', 'FORBIDDEN');
    await db.query('DELETE FROM workspaces WHERE id = $1', [req.params.id]);
    res.json({ message: 'Workspace deleted' });
  }));

  router.post('/workspaces/:id/members', authenticateToken, createValidator(addWorkspaceMemberSchema), asyncHandler(async (req, res) => {
    const allowed = await workspaceService.ensureWorkspacePermission(req.params.id, req.user.userId, ['owner', 'admin']);
    if (!allowed) throw new AuthError('Insufficient permissions', 'FORBIDDEN');

    const { userId, role, title } = req.body;
    await db.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role, title)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role, title = EXCLUDED.title`,
      [req.params.id, userId, role, title || null]
    );
    res.status(201).json({ message: 'Member added' });
  }));

  router.patch('/workspaces/:id/members/:userId', authenticateToken, createValidator(updateWorkspaceMemberSchema), asyncHandler(async (req, res) => {
    const allowed = await workspaceService.ensureWorkspacePermission(req.params.id, req.user.userId, ['owner', 'admin']);
    if (!allowed) throw new AuthError('Insufficient permissions', 'FORBIDDEN');

    await db.query(
      `UPDATE workspace_members SET
        role = COALESCE($1, role),
        title = COALESCE($2, title)
      WHERE workspace_id = $3 AND user_id = $4`,
      [req.body.role || null, req.body.title || null, req.params.id, req.params.userId]
    );
    res.json({ message: 'Member updated' });
  }));

  router.delete('/workspaces/:id/members/:userId', authenticateToken, asyncHandler(async (req, res) => {
    const allowed = await workspaceService.ensureWorkspacePermission(req.params.id, req.user.userId, ['owner', 'admin']);
    if (!allowed) throw new AuthError('Insufficient permissions', 'FORBIDDEN');

    const ownerRow = await db.query('SELECT owner_id FROM workspaces WHERE id = $1', [req.params.id]);
    if (Number(ownerRow.rows?.[0]?.owner_id) === Number(req.params.userId)) {
      throw new AuthError('Owner cannot be removed without ownership transfer', 'OWNER_PROTECTED');
    }

    await db.query('DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2', [req.params.id, req.params.userId]);
    res.json({ message: 'Member removed' });
  }));

  router.post('/workspaces/:id/invites', authenticateToken, createValidator(createWorkspaceInviteSchema), asyncHandler(async (req, res) => {
    const allowed = await workspaceService.ensureWorkspacePermission(req.params.id, req.user.userId, ['owner', 'admin']);
    if (!allowed) throw new AuthError('Insufficient permissions', 'FORBIDDEN');

    const invite = await workspaceService.generateInvite(req.params.id, req.user.userId, req.body.expiresInHours, req.body.maxUses || null);
    res.status(201).json({ invite });
  }));

  router.get('/workspaces/:id/members', authenticateToken, asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT wm.*, u.username, u.name, u.avatar
       FROM workspace_members wm
       JOIN users u ON wm.user_id = u.id
       WHERE wm.workspace_id = $1
       ORDER BY wm.joined_at ASC`,
      [req.params.id]
    );
    const members = rows.map((m) => ({
      id: m.id,
      workspace_id: m.workspace_id,
      user_id: m.user_id,
      role: m.role,
      title: m.title,
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

  router.post('/workspaces/join/:inviteCode', authenticateToken, asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT * FROM workspace_invites
       WHERE code = $1 AND revoked_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [req.params.inviteCode]
    );
    const invite = rows[0];
    if (!invite) return res.status(404).json({ error: 'Invite not found or expired' });
    if (invite.max_uses && invite.uses_count >= invite.max_uses) {
      return res.status(400).json({ error: 'Invite exhausted' });
    }

    await db.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1,$2,'member')
       ON CONFLICT (workspace_id, user_id) DO NOTHING`,
      [invite.workspace_id, req.user.userId]
    );
    await db.query('UPDATE workspace_invites SET uses_count = uses_count + 1 WHERE id = $1', [invite.id]);
    res.json({ message: 'Joined workspace', workspaceId: invite.workspace_id });
  }));

  return router;
};

