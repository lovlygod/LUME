const { z } = require('zod');

const createProjectSchema = z.object({
  workspaceId: z.coerce.number().int().positive().optional(),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  status: z.enum(['idea', 'building', 'testing', 'launched', 'paused', 'archived']).default('idea'),
  visibility: z.enum(['public', 'private']).default('public'),
  stack: z.array(z.string().min(1)).max(40).optional(),
  tags: z.array(z.string().min(1)).max(40).optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  demoUrl: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  lookingForMembers: z.boolean().optional(),
  isOpenSource: z.boolean().optional(),
});

const updateProjectSchema = createProjectSchema.partial();

const addProjectMemberSchema = z.object({
  userId: z.coerce.number().int().positive(),
  role: z.string().min(2).max(64),
});

const createProjectInviteSchema = z.object({
  expiresInHours: z.coerce.number().int().positive().max(24 * 30).default(72),
  maxUses: z.coerce.number().int().positive().max(1000).optional(),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  createProjectInviteSchema,
};

