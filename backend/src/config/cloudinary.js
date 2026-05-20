const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbmpcpvrr',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: process.env.CLOUDINARY_TIMEOUT_MS ? Number(process.env.CLOUDINARY_TIMEOUT_MS) : 120000,
});

module.exports = cloudinary;
