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
  CHAT_MESSAGE: 'ws:chat_message',
  CALL_SIGNAL: 'ws:call_signal',
};

// Singleton инстансы Redis
let pubClient = null;
let subClient = null;
let isConnected = false;
let isConnecting = false;
let redisDisabled = false;
let warnedPublishSkip = false;
let warnedSubscribeSkip = false;
let warnedRedisUnavailable = false;

/**
 * Создает Redis подключение с обработкой ошибок
 * @param {string} name - имя клиента для логирования
 * @returns {Redis}
 */
function createRedisClient(name) {
  let retriesExhausted = false;
  const options = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: REDIS_DB,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy: (times) => {
      if (times > 10) {
        if (!warnedRedisUnavailable) {
          warnedRedisUnavailable = true;
          console.warn('[Redis] Redis unavailable, switching to local mode');
        }
        retriesExhausted = true;
        redisDisabled = true;
        return null;
      }
      return Math.min(times * 100, 3000);
    },
  };

  if (REDIS_PASSWORD) {
    options.password = REDIS_PASSWORD;
  }

  const client = new Redis(options);

  client.on('connect', () => {
    warnedRedisUnavailable = false;
    console.info(`[Redis] ${name}: Connected to ${REDIS_HOST}:${REDIS_PORT}`);
  });

  client.on('ready', () => {
    console.info(`[Redis] ${name}: Ready`);
    if (name === 'pub') {
      isConnected = true;
    }
  });

  client.on('error', (err) => {
    if (retriesExhausted) {
      if (!redisDisabled) {
        console.warn('[Redis] Disabled after max retry attempts, using local mode only');
      }
      redisDisabled = true;
      return;
    }
    if (!warnedRedisUnavailable) {
      warnedRedisUnavailable = true;
      console.warn('[Redis] Redis unavailable, continuing in local mode');
    }
    if (name === 'pub') {
      isConnected = false;
    }
  });

  client.on('close', () => {
    if (name === 'pub') {
      isConnected = false;
    }
  });

  client.on('reconnecting', () => {
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
  if (redisDisabled) {
    return { pubClient: null, subClient: null };
  }

  if (isConnecting || (pubClient && subClient)) {
    return { pubClient, subClient };
  }

  isConnecting = true;

  try {
    console.info(
      `[Redis] Config: host=${REDIS_HOST} port=${REDIS_PORT} db=${REDIS_DB} passwordSet=${Boolean(REDIS_PASSWORD)}`
    );
    pubClient = createRedisClient('pub');
    subClient = createRedisClient('sub');

    await pubClient.connect();
    await subClient.connect();

    // Ждем готовности pub клиента
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 5000);

      pubClient.on('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      pubClient.on('error', () => {
        clearTimeout(timeout);
        resolve(); // Продолжаем работу без Redis
      });
    });

    if (!isConnected) {
      try { await subClient.quit(); } catch (_) {}
      try { await pubClient.quit(); } catch (_) {}
      subClient = null;
      pubClient = null;
    }

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
  if (redisDisabled || !pubClient || !isConnected) {
    if (!warnedPublishSkip) {
      warnedPublishSkip = true;
      console.info('[Redis] Publish skipped - not connected (local mode)');
    }
    return 0;
  }

  warnedPublishSkip = false;

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
  if (redisDisabled || !subClient) {
    if (!warnedSubscribeSkip) {
      warnedSubscribeSkip = true;
      console.info('[Redis] Subscribe skipped - no client (local mode)');
    }
    return;
  }

  warnedSubscribeSkip = false;

  if (subClient.status !== 'ready' && subClient.status !== 'connect') {
    console.info(`[Redis] Subscribe skipped - client status is ${subClient.status}`);
    return;
  }

  try {
    const handlerKey = `${channel}:${handler.name || 'anon'}`;
    if (subClient._lumeHandlers?.has(handlerKey)) {
      return;
    }
    if (!subClient._lumeHandlers) subClient._lumeHandlers = new Set();
    subClient._lumeHandlers.add(handlerKey);

    await subClient.subscribe(channel);
    subClient.on('message', (subscribedChannel, message) => {
      if (subscribedChannel === channel) {
        try {
          const parsed = JSON.parse(message);
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
    if (!String(error?.message || '').includes('Connection is closed')) {
      console.error('[Redis] Subscribe error:', error.message);
    }
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
