const { z } = require('zod');

const createTaskSchema = z.object({
  sourceMessageId: z.coerce.number().int().positive().optional(),
  title: z.string().min(2).max(180),
  description: z.string().max(4000).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigneeId: z.coerce.number().int().positive().optional(),
  dueDate: z.string().datetime().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

const createTaskCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  createTaskCommentSchema,
};

