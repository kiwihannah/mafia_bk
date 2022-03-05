const userService = require("../services/user");

module.exports = {
  create: {
    user: async (req, res) => {
      const { nickname } = req.body;
      const user = await userService.create.user({ nickname });
      return res.status(201).json({ user });
    },
  },

  updateIn: {
    user: async (req, res) => {
      const { roomId, userId } = req.params;
      const { roomPwd } = req.body;
      const user = await userService.updateIn.user({ roomId, userId, roomPwd });
      return res.status(200).json({ user });
    },
  },

  updateOut: {
    user: async (req, res) => {
      const { roomId, userId } = req.params;
      const user = await userService.updateOut.user({ roomId, userId });
      return res.status(200).json({ user });
    },
  },
};