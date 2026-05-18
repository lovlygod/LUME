const db = require('../db');

const q = (text, params = []) => db.query(text, params);

const createTask = async (projectId, userId, payload) => {
  const {
    sourceMessageId,
    title,
    description,
    status = 'todo',
    priority = 'medium',
    assigneeId,
    dueDate,
  } = payload;

  const { rows } = await q(
    `INSERT INTO project_tasks (
      project_id, source_message_id, title, description, status, priority, assignee_id, created_by, due_date
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      projectId,
      sourceMessageId || null,
      title,
      description || null,
      status,
      priority,
      assigneeId || null,
      userId,
      dueDate || null,
    ]
  );

  return rows[0];
};

const getProjectTasks = async (projectId) => {
  const { rows } = await q(
    `SELECT * FROM project_tasks WHERE project_id = $1 ORDER BY created_at DESC`,
    [projectId]
  );
  return rows;
};

const updateTask = async (taskId, payload) => {
  const keys = Object.keys(payload || {});
  if (!keys.length) {
    const { rows } = await q(`SELECT * FROM project_tasks WHERE id = $1 LIMIT 1`, [taskId]);
    return rows[0] || null;
  }

  const map = {
    sourceMessageId: 'source_message_id',
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    assigneeId: 'assignee_id',
    dueDate: 'due_date',
  };

  const setParts = [];
  const values = [];
  let idx = 1;
  for (const key of keys) {
    if (!map[key]) continue;
    setParts.push(`${map[key]} = $${idx}`);
    values.push(payload[key]);
    idx += 1;
  }
  setParts.push(`updated_at = NOW()`);
  values.push(taskId);

  const { rows } = await q(
    `UPDATE project_tasks SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
};

const deleteTask = async (taskId) => {
  await q(`DELETE FROM project_tasks WHERE id = $1`, [taskId]);
  return true;
};

const addTaskComment = async (taskId, userId, content) => {
  const { rows } = await q(
    `INSERT INTO task_comments (task_id, user_id, content) VALUES ($1,$2,$3) RETURNING *`,
    [taskId, userId, content]
  );
  return rows[0];
};

module.exports = {
  createTask,
  getProjectTasks,
  updateTask,
  deleteTask,
  addTaskComment,
};

