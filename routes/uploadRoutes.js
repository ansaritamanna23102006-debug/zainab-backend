const express  = require('express');
const router   = express.Router();
const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
} = require('../controllers/uploadController');
const { protect }     = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Cloudinary image upload management
 */

router.use(protect); // All upload routes require admin auth

router.post('/image',        uploadImage.single('image'),       uploadSingleImage);
router.post('/images',       uploadImage.array('images', 10),   uploadMultipleImages);
router.delete('/:publicId',  deleteImage);

module.exports = router;
