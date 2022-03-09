const userService = require('../services/user');
const { ControllerAsyncWrapper } = require('../utils/wrapper');

module.exports = {
  create: {
    user: ControllerAsyncWrapper(async (req, res) => {
      const { nickname } = req.body;
      const user = await userService.create.user({ nickname });
      return res.status(201).json({ user });
    }),
  },

  update: {
    userEnter: async (req, res) => {
      const { roomId, userId } = req.params;
      const { roomPwd } = req.body;
      console.log(`roomId:${roomId} userId: ${userId} roomPwd: ${roomPwd}`);
      const user = await userService.update.userEnter({
        roomId,
        userId,
        roomPwd,
      });
      return res.status(200).json({ user });
    },

    userOut: async (req, res) => {
      const { roomId, userId } = req.params;
      const user = await userService.update.userOut({ roomId, userId });
      return res.status(200).json({ user });
    },
  },

  get: {
    users: async (req, res) => {
      const { roomId } = req.params;
      const users = await userService.get.users({ roomId });
      return res.status(200).json({ users });
    },

    randomNick: async (req, res) => {

    },
  },

  delete: {
    user: ControllerAsyncWrapper(async (req, res) => {
      const { userId } = req.params;
      await userService.delete.user({ userId });
      return res.status(202).json({ });
    }),
  },
};
