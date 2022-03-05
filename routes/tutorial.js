const express = require('express');
const router = express.Router();

const tutoController = require('../controllers/tutorial');

router.get('/tutorial', tutoController.get.tutorials);

module.exports = router;
