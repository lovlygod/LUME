const { z } = require('zod');

const workspaceRoleSchema = z.enum(['owner', 'admin', 'lead', 'developer', 'designer', 'member', 'guest']);

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  type: z.enum(['public', 'private']).default('private'),
  focusTags: z.array(z.string().min(1)).max(20).optional(),
});

const updateWorkspaceSchema = createWorkspaceSchema.partial();

const addWorkspaceMemberSchema = z.object({
  userId: z.coerce.number().int().positive(),
  role: workspaceRoleSchema.default('member'),
  title: z.string().max(80).optional(),
});

const updateWorkspaceMemberSchema = z.object({
  role: workspaceRoleSchema.optional(),
  title: z.string().max(80).optional(),
});

const createWorkspaceInviteSchema = z.object({
  expiresInHours: z.coerce.number().int().positive().max(24 * 30).default(72),
  maxUses: z.coerce.number().int().positive().max(1000).optional(),
});

module.exports = {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addWorkspaceMemberSchema,
  updateWorkspaceMemberSchema,
  createWorkspaceInviteSchema,
  workspaceRoleSchema,
};

