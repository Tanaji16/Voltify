const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadBill } = require('../controllers/billController');

// Multer setup - store uploaded files temporarily in an "uploads" folder
const upload = multer({ dest: 'uploads/' });

// Route to handle bill OCR parsing
router.post('/upload', protect, upload.single('billFile'), uploadBill);

module.exports = router;
