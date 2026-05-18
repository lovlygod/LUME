const express = require('express');
const { createValidator } = require('../validation');
const {
  profileStepSchema,
  skillsStepSchema,
  goalsStepSchema,
  workspaceStepSchema,
} = require('../validators/onboardingSchemas');
const onboardingService = require('../services/onboardingService');
const workspaceService = require('../services/workspaceService');

module.exports = ({ authenticateToken, asyncHandler }) => {
  const router = express.Router();

  router.get('/onboarding/status', authenticateToken, asyncHandler(async (req, res) => {
    const status = await onboardingService.getStatus(req.user.userId);
    res.json({ onboarding: status });
  }));

  router.post('/onboarding/profile', authenticateToken, createValidator(profileStepSchema), asyncHandler(async (req, res) => {
    const user = await onboardingService.saveProfile(req.user.userId, req.body);
    res.json({ user });
  }));

  router.post('/onboarding/skills', authenticateToken, createValidator(skillsStepSchema), asyncHandler(async (req, res) => {
    const user = await onboardingService.saveSkills(req.user.userId, req.body.skills || []);
    res.json({ user });
  }));

  router.post('/onboarding/goals', authenticateToken, createValidator(goalsStepSchema), asyncHandler(async (req, res) => {
    const user = await onboardingService.saveGoals(req.user.userId, req.body.goals || []);
    res.json({ user });
  }));

  router.post('/onboarding/workspace', authenticateToken, createValidator(workspaceStepSchema), asyncHandler(async (req, res) => {
    const { action, inviteCode, workspace } = req.body;
    if (action === 'create' && workspace) {
      const created = await workspaceService.createWorkspace(req.user.userId, {
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        type: workspace.type,
        focusTags: workspace.focus || [],
      });
      return res.status(201).json({ workspace: created });
    }

    if (action === 'join' && inviteCode) {
      return res.json({ action: 'join', inviteCode });
    }

    return res.json({ action });
  }));

  router.post('/onboarding/complete', authenticateToken, asyncHandler(async (req, res) => {
    const result = await onboardingService.complete(req.user.userId);
    res.json({ onboarding: result });
  }));

  return router;
};

