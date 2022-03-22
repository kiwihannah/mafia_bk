const userService = require('../services/user');
const { ControllerAsyncWrapper } = require('../utils/wrapper');
const session = require('express-session');
const nickname = require('../middlewares/nicknameMaker');

module.exports = {
  create: {
    user: ControllerAsyncWrapper(async (req, res) => {
      const { nickname } = req.body;
      const user = await userService.create.user({ nickname });
      // 세션에 유저 정보 저장
      req.session.loggedUser = user;
      return res.status(201).json({ user });
    }),
  },

  get: {
    users: async (req, res) => {
      const { roomId } = req.params;
      const users = await userService.get.users({ roomId });
      return res.status(200).json({ users });
    },

    randomNick: ControllerAsyncWrapper(async (_, res) => {
      const nick = nickname();
      return res.status(200).json({ nick });
    }),
  },

  delete: {
    user: ControllerAsyncWrapper(async (req, res) => {
      const { userId } = req.params;
      await userService.delete.user({ userId });
      return res.status(202).json({});
    }),
  },
};
