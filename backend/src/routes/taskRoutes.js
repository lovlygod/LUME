const express = require('express');
const { createValidator } = require('../validation');
const { createTaskSchema, updateTaskSchema, createTaskCommentSchema } = require('../validators/taskSchemas');
const taskService = require('../services/taskService');
const projectService = require('../services/projectService');
const { AuthError } = require('../errors');

module.exports = ({ authenticateToken, asyncHandler, db }) => {
  const router = express.Router();

  router.post('/projects/:projectId/tasks', authenticateToken, createValidator(createTaskSchema), asyncHandler(async (req, res) => {
    const canEdit = await projectService.ensureProjectPermission(req.params.projectId, req.user.userId, ['admin', 'lead', 'manager']);
    if (!canEdit) throw new AuthError('Insufficient permissions', 'FORBIDDEN');
    const task = await taskService.createTask(req.params.projectId, req.user.userId, req.body);
    res.status(201).json({ task });
  }));

  router.get('/projects/:projectId/tasks', authenticateToken, asyncHandler(async (req, res) => {
    const { rows: [project] } = await db.query('SELECT visibility FROM projects WHERE id = $1', [req.params.projectId]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.visibility === 'public') {
      const tasks = await taskService.getProjectTasks(req.params.projectId);
      return res.json({ tasks });
    }

    const canView = await projectService.ensureProjectPermission(req.params.projectId, req.user.userId, ['admin', 'lead', 'manager', 'developer', 'designer', 'tester', 'frontend', 'backend', 'bot developer', 'member']);
    if (!canView) throw new AuthError('Insufficient permissions', 'FORBIDDEN');
    const tasks = await taskService.getProjectTasks(req.params.projectId);
    res.json({ tasks });
  }));

  router.patch('/tasks/:taskId', authenticateToken, createValidator(updateTaskSchema), asyncHandler(async (req, res) => {
    const task = await taskService.updateTask(req.params.taskId, req.body);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const canEdit = await projectService.ensureProjectPermission(task.project_id, req.user.userId, ['admin', 'lead', 'manager']);
    if (!canEdit && Number(task.created_by) !== Number(req.user.userId) && Number(task.assignee_id) !== Number(req.user.userId)) {
      throw new AuthError('Insufficient permissions', 'FORBIDDEN');
    }
    res.json({ task });
  }));

  router.delete('/tasks/:taskId', authenticateToken, asyncHandler(async (req, res) => {
    const updated = await taskService.updateTask(req.params.taskId, {});
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    const canEdit = await projectService.ensureProjectPermission(updated.project_id, req.user.userId, ['admin', 'lead', 'manager']);
    if (!canEdit) throw new AuthError('Insufficient permissions', 'FORBIDDEN');
    await taskService.deleteTask(req.params.taskId);
    res.json({ message: 'Task deleted' });
  }));

  router.post('/tasks/:taskId/comments', authenticateToken, createValidator(createTaskCommentSchema), asyncHandler(async (req, res) => {
    const current = await taskService.updateTask(req.params.taskId, {});
    if (!current) return res.status(404).json({ error: 'Task not found' });
    const canView = await projectService.ensureProjectPermission(current.project_id, req.user.userId, ['admin', 'lead', 'manager', 'developer', 'designer', 'tester', 'frontend', 'backend', 'bot developer', 'member']);
    if (!canView) throw new AuthError('Insufficient permissions', 'FORBIDDEN');
    const comment = await taskService.addTaskComment(req.params.taskId, req.user.userId, req.body.content);
    res.status(201).json({ comment });
  }));

  return router;
};

