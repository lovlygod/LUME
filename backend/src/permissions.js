/**
 * Simple role/permission model used by tests.
 */

const ROLE_RANKS = {
  Owner: 100,
  Admin: 80,
  Moderator: 50,
  Member: 10,
};

const ROLE_PERMISSIONS = {
  Owner: [
    'server:delete',
    'server:manage_channels',
    'server:manage_members',
    'server:kick_members',
    'message:delete:any',
    'channel:read',
    'message:send',
  ],
  Admin: [
    'server:manage_channels',
    'server:manage_members',
    'server:kick_members',
    'message:delete:any',
    'channel:read',
    'message:send',
  ],
  Moderator: [
    'server:kick_members',
    'channel:read',
    'message:send',
  ],
  Member: [
    'channel:read',
    'message:send',
  ],
};

const hasPermission = (role, permission) => {
  const perms = ROLE_PERMISSIONS[role];
  if (!Array.isArray(perms)) return false;
  return perms.includes(permission);
};

const hasHigherRank = (actorRank, targetRank) => Number(actorRank) > Number(targetRank);

module.exports = {
  hasPermission,
  hasHigherRank,
  ROLE_RANKS,
  ROLE_PERMISSIONS,
};

