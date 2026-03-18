/**
 * Централизованная система проверки прав доступа (Authorization)
 * Для серверов (communities)
 */

const { ForbiddenError, NotFoundError } = require('./errors');

// ==================== Константы ролей ====================

const ROLE_RANKS = {
  Owner: 100,
  Admin: 80,
  Moderator: 50,
  Member: 10,
};

const ROLE_PERMISSIONS = {
  // Owner: полный доступ
  Owner: [
    'server:delete',
    'server:update',
    'server:transfer_ownership',
    'server:manage_roles',
    'server:manage_channels',
    'server:manage_members',
    'server:ban_members',
    'server:kick_members',
    'server:timeout_members',
    'server:manage_join_requests',
    'server:manage_webhooks',
    'server:manage_settings',
    'channel:delete',
    'channel:update',
    'channel:manage_permissions',
    'message:delete:any',
    'message:pin',
    'message:announce',
  ],
  
  // Admin: управление сервером
  Admin: [
    'server:manage_channels',
    'server:manage_members',
    'server:ban_members',
    'server:kick_members',
    'server:timeout_members',
    'server:manage_join_requests',
    'server:manage_settings',
    'channel:delete',
    'channel:update',
    'message:delete:any',
    'message:pin',
  ],
  
  // Moderator: модерация
  Moderator: [
    'server:kick_members',
    'server:timeout_members',
    'message:delete:any',
    'message:pin',
  ],
  
  // Member: базовый доступ
  Member: [
    'channel:read',
    'message:send',
    'message:delete:own',
  ],
};

// ==================== Helper Functions ====================

/**
 * Получить роль пользователя на сервере
 */
