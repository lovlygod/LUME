/**
 * Redis конфигурация и подключение
 * 
 * Используется для WebSocket синхронизации между инстансами сервера
 * через Redis Pub/Sub
 */

const Redis = require('ioredis');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Redis конфигурация из переменных окружения
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);

// Каналы для WebSocket событий
const CHANNELS = {
  NEW_MESSAGE: 'ws:new_message',
  POST_CREATED: 'ws:post_created',
  NOTIFICATION: 'ws:notification',
  SERVER_MESSAGE: 'ws:server_message',
};

// Singleton инстансы Redis
let pubClient = null;
let subClient = null;
let isConnected = false;
let isConnecting = false;

/**
 * Создает Redis подключение с обработкой ошибок
 * @param {string} name - имя клиента для логирования
 * @returns {Redis}
 */
function createRedisClient(name) {
  const options = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: REDIS_DB,
    retryStrategy: (times) => {
      if (times > 10) {
        console.info(`[Redis] ${name}: Max retry attempts reached, stopping reconnect`);
        return null;
      }
      const delay = Math.min(times * 100, 3000);
      console.info(`[Redis] ${name}: Reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
  };

  if (REDIS_PASSWORD) {
    options.password = REDIS_PASSWORD;
  }

  const client = new Redis(options);

  client.on('connect', () => {
    console.info(`[Redis] ${name}: Connected to ${REDIS_HOST}:${REDIS_PORT}`);
  });

  client.on('ready', () => {
    console.info(`[Redis] ${name}: Ready`);
    if (name === 'pub') {
      isConnected = true;
    }
  });

  client.on('error', (err) => {
    console.error(`[Redis] ${name}: Error -`, err.message);
    if (name === 'pub') {
      isConnected = false;
    }
  });

  client.on('close', () => {
    console.info(`[Redis] ${name}: Connection closed`);
    if (name === 'pub') {
      isConnected = false;
    }
  });

  client.on('reconnecting', (delay) => {
    console.info(`[Redis] ${name}: Reconnecting in ${delay}ms`);
    if (name === 'pub') {
      isConnected = false;
    }
  });

  return client;
}

/**
 * Инициализирует Redis подключения
 * @returns {Promise<{pubClient: Redis, subClient: Redis}>}
 */
async function initRedis() {
  if (isConnecting || (pubClient && subClient)) {
    return { pubClient, subClient };
  }

  isConnecting = true;

  try {
    pubClient = createRedisClient('pub');
    subClient = createRedisClient('sub');

    // Ждем готовности pub клиента
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 5000);

      pubClient.on('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      pubClient.on('error', (err) => {
        clearTimeout(timeout);
        console.warn('[Redis] Failed to connect, continuing in local mode');
        resolve(); // Продолжаем работу без Redis
      });
    });

    isConnecting = false;
    console.info('[Redis] Initialization complete');
    return { pubClient, subClient };
  } catch (error) {
    isConnecting = false;
    console.warn('[Redis] Initialization failed, continuing in local mode');
    return { pubClient: null, subClient: null };
  }
}

/**
 * Публикует событие в Redis канал
 * @param {string} channel - канал
 * @param {object} data - данные события
 * @returns {Promise<number>}
 */
async function publish(channel, data) {
  if (!pubClient || !isConnected) {
    console.info('[Redis] Publish skipped - not connected');
    return 0;
  }

  try {
    const message = JSON.stringify({
      channel,
      data,
      timestamp: new Date().toISOString(),
      nodeId: process.pid, // ID текущей ноды
    });
    const result = await pubClient.publish(channel, message);
    return result;
  } catch (error) {
    console.error('[Redis] Publish error:', error.message);
    return 0;
  }
}

/**
 * Подписывается на Redis канал
 * @param {string} channel - канал
 * @param {function} handler - обработчик сообщений
 * @returns {Promise<void>}
 */
async function subscribe(channel, handler) {
  if (!subClient) {
    console.info('[Redis] Subscribe skipped - no client');
    return;
  }

  try {
    await subClient.subscribe(channel);
    subClient.on('message', (subscribedChannel, message) => {
      if (subscribedChannel === channel) {
        try {
          const parsed = JSON.parse(message);
          // Игнорируем сообщения от этой же ноды
          if (parsed.nodeId === process.pid) {
            return;
          }
          handler(parsed.data);
        } catch (error) {
          console.error('[Redis] Message parse error:', error.message);
        }
      }
    });
    console.info(`[Redis] Subscribed to ${channel}`);
  } catch (error) {
    console.error('[Redis] Subscribe error:', error.message);
  }
}

/**
 * Отписывается от Redis канала
 * @param {string} channel - канал
 * @returns {Promise<void>}
 */
async function unsubscribe(channel) {
  if (!subClient) {
    return;
  }

  try {
    await subClient.unsubscribe(channel);
    console.info(`[Redis] Unsubscribed from ${channel}`);
  } catch (error) {
    console.error('[Redis] Unsubscribe error:', error.message);
  }
}

/**
 * Проверяет доступность Redis
 * @returns {boolean}
 */
function isAvailable() {
  return isConnected && pubClient !== null && subClient !== null;
}

/**
 * Закрывает Redis подключения
 * @returns {Promise<void>}
 */
async function shutdown() {
  if (subClient) {
    await subClient.unsubscribe();
    await subClient.quit();
    subClient = null;
  }
  if (pubClient) {
    await pubClient.quit();
    pubClient = null;
  }
  isConnected = false;
  console.info('[Redis] Shutdown complete');
}

module.exports = {
  initRedis,
  publish,
  subscribe,
  unsubscribe,
  isAvailable,
  shutdown,
  CHANNELS,
  getPubClient: () => pubClient,
  getSubClient: () => subClient,
};

