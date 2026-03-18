/**
 * Сериализаторы для ответов API
 * Фильтрация чувствительных полей и нормализация данных
 */

const { sanitizeText } = require('./xss');

// ==================== Сериализаторы пользователей ====================

/**
 * Сериализовать пользователя для публичного ответа
 * Удаляет чувствительные поля
 */
const serializeUser = (user) => {
  if (!user) return null;
  
  return {
    id: String(user.id),
    name: sanitizeText(user.name),
    username: user.username,
    bio: user.bio ? sanitizeText(user.bio) : null,
    avatar: user.avatar,
    banner: user.banner,
    verified: user.verified === 1,
    joinDate: user.join_date,
    followersCount: user.followers_count || 0,
  };
};

/**
 * Сериализовать текущего пользователя (с email)
 */
const serializeCurrentUser = (user) => {
  if (!user) return null;
  
  return {
    ...serializeUser(user),
    email: user.email,
    city: user.city,
    website: user.website,
    pinnedPostId: user.pinned_post_id ? String(user.pinned_post_id) : null,
  };
};

/**
 * Сериализовать пользователя для админки
 */
const serializeUserAdmin = (user) => {
  if (!user) return null;
  
  return {
    ...serializeCurrentUser(user),
    createdAt: user.created_at,
    lastSeenAt: user.last_seen_at,
  };
};

// ==================== Сериализаторы постов ====================

/**
 * Сериализовать пост
 */
const serializePost = (post) => {
  if (!post) return null;
  
  return {
    id: String(post.id),
    userId: String(post.user_id),
    text: post.text ? sanitizeText(post.text) : null,
    imageUrl: post.image_url,
    timestamp: post.timestamp,
    replies: post.replies || 0,
    reposts: post.reposts || 0,
    resonance: post.resonance || 0,
    author: post.name ? {
      name: sanitizeText(post.name),
      username: post.username,
      avatar: post.avatar,
      verified: post.verified === 1,
    } : null,
  };
};

// ==================== Сериализаторы сообщений ====================

/**
 * Сериализовать личное сообщение
 */
const serializeMessage = (message, currentUserId) => {
  if (!message) return null;
  
  return {
    id: String(message.id),
    senderId: String(message.sender_id),
    text: message.text ? sanitizeText(message.text) : null,
    timestamp: message.timestamp || message.created_at,
    own: String(message.sender_id) === String(currentUserId),
    attachments: message.attachments || [],
    deletedForMe: !!message.deleted_for_me,
    deletedForAll: !!message.deleted_for_all_at,
  };
};

/**
 * Сериализовать чат
 */
const serializeChat = (chat, currentUserId) => {
  if (!chat) return null;
  
  return {
    id: String(chat.id),
    userId: String(chat.userId || chat.contact_id),
    name: chat.name ? sanitizeText(chat.name) : null,
    username: chat.username,
    avatar: chat.avatar,
    verified: chat.verified === 1,
    lastMessage: chat.lastMessage ? sanitizeText(chat.lastMessage) : null,
    timestamp: chat.timestamp || chat.last_message_time,
    unread: chat.unread || 0,
  };
};

// ==================== Сериализаторы серверов ====================

/**
 * Сериализовать сервер
 */
const serializeServer = (server) => {
  if (!server) return null;
  
  return {
    id: server.id,
    username: server.username,
    name: sanitizeText(server.name),
    description: server.description ? sanitizeText(server.description) : null,
    iconUrl: server.icon_url,
    type: server.type,
    ownerId: server.owner_id,
    isMember: !!server.isMember,
    role: server.role ? {
      id: server.role.id,
      name: server.role.name,
      rank: server.role.rank,
    } : null,
    channels: server.channels?.map(ch => ({
      id: ch.id,
      name: ch.name,
      type: ch.type,
      position: ch.position,
    })),
    joinRequest: server.joinRequest ? {
      id: server.joinRequest.id,
      status: server.joinRequest.status,
    } : null,
    createdAt: server.created_at || server.createdAt,
  };
};

/**
 * Сериализовать участника сервера
 */
const serializeServerMember = (member) => {
  if (!member) return null;
  
  return {
    id: member.id,
    name: sanitizeText(member.name),
    username: member.username,
    avatar: member.avatar,
    verified: member.verified === 1,
    role: member.role ? {
      id: member.role.id,
      name: member.role.name,
      rank: member.role.rank,
    } : null,
    joinedAt: member.joined_at,
  };
};

/**
 * Сериализовать сообщение сервера
 */
const serializeServerMessage = (message) => {
  if (!message) return null;
  
  return {
    id: String(message.id),
    channelId: String(message.channel_id),
    userId: String(message.user_id),
    text: message.text ? sanitizeText(message.text) : null,
    createdAt: message.created_at,
    editedAt: message.edited_at,
    deleted: !!message.deleted,
    author: message.name ? {
      id: String(message.user_id),
      name: sanitizeText(message.name),
      username: message.username,
      avatar: message.avatar,
      verified: message.verified === 1,
    } : null,
    attachments: message.attachments || [],
  };
};

// ==================== Сериализаторы верификации ====================

/**
 * Сериализовать заявку на верификацию
 */
const serializeVerificationRequest = (request) => {
  if (!request) return null;
  
  return {
    id: request.id,
    userId: String(request.user_id),
    reason: sanitizeText(request.reason),
    tiktokVideoUrl: request.tiktok_video_url,
    status: request.status,
    createdAt: request.created_at,
    reviewedAt: request.reviewed_at,
    reviewerName: request.reviewer_name,
    reviewNotes: request.review_notes ? sanitizeText(request.review_notes) : null,
  };
};

// ==================== Утилиты ====================

/**
 * Сериализовать массив
 */
const serializeArray = (items, serializer) => {
  if (!items || !Array.isArray(items)) return [];
  return items.map(item => serializer(item));
};

/**
 * Ответ API с данными
 */
const apiResponse = (data, meta = {}) => {
  return {
    data,
    meta,
  };
};

/**
 * Ответ API с ошибкой
 */
const apiError = (message, code, statusCode = 500, details = {}) => {
  return {
    error: {
      message,
      code,
      statusCode,
      details: Object.keys(details).length > 0 ? details : undefined,
    },
  };
};

module.exports = {
  // Сериализаторы
  serializeUser,
  serializeCurrentUser,
  serializeUserAdmin,
  serializePost,
  serializeMessage,
  serializeChat,
  serializeServer,
  serializeServerMember,
  serializeServerMessage,
  serializeVerificationRequest,
  
  // Утилиты
  serializeArray,
  apiResponse,
  apiError,
};
