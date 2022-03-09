const express = require('express');
const router = express.Router();

const GameController = require('../controllers/user');

// 레디한 유저 게임 플레이 유저로 추가
router.post('/room/:roomId/user/:userId/ready', GameController.create.readyGroup);


module.exports = router;