const getServerMemberRole = (serverId, userId) => {
  return new Promise((resolve, reject) => {
    const db = require('./db');
    const query = `
      SELECT sr.id, sr.name, sr.rank, sr.permissions_json, sr.is_system
      FROM server_members sm
      JOIN server_roles sr ON sm.role_id = sr.id
      WHERE sm.server_id = $1 AND sm.user_id = $2
    `;
    db.get(query, [serverId, userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

/**
 * Проверить, является ли пользователь владельцем сервера
 */
const isServerOwner = (serverId, userId) => {
  return new Promise((resolve, reject) => {
    const db = require('./db');
    db.get(
      'SELECT id FROM servers WHERE id = $1 AND owner_id = $2',
      [serverId, userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      }
    );
  });
};

/**
 * Проверить, является ли пользователь участником сервера
 */
const isServerMember = (serverId, userId) => {
  return new Promise((resolve, reject) => {
    const db = require('./db');
    db.get(
      'SELECT sm.id, sm.role_id FROM server_members sm WHERE sm.server_id = $1 AND sm.user_id = $2',
      [serverId, userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      }
    );
  });
};

// ==================== Permission Check Functions ====================

/**
 * Проверить наличие права у роли
 */
const hasPermission = (roleName, permission) => {
  const permissions = ROLE_PERMISSIONS[roleName] || [];
  return permissions.includes(permission);
};

/**
 * Проверить, что ранг пользователя >= ранга цели
 */
const hasHigherRank = (userRank, targetRank) => {
  return userRank > targetRank;
};

/**
 * Middleware: Проверка права доступа к серверу
 * @param {string} permission - Требуемое право (например, 'server:manage_channels')
 */
const requireServerPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const serverId = parseInt(req.params.id) || parseInt(req.params.serverId);
      
      if (!serverId) {
        throw new ForbiddenError('Server ID is required');
      }
      
      // Проверяем, владелец ли пользователь
      const isOwner = await isServerOwner(serverId, userId);
      if (isOwner) {
        return next(); // Owner имеет все права
      }
      
      // Получаем роль пользователя
      const role = await getServerMemberRole(serverId, userId);
      
      if (!role) {
        throw new ForbiddenError('You are not a member of this server');
      }
      
      // Проверяем право
      const hasPerm = hasPermission(role.name, permission);
      
      if (!hasPerm) {
        throw new ForbiddenError(`Insufficient permissions. Required: ${permission}`);
      }
      
      // Сохраняем роль в request для дальнейшего использования
      req.serverRole = role;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware: Проверка минимального ранга
 * @param {number} minRank - Минимальный требуемый ранг
 */
const requireMinRank = (minRank) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const serverId = parseInt(req.params.id) || parseInt(req.params.serverId);
      
      if (!serverId) {
        throw new ForbiddenError('Server ID is required');
      }
      
      // Проверяем, владелец ли пользователь
      const isOwner = await isServerOwner(serverId, userId);
      if (isOwner) {
        return next();
      }
      
      // Получаем роль пользователя
      const role = await getServerMemberRole(serverId, userId);
      
      if (!role) {
        throw new ForbiddenError('You are not a member of this server');
      }
      
      // Проверяем ранг
      if (role.rank < minRank) {
        throw new ForbiddenError(`Insufficient rank. Required: ${minRank}, your rank: ${role.rank}`);
      }
      
      req.serverRole = role;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware: Проверка что пользователь может управлять другим участником
 * (нельзя управлять тем, у кого ранг >= твоего)
 */
const requireCanManageMember = (targetUserIdParam = 'memberId') => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const serverId = parseInt(req.params.id) || parseInt(req.params.serverId);
      const targetUserId = parseInt(req.params[targetUserIdParam]);
      
      if (!serverId || !targetUserId) {
        throw new ForbiddenError('Server ID and member ID are required');
      }
      
      // Владелец может управлять всеми
      const isOwner = await isServerOwner(serverId, userId);
      if (isOwner) {
        return next();
      }
      
      // Получаем роли обоих пользователей
      const [userRole, targetRole] = await Promise.all([
        getServerMemberRole(serverId, userId),
        getServerMemberRole(serverId, targetUserId),
      ]);
      
      if (!userRole) {
        throw new ForbiddenError('You are not a member of this server');
      }
      
      if (!targetRole) {
        throw new NotFoundError('Member not found');
      }
      
      // Нельзя управлять тем, у кого ранг >= твоего
      if (targetRole.rank >= userRole.rank) {
        throw new ForbiddenError('Cannot manage member with equal or higher rank');
      }
      
      req.serverRole = userRole;
      req.targetMemberRole = targetRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware: Проверка что пользователь является владельцем сервера
 */
const requireServerOwner = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const serverId = parseInt(req.params.id) || parseInt(req.params.serverId);
    
    if (!serverId) {
      throw new ForbiddenError('Server ID is required');
    }
    
    const isOwner = await isServerOwner(serverId, userId);
    
    if (!isOwner) {
      throw new ForbiddenError('Only server owner can perform this action');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Проверка что пользователь является участником сервера
 */
const requireServerMember = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const serverId = parseInt(req.params.id) || parseInt(req.params.serverId);
    
    if (!serverId) {
      throw new ForbiddenError('Server ID is required');
    }
    
    // Проверяем, владелец ли пользователь (владелец всегда имеет доступ)
    const isOwner = await isServerOwner(serverId, userId);
    if (isOwner) {
      return next();
    }
    
    // Проверяем членство
    const isMember = await isServerMember(serverId, userId);
    
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this server');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// ==================== Convenience Middleware ====================

// Готовые middleware для распространённых прав
const middleware = {
  // Управление сервером
  manageChannels: requireServerPermission('server:manage_channels'),
  manageMembers: requireServerPermission('server:manage_members'),
  manageRoles: requireServerPermission('server:manage_roles'),
  manageSettings: requireServerPermission('server:manage_settings'),
  manageJoinRequests: requireServerPermission('server:manage_join_requests'),
  
  // Модерация
  banMembers: requireServerPermission('server:ban_members'),
  kickMembers: requireServerPermission('server:kick_members'),
  timeoutMembers: requireServerPermission('server:timeout_members'),
  
  // Каналы
  deleteChannel: requireServerPermission('channel:delete'),
  updateChannel: requireServerPermission('channel:update'),
  
  // Сообщения
  deleteAnyMessage: requireServerPermission('message:delete:any'),
  pinMessage: requireServerPermission('message:pin'),
  
  // Ранги
  adminPlus: requireMinRank(ROLE_RANKS.Admin),      // Admin+
  moderatorPlus: requireMinRank(ROLE_RANKS.Moderator), // Moderator+
  
  // Специальные
  ownerOnly: requireServerOwner,
  memberOnly: requireServerMember,
  canManageMember: requireCanManageMember,
};

// ==================== Exports ====================

module.exports = {
  // Constants
  ROLE_RANKS,
  ROLE_PERMISSIONS,
  
  // Helper functions
  getServerMemberRole,
  isServerOwner,
  isServerMember,
  hasPermission,
  hasHigherRank,
  
  // Middleware generators
  requireServerPermission,
  requireMinRank,
  requireCanManageMember,
  
  // Specific middleware
  requireServerOwner,
  requireServerMember,
  
  // Convenience middleware
  ...middleware,
};
