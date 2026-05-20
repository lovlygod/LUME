const { z } = require('zod');

const usernameRegex = /^[a-zA-Z0-9_.]+$/;

const accountStepSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(50).regex(usernameRegex),
});

const profileStepSchema = z.object({
  primaryRole: z.string().min(2).max(64),
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  telegramUsername: z.string().max(64).optional(),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  city: z.string().max(120).optional(),
  availability: z.enum(['open_to_projects', 'open_to_freelance', 'looking_for_team', 'not_available']).optional(),
});

const skillsStepSchema = z.object({
  skills: z.array(z.string().min(1)).max(100),
});

const goalsStepSchema = z.object({
  goals: z.array(z.string().min(1)).max(20),
});

const workspaceStepSchema = z.object({
  action: z.enum(['create', 'join', 'explore', 'skip']),
  inviteCode: z.string().optional(),
  workspace: z.object({
    name: z.string().min(2).max(120),
    slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
    description: z.string().max(1000).optional(),
    type: z.enum(['public', 'private']).default('private'),
    focus: z.array(z.string().min(1)).max(20).optional(),
  }).optional(),
});

module.exports = {
  accountStepSchema,
  profileStepSchema,
  skillsStepSchema,
  goalsStepSchema,
  workspaceStepSchema,
};

