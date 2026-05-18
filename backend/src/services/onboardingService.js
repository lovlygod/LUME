const db = require('../db');

const q = (text, params = []) => db.query(text, params);

const getStatus = async (userId) => {
  const { rows } = await q(
    `SELECT onboarding_completed, primary_role, goals, skills, availability, github_url, telegram_username, portfolio_url
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

const saveProfile = async (userId, payload) => {
  const {
    primaryRole,
    displayName,
    bio,
    githubUrl,
    telegramUsername,
    portfolioUrl,
    city,
    availability,
  } = payload;

  const { rows } = await q(
    `UPDATE users SET
      primary_role = COALESCE($1, primary_role),
      name = COALESCE($2, name),
      bio = COALESCE($3, bio),
      github_url = COALESCE($4, github_url),
      telegram_username = COALESCE($5, telegram_username),
      portfolio_url = COALESCE($6, portfolio_url),
      city = COALESCE($7, city),
      availability = COALESCE($8, availability)
     WHERE id = $9
     RETURNING id, onboarding_completed, primary_role, name, bio, github_url, telegram_username, portfolio_url, city, availability`,
    [
      primaryRole || null,
      displayName || null,
      bio || null,
      githubUrl || null,
      telegramUsername || null,
      portfolioUrl || null,
      city || null,
      availability || null,
      userId,
    ]
  );

  return rows[0] || null;
};

const saveSkills = async (userId, skills) => {
  const { rows } = await q(
    `UPDATE users SET skills = $1 WHERE id = $2 RETURNING id, skills`,
    [skills, userId]
  );
  return rows[0] || null;
};

const saveGoals = async (userId, goals) => {
  const { rows } = await q(
    `UPDATE users SET goals = $1 WHERE id = $2 RETURNING id, goals`,
    [goals, userId]
  );
  return rows[0] || null;
};

const complete = async (userId) => {
  const { rows } = await q(
    `UPDATE users SET onboarding_completed = TRUE WHERE id = $1 RETURNING id, onboarding_completed`,
    [userId]
  );
  return rows[0] || null;
};

module.exports = {
  getStatus,
  saveProfile,
  saveSkills,
  saveGoals,
  complete,
};

