/**
 * WebSocket Redis Adapter
 * 
 * Синхронизирует WebSocket события между инстансами сервера через Redis Pub/Sub
 * 
 * События для синхронизации:
 * - new_message
 * - post_created
 * - notification
 * - chat_message
 */

const redis = require('./redis');
const { CHANNELS } = require('./redis');

// Хранилище локальных обработчиков событий
const localHandlers = new Map();

/**
 * Инициализирует WebSocket Redis адаптер
 * 
 * @param {object} deps - зависимости
 * @param {Function} deps.sendToUser - функция отправки события пользователю
 * @param {Function} deps.broadcast - функция широковещательной рассылки
 * @param {Function} deps.broadcastToChat - функция рассылки по чату
 * @param {Map} deps.clients - карта подключенных клиентов
 * @returns {Promise<object>}
 */
async function initWsRedisAdapter({ sendToUser, broadcast, broadcastToChat, clients }) {
  console.info('[WsRedisAdapter] Initializing...');

  // Инициализируем Redis подключения
  await redis.initRedis();

  // Подписываемся на все каналы
  await subscribeToChannel(CHANNELS.NEW_MESSAGE, (data) => {
    handleNewMessage(data, { sendToUser, clients });
  });

  await subscribeToChannel(CHANNELS.POST_CREATED, (data) => {
    handlePostCreated(data, { broadcast, clients });
  });

  await subscribeToChannel(CHANNELS.NOTIFICATION, (data) => {
    handleNotification(data, { sendToUser, clients });
  });

  await subscribeToChannel(CHANNELS.CHAT_MESSAGE, (data) => {
    handleChatMessage(data, { broadcastToChat, clients });
  });

  console.info('[WsRedisAdapter] Initialized successfully');

  return {
    publishNewMessage,
    publishPostCreated,
    publishNotification,
    publishChatMessage,
    isRedisAvailable: redis.isAvailable,
  };
}

/**
 * Подписывается на канал Redis
 */
async function subscribeToChannel(channel, handler) {
  await redis.subscribe(channel, handler);
  
  // Сохраняем локальный обработчик
  if (!localHandlers.has(channel)) {
    localHandlers.set(channel, []);
  }
  localHandlers.get(channel).push(handler);
}

/**
 * Публикует событие о новом сообщении
 * 
 * @param {object} data - данные сообщения
 * @param {string} data.id - ID сообщения
 * @param {string} data.senderId - ID отправителя
 * @param {string} data.receiverId - ID получателя
 * @param {string} data.text - текст сообщения
 * @param {string} data.timestamp - временная метка
 * @param {object} [data.sender] - информация об отправителе
 * @param {array} [data.attachments] - вложения
 * @returns {Promise<number>}
 */
async function publishNewMessage(data) {
  return redis.publish(CHANNELS.NEW_MESSAGE, data);
}

/**
 * Публикует событие о создании поста
 * 
 * @param {object} data - данные поста
 * @param {string} data.id - ID поста
 * @param {string} data.userId - ID автора
 * @param {string} data.content - контент
 * @param {string} data.timestamp - временная метка
 * @returns {Promise<number>}
 */
async function publishPostCreated(data) {
  return redis.publish(CHANNELS.POST_CREATED, data);
}

/**
 * Публикует уведомление
 *
 * @param {object} data - данные уведомления
 * @param {string} data.userId - ID получателя
 * @param {string} data.type - тип уведомления (message, reply, mention, reaction, server_invite, server_join, follow, comment, post_resonance, post_comment)
 * @param {string|null} data.actor_id - ID актёра
 * @param {string|null} data.actor_username - username актёра
 * @param {string|null} data.actor_avatar - avatar актёра
 * @param {string|null} data.target_id - ID цели
 * @param {string|null} data.target_type - тип цели
 * @param {string|null} data.message - текст уведомления
 * @param {string|null} data.url - ссылка
 * @param {string} data.timestamp - временная метка
 * @returns {Promise<number>}
 */
async function publishNotification(data) {
  return redis.publish(CHANNELS.NOTIFICATION, data);
}

/**
 * Публикует событие чата
 * 
 * @param {object} data - данные события
 * @param {string} data.chatId - ID чата
 * @param {string} data.messageId - ID сообщения
 * @param {string} data.userId - ID отправителя
 * @param {string} data.text - текст
 * @param {string} data.type - тип события (new_message, chat_updated)
 * @param {string} data.timestamp - временная метка
 * @returns {Promise<number>}
 */
async function publishChatMessage(data) {
  return redis.publish(CHANNELS.CHAT_MESSAGE, data);
}

/**
 * Обработчик события new_message из Redis
 */
function handleNewMessage(data, { sendToUser, clients }) {
  const { receiverId } = data;
  
  if (!receiverId) {
    console.warn('[WsRedisAdapter] new_message: missing receiverId');
    return;
  }

  // Отправляем получателю
  sendToUser(receiverId, {
    type: 'new_message',
    data,
  });
}

/**
 * Обработчик события post_created из Redis
 */
function handlePostCreated(data, { broadcast, clients }) {
  // Рассылаем всем подключенным клиентам
  broadcast({
    type: 'post_created',
    data,
  });
}

/**
 * Обработчик события notification из Redis
 */
function handleNotification(data, { sendToUser, clients }) {
  const {
    userId,
    type,
    actor_id,
    actor_username,
    actor_avatar,
    target_id,
    target_type,
    message,
    url,
    timestamp,
  } = data;

  if (!userId) {
    console.warn('[WsRedisAdapter] notification: missing userId');
    return;
  }

  // Отправляем получателю
  sendToUser(userId, {
    type: 'notification_new',
    data: {
      userId: userId.toString(),
      type: type || 'message',
      actor_id: actor_id ? actor_id.toString() : null,
      actor_username,
      actor_avatar,
      target_id: target_id ? target_id.toString() : null,
      target_type,
      message,
      url,
      timestamp: timestamp || new Date().toISOString()
    },
  });
}

/**
 * Обработчик события chat_message из Redis
 */
function handleChatMessage(data, { broadcastToChat, clients }) {
  const { chatId, type } = data;

  if (!chatId) {
    console.warn('[WsRedisAdapter] chat_message: missing chatId');
    return;
  }

  // Рассылаем участникам чата
  broadcastToChat(chatId, {
    type: type || 'new_message',
    data: data?.data || data,
  });
}

/**
 * Проверяет доступность Redis
 */
function isRedisAvailable() {
  return redis.isAvailable();
}

/**
 * Закрывает подключения
 */
async function shutdown() {
  await redis.shutdown();
  localHandlers.clear();
  console.info('[WsRedisAdapter] Shutdown complete');
}

module.exports = {
  initWsRedisAdapter,
  publishNewMessage,
  publishPostCreated,
  publishNotification,
  publishChatMessage,
  isRedisAvailable,
  shutdown,
};
