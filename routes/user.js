const express = require('express');
const router = express.Router();

const UserController = require("../controllers/user");

// 유저 닉네임 생성
router.post('/user', UserController.create.user);
// 유저 방 입장
router.put('/enter/:roomId/user/:userId', UserController.update.userEnter);
// 유저 방 나가기
router.put('/out/:roomId/user/:userId', UserController.update.userOut);
// 방 안 유저 리스트 조회
router.get('/room/:roomId/users', UserController.get.users);

module.exports = router;