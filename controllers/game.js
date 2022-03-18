const gameService = require('../services/game');
const { ControllerAsyncWrapper } = require('../utils/wrapper');
const { socket } = require('../middlewares/socket.io');

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
    readyGroup: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, userId } = req.params;
      await gameService.create.readyGroup({ roomId, userId });
      return res.status(201).json({ userId });
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
      await gameService.cancel.ready({ userId });
      return res.status(200).json({ userId });
    }),
  },

  start: {
    game: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const room = await gameService.start.game({ roomId });
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

  getStatus: {
    msg: ControllerAsyncWrapper(socket, async (req, res) => {
      const { roomId } = req.params;
      const status = await gameService.getStatus.msg({ roomId });
      return res.status(200).json({ status });
    }),

    update: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const status = await gameService.getStatus.update({ roomId });
      return res.status(200).json({ status });
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

    sendInvalidVote: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, roundNo } = req.params;
      const msg = await gameService.gamePlay.sendInvalidVote({ roomId, roundNo });
      return res.status(200).json({ msg });
    }),

  },

  getResult: {
    vote: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, roundNo } = req.params;
      const result = await gameService.gamePlay.getVoteResult({ roomId, roundNo });
      return res.status(200).json({ result });
    }),
  },

  get: {
    // dayTimeVoteResult: ControllerAsyncWrapper(async (req, res) => {
    //   // const { roomId, roundNo } = req.params;
    //   // const result = await gameService.gamePlay.getVoteResult({
    //   //   roomId,
    //   //   roundNo,
    //   // });
    //   return res.status(200).json({ 123:1 });
    // }),

    status: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const status = await gameService.getGame.status({ roomId });
      return res.status(200).json({ status });
    }),

    roundNo: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const roundNo = await gameService.getGame.roundNo({ roomId });
      return res.status(200).json({ roundNo });
    }),

    voteResult: ControllerAsyncWrapper(async (req, res) => {
      const { roomId, roundNo } = req.params;
      const result = await gameService.gamePlay.dayTimeVoteArr({ roomId, roundNo });
      return res.status(200).json({ result });
    }),

    users: ControllerAsyncWrapper(async (req, res) => {
      const { roomId } = req.params;
      const users = await gameService.getGame.users({ roomId });
      return res.status(200).json({ users });
    }),
  },
};
