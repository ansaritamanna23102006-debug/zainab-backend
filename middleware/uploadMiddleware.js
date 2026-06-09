const multer     = require('multer');
const streamifier = require('streamifier');
const cloudinary  = require('../config/cloudinary');
const AppError    = require('../utils/AppError');

/* ── Multer: memory storage (buffer) ──────────────────────────────────── */
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed (jpg, jpeg, png, webp).', 400), false);
  }
};

const uploadImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files:    10,
  },
});

/* ── Helper: stream buffer to Cloudinary ──────────────────────────────── */
const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'zainab-clinic/gallery',
        transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

module.exports = { uploadImage, uploadToCloudinary };
