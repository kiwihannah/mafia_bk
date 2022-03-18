const express = require('express');
const router = express.Router();

const UserController = require('../controllers/user');

// 유저 닉네임 생성
router.post('/user', UserController.create.user);
// 랜덤 아이디 생성 요청 -> string 반환
router.get('/randomNick', UserController.get.randomNick);
// 유저 삭제
router.delete('/user/:userId', UserController.delete.user);

module.exports = router;
