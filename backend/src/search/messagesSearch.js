const { MeiliSearch } = require('meilisearch');
const { logger } = require('../logger');

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || 'masterKey';
const MEILISEARCH_ENABLED = process.env.MEILISEARCH_ENABLED !== 'false';
const MEILISEARCH_RETRY_MS = Number(process.env.MEILISEARCH_RETRY_MS || 30000);
const INDEX_NAME = 'messages';

let client = null;
let index = null;
let initInProgress = null;
let unavailableUntil = 0;
let disabledLogged = false;
let skippedIndexationLogged = false;

async function initMeilisearch() {
  if (!MEILISEARCH_ENABLED) {
    if (!disabledLogged) {
      logger.warn('[Meilisearch] Disabled by configuration (MEILISEARCH_ENABLED=false)');
      disabledLogged = true;
    }
    return false;
  }

  if (index) return true;
  if (initInProgress) return initInProgress;
  if (Date.now() < unavailableUntil) return false;

  initInProgress = (async () => {
    try {
      client = new MeiliSearch({
        host: MEILISEARCH_HOST,
        apiKey: MEILISEARCH_KEY,
      });

      // Compatibility path for different meilisearch-js versions.
      try {
        await client.getIndex(INDEX_NAME);
      } catch (_err) {
        await client.createIndex(INDEX_NAME, { primaryKey: 'id' });
      }

      index = client.index(INDEX_NAME);

      await index.updateSettings({
        searchableAttributes: ['text'],
        filterableAttributes: ['chatId', 'serverId', 'userId', 'timestamp'],
        sortableAttributes: ['timestamp'],
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: {
            oneTypo: 4,
            twoTypos: 8,
          },
          disableOnAttributes: [],
          disableOnWords: [],
        },
        synonyms: {},
        stopWords: [],
      });

      logger.info('[Meilisearch] Initialized successfully');
      skippedIndexationLogged = false;
      return true;
    } catch (error) {
      unavailableUntil = Date.now() + MEILISEARCH_RETRY_MS;
      logger.error('[Meilisearch] Initialization failed', {
        error: error.message,
        nextRetryInMs: MEILISEARCH_RETRY_MS,
      });
      return false;
    } finally {
      initInProgress = null;
    }
  })();

  return initInProgress;
}

async function indexMessage(message) {
  if (!index) {
    const initialized = await initMeilisearch();
    if (!initialized) {
      if (!skippedIndexationLogged) {
        logger.warn('[Meilisearch] Not initialized, skipping indexation');
        skippedIndexationLogged = true;
      }
      return;
    }
  }

  try {
    const document = {
      id: String(message.id),
      chatId: String(message.chatId),
      serverId: message.serverId ? String(message.serverId) : null,
      userId: String(message.userId),
      text: message.text,
      timestamp: message.timestamp,
    };

    await index.addDocuments([document], { primaryKey: 'id' });
    logger.debug('[Meilisearch] Message indexed', { messageId: message.id });
  } catch (error) {
    logger.error('[Meilisearch] Failed to index message', {
      messageId: message.id,
      error: error.message,
    });
  }
}

async function deleteMessage(messageId) {
  if (!index) {
    return;
  }

  try {
    await index.deleteDocument(String(messageId));
    logger.debug('[Meilisearch] Message deleted from index', { messageId });
  } catch (error) {
    logger.error('[Meilisearch] Failed to delete message', {
      messageId,
      error: error.message,
    });
  }
}

async function searchMessages(query, options = {}) {
  if (!index) {
    const initialized = await initMeilisearch();
    if (!initialized) {
      throw new Error('Meilisearch not available');
    }
  }

  const { chatIds = [], limit = 50, sort = 'timestamp:desc' } = options;

  const filter = [];
  if (chatIds.length > 0) {
    const chatIdsFilter = chatIds.map((id) => `chatId = "${String(id)}"`).join(' OR ');
    filter.push(`(${chatIdsFilter})`);
  }

  const searchFilter = filter.length > 0 ? filter.join(' AND ') : null;

  const sanitizedQuery = String(query || '').trim();

  return index.search(sanitizedQuery, {
    limit,
    filter: searchFilter,
    sort: [sort],
    attributesToHighlight: ['text'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
    showMatchesPosition: true,
    matchingStrategy: sanitizedQuery.length <= 2 ? 'all' : 'last',
    typoTolerance: sanitizedQuery.length <= 2 ? 'false' : undefined,
  });
}

async function bulkIndexMessages(messages) {
  if (!index) {
    const initialized = await initMeilisearch();
    if (!initialized) {
      if (!skippedIndexationLogged) {
        logger.warn('[Meilisearch] Not initialized, skipping bulk indexation');
        skippedIndexationLogged = true;
      }
      return;
    }
  }

  try {
    const documents = messages.map((msg) => ({
      id: String(msg.id),
      chatId: String(msg.chatId),
      serverId: msg.serverId ? String(msg.serverId) : null,
      userId: String(msg.userId),
      text: msg.text,
      timestamp: msg.timestamp,
    }));

    await index.addDocuments(documents, { primaryKey: 'id' });
    logger.info('[Meilisearch] Bulk indexed', { count: messages.length });
  } catch (error) {
    logger.error('[Meilisearch] Bulk indexation failed', { error: error.message });
  }
}

module.exports = {
  initMeilisearch,
  indexMessage,
  deleteMessage,
  searchMessages,
  bulkIndexMessages,
  INDEX_NAME,
};
