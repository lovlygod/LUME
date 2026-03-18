require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const api = require('../src/api');

const run = async () => {
  if (!api?.ensureStickerData) {
    throw new Error('ensureStickerData not available');
  }
  await api.ensureStickerData();
  console.log('Sticker packs synced');
};

run().catch((err) => {
  console.error('Sticker sync failed:', err?.message || err);
  process.exitCode = 1;
});
