const userService = require('../services/user');
const { ControllerAsyncWrapper } = require('../utils/wrapper');
const nickname = require('../middlewares/nicknameMaker');

module.exports = {
  create: {
    user: ControllerAsyncWrapper(async (req, res) => {
      const { nickname } = req.body;
      const user = await userService.create.user({ nickname });
      return res.status(201).json({ user });
    }),
  },

  get: {
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
