const db = require('../db');

const q = (text, params = []) => db.query(text, params);

const searchBuilders = async (filters = {}) => {
  const clauses = ['1=1'];
  const params = [];
  let i = 1;

  if (filters.role) {
    clauses.push(`primary_role = $${i++}`);
    params.push(filters.role);
  }
  if (filters.availability) {
    clauses.push(`availability = $${i++}`);
    params.push(filters.availability);
  }
  if (filters.skills?.length) {
    clauses.push(`skills && $${i++}::text[]`);
    params.push(filters.skills);
  }

  const { rows } = await q(
    `SELECT id, username, name, bio, avatar, primary_role, skills, availability, github_url, city
     FROM users
     WHERE ${clauses.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT 100`,
    params
  );
  return rows;
};

const searchProjects = async () => {
  const { rows } = await q(
    `SELECT * FROM projects WHERE visibility = 'public' ORDER BY created_at DESC LIMIT 100`
  );
  return rows;
};

const searchWorkspaces = async () => {
  const { rows } = await q(
    `SELECT * FROM workspaces WHERE type = 'public' ORDER BY created_at DESC LIMIT 100`
  );
  return rows;
};

const lookingForTeam = async () => {
  const { rows } = await q(
    `SELECT * FROM projects
     WHERE visibility = 'public' AND looking_for_members = TRUE
     ORDER BY updated_at DESC NULLS LAST, created_at DESC
     LIMIT 100`
  );
  return rows;
};

module.exports = {
  searchBuilders,
  searchProjects,
  searchWorkspaces,
  lookingForTeam,
};

