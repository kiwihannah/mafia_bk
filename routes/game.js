const express = require('express');
const router = express.Router();
const GameController = require('../controllers/game');

/**
 * 게임 시작 전 로직
 **/
// 유저 방 입장
router.put('/enter/:roomId/user/:userId', GameController.entryAndExit.enter);
// 유저 방 나가기 & 강퇴 기능 공동 사용
router.patch('/out/:roomId/user/:userId', GameController.entryAndExit.exit);
// 레디 하기
router.patch('/room/:roomId/user/:userId/ready', GameController.create.ready);
// ai 플레이어 생성 수락한 방에 부족한 인원 인공지능으로 채우기
router.put('/room/:roomId/ai', GameController.create.aiPlayer);
// 레디 취소
router.patch(
  './room/:roomId/user/:userId/cancelReady',
  GameController.cancel.ready
);
// 방 최대인원 줄이리 -> 조건 : maxPlayer > currPlayer, aiPlayer = N, downgradePlayer = Y
router.patch(
  '/room/:roomId/changeMaxPlayer',
  GameController.update.changeMaxPlayer
);
// 게임 시작 전 시작 조건 메세지 확인
router.get('/room/:roomId/user/:userId/msg', GameController.sendMsg.start);
// 게임 시작하기
router.patch('/room/:roomId/start', GameController.start.game);

/**
 * 게임 플레이 로직
 **/
// 역할 부여
router.patch('/room/:roomId/role', GameController.gamePlay.giveRole);
// 변호사가 일개미 지키기
router.patch('/room/:roomId/lawyerAct', GameController.gamePlay.lawyerAct);
// 탐정이 스파이 알아보기
router.get(
  '/room/:roomId/detectiveAct/:userId',
  GameController.gamePlay.detectiveAct
);
// 스파이가 일개미 해고시키기 일개미 id body로 받음
router.patch('/room/:roomId/spyAct', GameController.gamePlay.spyAct);
// ai개미가 하는 투표
router.patch('/room/:roomId/aiLawyerAct', GameController.gamePlay.aiLawyerAct);
router.patch('/room/:roomId/aiSpyAct', GameController.gamePlay.aiSpyAct);
// 유저 낮 투표 저장
router.patch(
  '/room/:roomId/voter/:userId/vote',
  GameController.gamePlay.dayTimeVoteArr
);
// 유저가 투표를 하나도 하지 않을 경우 확인
router.get('/room/:roomId/isZeroVote', GameController.gamePlay.isZeroVote);

// 무효표 처리 & ai 랜덤 낮투표
router.put(
  '/room/:roomId/round/:roundNo/user/:userId/invalidAndAiVote',
  GameController.gamePlay.invalidAndAiVote
);
// 라운드 별 사원 투표 결과 확인
router.get(
  '/room/:roomId/round/:roundNo',
  GameController.gamePlay.getVoteResult
);
// 라운드 넘버 구하기
router.get('/room/:roomId/roundNo', GameController.getGame.roundNo);

/**
 * 게임정보 메세지 받기
 **/
// 방 안 유저 리스트 조회roomId
router.get('/room/:roomId/users', GameController.getGame.users);
// 결과 확인
router.get('/room/:roomId/result', GameController.getGame.result);

module.exports = router;
