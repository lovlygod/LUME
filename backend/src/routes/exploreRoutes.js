const express = require('express');
const exploreService = require('../services/exploreService');

module.exports = ({ authenticateToken, asyncHandler }) => {
  const router = express.Router();

  router.get('/explore/builders', authenticateToken, asyncHandler(async (req, res) => {
    const filters = {
      role: req.query.role,
      availability: req.query.availability,
      skills: req.query.skills ? String(req.query.skills).split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
    const builders = await exploreService.searchBuilders(filters);
    res.json({ builders });
  }));

  router.get('/explore/projects', authenticateToken, asyncHandler(async (_req, res) => {
    const projects = await exploreService.searchProjects();
    res.json({ projects });
  }));

  router.get('/explore/workspaces', authenticateToken, asyncHandler(async (_req, res) => {
    const workspaces = await exploreService.searchWorkspaces();
    res.json({ workspaces });
  }));

  router.get('/explore/looking-for-team', authenticateToken, asyncHandler(async (_req, res) => {
    const projects = await exploreService.lookingForTeam();
    res.json({ projects });
  }));

  return router;
};

