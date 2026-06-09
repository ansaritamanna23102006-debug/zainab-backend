const Contact   = require('../models/Contact');
const AppError  = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { sendContactEmail } = require('../services/emailService');

/* ════════════════════════════════════════════════════════════════════════
   POST /api/contact
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a contact message
 *     tags: [Contact]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Contact'
 *     responses:
 *       201:
 *         description: Message received
 */
const createContact = catchAsync(async (req, res) => {
  const contact = await Contact.create(req.body);

  // Non-blocking email notification
  sendContactEmail(contact).then(() => {
    Contact.findByIdAndUpdate(contact._id, { emailSent: true }).exec();
  }).catch((err) => {
    console.error('Contact email failed:', err.message);
  });

  res.status(201).json({
    status:  'success',
    message: 'Thank you for reaching out! We will get back to you shortly.',
    data:    { contact },
  });
});

/* ════════════════════════════════════════════════════════════════════════
   GET /api/contact  (Protected)
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/contact:
 *   get:
 *     summary: Get all contact messages (Admin only)
 *     tags: [Contact]
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of messages
 */
const getAllContacts = catchAsync(async (req, res) => {
  const { isRead, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (isRead !== undefined) filter.isRead = isRead === 'true';

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Contact.countDocuments(filter);

  const contacts = await Contact.find(filter)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    status: 'success',
    results: contacts.length,
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
    data: { contacts },
  });
});

/* ════════════════════════════════════════════════════════════════════════
   PATCH /api/contact/:id/read  (Protected)
════════════════════════════════════════════════════════════════════════ */
const markAsRead = catchAsync(async (req, res, next) => {
  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );
  if (!contact) return next(new AppError('Message not found.', 404));

  res.status(200).json({ status: 'success', data: { contact } });
});

/* ════════════════════════════════════════════════════════════════════════
   DELETE /api/contact/:id  (Protected)
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/contact/{id}:
 *   delete:
 *     summary: Delete a contact message
 *     tags: [Contact]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
const deleteContact = catchAsync(async (req, res, next) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) return next(new AppError('Message not found.', 404));

  res.status(204).json({ status: 'success', data: null });
});

module.exports = { createContact, getAllContacts, markAsRead, deleteContact };
