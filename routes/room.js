const express = require('express');
const router = express.Router();

const RoomController = require('../controllers/room');

// 게임방 생성
router.post('/room/user/:userId', RoomController.create.room);
// 로비 게임방 리스트
router.get('/lobby', RoomController.get.rooms);

module.exports = router;
