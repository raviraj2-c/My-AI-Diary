const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createLetter,
  getLetters,
  getDueLetters,
  getLetter,
  deleteLetter
} = require('../controllers/letterController');

router.use(auth);

router.post('/', createLetter);
router.get('/', getLetters);
router.get('/due', getDueLetters);
router.get('/:id', getLetter);
router.delete('/:id', deleteLetter);

module.exports = router;
