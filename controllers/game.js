const gameService = require('../services/game');
const { ControllerAsyncWrapper } = require('../utils/wrapper');

module.exports = {
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
    aiPlayer: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const users = await gameService.create.aiPlayer({ roomId });
      return res.status(200).json({ users });
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

    aiLawyerAct: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const msg = await gameService.gamePlay.aiLawyerAct({ roomId });
      return res.status(200).json({ msg });
    }),

    aiSpyAct: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const msg = await gameService.gamePlay.aiSpyAct({ roomId });
      return res.status(200).json({ msg });
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

    isZeroVote: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const isVote = await gameService.gamePlay.isZeroVote({ roomId });
      return res.status(200).json({ isVote });
    }),

    invalidAndAiVote: ControllerAsyncWrapper(async (req, res) => {
      const { userId, roomId, roundNo } = req.params;
      const msg = await gameService.gamePlay.invalidAndAiVote({
        userId,
        roomId,
        roundNo,
      });
      return res.status(200).json({ msg });
    }),

    getVoteResult: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, roundNo } = req.params;
      const { msg, result } = await gameService.gamePlay.getVoteResult({
        roomId,
        roundNo,
      });
      return res.status(200).json({ msg, result });
    }),
  },

  getGame: {
    users: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const users = await gameService.getGame.users({ roomId });
      return res.status(200).json({ users });
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

    winner: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const users = await gameService.getGame.winner({ roomId });
      return res.status(200).json({ users });
    }),

    userInfo: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, userId } = req.params;
      const user = await gameService.getGame.userInfo({ roomId, userId });
      return res.status(200).json({ user });
    }),
  },
};
