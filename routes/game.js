const express = require('express');
const router = express.Router();

const GameController = require('../controllers/game');

// 유저 방 입장
router.put('/enter/:roomId/user/:userId', GameController.entryAndExit.enter);
// 유저 방 나가기 & 강퇴 기능 공동 사용
router.patch('/out/:roomId/user/:userId', GameController.entryAndExit.exit);
// 방 안 유저 리스트 조회
router.get('/room/:roomId/users', GameController.get.users);


// 레디한 유저 게임 플레이 유저로 추가
router.patch(
  '/room/:roomId/user/:userId/ready',
  GameController.create.readyGroup
);
// ai 플레이어 생성 수락한 방에 부족한 인원 인공지능으로 채우기
router.put('/room/:roomId/ai', GameController.create.aiPlayer);
// 레디 취소하기
router.patch(
  '/room/:roomId/user/:userId/cancelReady',
  GameController.cancel.ready
);


// 게임 시작하기
router.patch('/room/:roomId/user/:userId/start', GameController.start.game);
// 조건 : maxPlayer > currPlayer, aiPlayer = N, downgradePlayer = Y
router.patch(
  '/room/:roomId/changeMaxPlayer',
  GameController.update.changeMaxPlayer
);
// 역할 부여
router.patch('/room/:roomId/role', GameController.gamePlay.giveRole);


// 변호사가 일개미 지키기
router.patch('/room/:roomId/lawyerAct', GameController.gamePlay.lawyerAct);
// 탐정이 스파이 알아보기
router.get('/room/:roomId/detectiveAct', GameController.gamePlay.detectiveAct);
// 스파이가 일개미 해고시키기 일개미 id body로 받음
router.patch('/room/:roomId/spyAct', GameController.gamePlay.spyAct);
// 낮시간 투표
router.patch('/room/:roomId/dayTimeVote', GameController.gamePlay.dayTimeVote);
// 유저 낮 투표 저장
router.patch(
  '/room/:roomId/voter/:userId/vote',
  GameController.gamePlay.dayTimeVoteArr
);
// 라운드 별 사원 투표 결과 확인
router.get('/room/:roomId/round/:roundNo', GameController.get.dayTimeVoteResult);


// 게임 스테이지 라운드 번호 가져오기
router.get('/room/:roomId/roundNo', GameController.get.roundNo);
// 결과가 났는지 확인
router.get('/room/:roomId/gameResult', GameController.get.result);


module.exports = router;
