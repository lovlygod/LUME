const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const buildFolder = (req) => {
  const reqPath = String(req.path || '').toLowerCase();
  if (reqPath.includes('avatar')) return 'lume/avatars';
  if (reqPath.includes('banner')) return 'lume/banners';
  if (reqPath.includes('messages')) return 'lume/messages';
  if (reqPath.includes('stickers')) return 'lume/stickers';
  if (reqPath.includes('moments')) return 'lume/moments';
  if (reqPath.includes('voice')) return 'lume/voice';
  return 'lume/misc';
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isAudio = file?.mimetype?.startsWith('audio/');
    const isGif = file?.mimetype === 'image/gif' || String(file?.originalname || '').toLowerCase().endsWith('.gif');
    const folder = buildFolder(req);
    const allowedFormats = isAudio
      ? ['webm', 'ogg', 'mp3', 'wav', 'm4a', 'aac']
      : ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    return {
      folder,
      resource_type: isAudio ? 'video' : 'image',
      allowed_formats: allowedFormats,
      format: isGif ? 'gif' : undefined,
      transformation: isAudio || isGif ? undefined : [{ quality: 'auto', fetch_format: 'auto' }],
    };
  },
});

const imageFileFilter = (_req, file, cb) => {
  if (!file?.mimetype?.startsWith('image/')) {
    return cb(new Error('Only images allowed'));
  }
  return cb(null, true);
};

const audioFileFilter = (_req, file, cb) => {
  if (!file?.mimetype?.startsWith('audio/')) {
    return cb(new Error('Only audio allowed'));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

const uploadFile = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

const uploadVoice = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

const uploadStickers = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 60,
  },
});

const uploadMemoryImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = {
  upload,
  uploadFile,
  uploadVoice,
  uploadStickers,
  uploadMemoryImage,
};
