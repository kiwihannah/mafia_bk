const gameService = require('../services/game');
const { ControllerAsyncWrapper } = require('../utils/wrapper');

module.exports = {
  test: {
    statusSchedule: ControllerAsyncWrapper(async () => {
      const statusArr = [
        'showRole',
        'dayTime',
        'voteDay',
        'invailedVoteCnt',
        'showResultDay',
        'isGameResult_1',
        'voteNightLawyer',
        'voteNightDetective',
        'showMsgDetective',
        'voteNightSpy',
        'showResultNight',
        'isGameResult_2',
      ];
      
      function setStatus(sec, status) {
        const next = setTimeout(()=>{
          console.log(status);
        }, sec);   
        
        if (status === 'end') {
          for (let status of statusArr) {
            clearTimeout(status);
          }
        }
      }

      const dayTime             = setStatus(1000, 'dayTime');
      const voteDay             = setStatus(2000, 'voteDay');
      const invailedVoteCnt     = setStatus(3000, 'invailedVoteCnt');
      const showResultDay       = setStatus(4000, 'showResultDay');
      const isGameResult_1      = setStatus(5000, 'isGameResult_1');

      const voteNightLawyer     = setStatus(6000, 'voteNightLawyer');
      const voteNightDetective  = setStatus(7000, 'voteNightDetective');
      const showMsgDetective    = setStatus(8000, 'showMsgDetective');
      const voteNightSpy        = setStatus(9000, 'voteNightSpy');
      const showResultNight     = setStatus(10000, 'showResultNight');
      
      const isGameResult_2      = setStatus(11000, 'isGameResult_2');

      return 'endStatus';
    }),
  },

  entryAndExit: {
    enter: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, userId } = req.params;
      const { roomPwd } = req.body;

      await gameService.entryAndExit.enterRoom({
        roomId,
        userId,
        roomPwd,
      });
      
      return res.status(200).json({ userId });
    }),

    exit: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, userId } = req.params;
      await gameService.entryAndExit.exitRoom({ roomId, userId });
      return res.status(200).json({ userId });
    }),
  },

  create: {
    ready: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, userId } = req.params;
      const isReady = await gameService.create.ready({ roomId, userId });
      return res.status(201).json({ isReady });
    }),

    aiPlayer: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const users = await gameService.create.aiPlayer({ roomId });
      return res.status(200).json({ users });
    }),
  },

  cancel: {
    ready: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, userId } = req.params;
      const isReady = await gameService.cancel.ready({ roomId, userId });
      return res.status(200).json({ isReady });
    }),
  },
  
  update: {
    changeMaxPlayer: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const { maxPlayer } = req.body;
      const room = await gameService.update.changeMaxPlayer({
        roomId,
        maxPlayer,
      });
      return res.status(200).json({ room });
    }),

    status: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, userId } = req.params;
      const nextStatus = await gameService.update.status({ roomId, userId });
      return res.status(200).json({ nextStatus });
    }),
  },

  sendMsg: {
    start: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, userId } = req.params;
      const msg = await gameService.SendMsg.start({ roomId, userId });
      return res.status(200).json({ msg });
    }),
  },

  start: {
    game: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const room = await gameService.start.game({ roomId });
      return res.status(200).json({ room });
    }),
  },

  gamePlay: {
    giveRole: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const users = await gameService.gamePlay.giveRole({ roomId });
      return res.status(201).json({ users });
    }),

    lawyerAct: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const { userId } = req.body;
      const msg = await gameService.gamePlay.lawyerAct({ roomId, userId });
      return res.status(200).json({ msg });
    }),

    // get body가 안먹어서 params로 받아옴
    detectiveAct: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, userId } = req.params;
      const msg = await gameService.gamePlay.detectiveAct({ roomId, userId });
      return res.status(200).json({ msg });
    }),

    spyAct: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const { userId } = req.body;
      const msg = await gameService.gamePlay.spyAct({ roomId, userId });
      return res.status(200).json({ msg });
    }),

    dayTimeVoteArr: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, userId } = req.params;
      const { candidacy, roundNo } = req.body;
      const voteUserId = await gameService.gamePlay.dayTimeVoteArr({
        roomId,
        userId,
        candidacy,
        roundNo,
      });
      return res.status(200).json({ voteUserId });
    }),

    invalidAndAiVote: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, roundNo } = req.params;
      const msg = await gameService.gamePlay.invalidAndAiVote({
        roomId,
        roundNo,
      });
      return res.status(200).json({ msg });
    }),

    getVoteResult: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, roundNo } = req.params;
      const result = await gameService.gamePlay.getVoteResult({
        roomId,
        roundNo,
      });
      return res.status(200).json({ result });
    }),
  },

  getGame: {
    users: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const users = await gameService.getGame.users({ roomId });
      return res.status(200).json({ users });
    }),

    status: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const status = await gameService.getGame.status({ roomId });
      return res.status(200).json({ status });
    }),

    roundNo: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const gameRoundNo = await gameService.getGame.roundNo({ roomId });
      return res.status(200).json({ roundNo: gameRoundNo });
    }),

    result: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const result = await gameService.getGame.result({ roomId });
      return res.status(200).json({ result });
    }),
  },
};
