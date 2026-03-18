const db = require('./db');
const { getPublicBaseUrl } = require('./utils/baseUrl');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, filename);
  }
});

// File type validation
const allowedMimeTypes = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  // Archives
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  // Audio (voice messages)
  'audio/webm', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/ogg;codecs=opus',
  'audio/mp4', 'audio/mpeg', 'audio/wav'
];

const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Block dangerous extensions
  if (blockedExtensions.includes(ext)) {
    return cb(new Error('File type not allowed'));
  }
  
  // Allow images
  if (file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  
  // Allow specific MIME types
  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  
  // Block everything else
  cb(new Error('File type not allowed'));
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

// Upload handler
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user?.userId || 'anonymous';
    const filename = req.file.filename;
    const url = `${getPublicBaseUrl(req)}/uploads/${filename}`;
    const mime = req.file.mimetype;
    const size = req.file.size;

    // Determine type
    const isImage = mime.startsWith('image/');
    const type = isImage ? 'image' : 'file';

    // Get image dimensions if it's an image
    let width = null;
    let height = null;
    
    if (isImage) {
      try {
        const sizeOf = require('image-size');
        const dimensions = sizeOf(req.file.path);
        width = dimensions.width;
        height = dimensions.height;
      } catch (e) {
        // Ignore if we can't get dimensions
      }
    }

    // Create attachment record in database (as draft, no message_id yet)
    db.run(
      `INSERT INTO attachments (message_id, type, url, mime, size, width, height)
       VALUES (NULL, $1, $2, $3, $4, $5, $6)`,
      [type, url, mime, size, width, height],
      function(err) {
        if (err) {
          console.error('Error creating attachment record:', err);
          // Delete the file
          fs.unlinkSync(path.join(__dirname, '../uploads', filename));
          return res.status(500).json({ error: 'Database error' });
        }

        const attachmentId = this.lastID;

        res.json({
          attachmentId: attachmentId.toString(),
          url,
          mime,
          size,
          type,
          width,
          height,
          filename
        });
      }
    );
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max size is 25MB' });
      }
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Voice message storage (separate config for audio files)
const voiceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/voice');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `voice-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, filename);
  }
});

// Voice message upload instance
const voiceUpload = multer({
  storage: voiceStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Block dangerous extensions
    if (blockedExtensions.includes(ext)) {
      return cb(new Error('File type not allowed'));
    }
    
    // Allow audio types
    if (file.mimetype.startsWith('audio/')) {
      return cb(null, true);
    }
    
    cb(new Error('File type not allowed'));
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for voice messages
    files: 1
  }
});

// Voice message upload handler
const uploadVoiceMessage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user?.userId || 'anonymous';
    const filename = req.file.filename;
    const url = `${getPublicBaseUrl(req)}/uploads/voice/${filename}`;
    const mime = req.file.mimetype;
    const size = req.file.size;
    const duration = parseFloat(req.body.duration) || 0;

    // Create attachment record in database
    db.run(
      `INSERT INTO attachments (message_id, type, url, mime, size, duration)
       VALUES (NULL, 'voice', $1, $2, $3, $4)`,
      [url, mime, size, duration],
      function(err) {
        if (err) {
          console.error('Error creating voice attachment record:', err);
          // Delete the file
          fs.unlinkSync(path.join(__dirname, '../uploads/voice', filename));
          return res.status(500).json({ error: 'Database error' });
        }

        const attachmentId = this.lastID;

        res.json({
          attachmentId: attachmentId.toString(),
          url,
          mime,
          size,
          type: 'voice',
          duration
        });
      }
    );
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max size is 10MB' });
      }
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

module.exports = {
  upload,
  uploadFile,
  voiceUpload,
  uploadVoiceMessage
};
