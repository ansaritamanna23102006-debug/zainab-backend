const cloudinary        = require('../config/cloudinary');
const AppError          = require('../utils/AppError');
const catchAsync        = require('../utils/catchAsync');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');

/* ════════════════════════════════════════════════════════════════════════
   POST /api/upload/image  — Single image upload
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload a single image to Cloudinary
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 */
const uploadSingleImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload an image file.', 400));

  const result = await uploadToCloudinary(req.file.buffer);

  res.status(201).json({
    status:  'success',
    message: 'Image uploaded successfully.',
    data: {
      url:      result.secure_url,
      publicId: result.public_id,
      format:   result.format,
      width:    result.width,
      height:   result.height,
      size:     result.bytes,
    },
  });
});

/* ════════════════════════════════════════════════════════════════════════
   POST /api/upload/images  — Multiple image upload
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/upload/images:
 *   post:
 *     summary: Upload multiple images to Cloudinary (max 10)
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 */
const uploadMultipleImages = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload at least one image.', 400));
  }

  const results = await Promise.all(
    req.files.map((file) => uploadToCloudinary(file.buffer))
  );

  const images = results.map((result) => ({
    url:      result.secure_url,
    publicId: result.public_id,
    format:   result.format,
    width:    result.width,
    height:   result.height,
    size:     result.bytes,
  }));

  res.status(201).json({
    status:  'success',
    message: `${images.length} image(s) uploaded successfully.`,
    data:    { images },
  });
});

/* ════════════════════════════════════════════════════════════════════════
   DELETE /api/upload/:publicId  — Delete from Cloudinary
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/upload/{publicId}:
 *   delete:
 *     summary: Delete an image from Cloudinary
 *     tags: [Upload]
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted
 */
const deleteImage = catchAsync(async (req, res, next) => {
  const { publicId } = req.params;
  const fullPublicId = `zainab-clinic/gallery/${publicId}`;

  const result = await cloudinary.uploader.destroy(fullPublicId);
  if (result.result !== 'ok') {
    return next(new AppError('Image not found or could not be deleted.', 404));
  }

  res.status(200).json({
    status:  'success',
    message: 'Image deleted successfully.',
  });
});

module.exports = { uploadSingleImage, uploadMultipleImages, deleteImage };
