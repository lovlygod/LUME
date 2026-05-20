const axios = require('axios');

const NPM_REGISTRY_URL = 'https://registry.npmjs.org';

const npmCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

const isValidPackageName = (name) => {
  if (!name || typeof name !== 'string') return false;
  if (name.length > 214 || name.length < 1) return false;
  if (name.startsWith('.') || name.startsWith('_')) return false;
  if (encodeURIComponent(name) !== name) return false;
  return true;
};

const getNpmPackageInfo = async (packageName) => {
  const cached = npmCache.get(packageName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const response = await axios.get(`${NPM_REGISTRY_URL}/${packageName}`, {
      timeout: 8000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LUME-messenger/1.0',
      },
    });

    const data = response.data;
    
    const result = {
      name: data.name,
      version: data['dist-tags']?.latest || 'unknown',
      description: data.description || null,
      url: data.homepage || data.repository?.url || null,
    };

    npmCache.set(packageName, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

const clearNpmCache = () => {
  npmCache.clear();
};

module.exports = {
  getNpmPackageInfo,
  isValidPackageName,
  clearNpmCache,
};