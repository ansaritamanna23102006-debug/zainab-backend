const express  = require('express');
const router   = express.Router();
const {
  createContact,
  getAllContacts,
  markAsRead,
  deleteContact,
} = require('../controllers/contactController');
const { protect }    = require('../middleware/authMiddleware');
const { formLimiter } = require('../middleware/rateLimiter');
const { contactRules, validate } = require('../validations/contactValidation');

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form submission and management
 */

// Public: submit contact form
router.post('/', formLimiter, contactRules, validate, createContact);

// Protected: admin only
router.use(protect);
router.get('/',            getAllContacts);
router.patch('/:id/read',  markAsRead);
router.delete('/:id',      deleteContact);

module.exports = router;
