const userService = require("../services/user");

module.exports = {
  create: {
    user: async (req, res) => {
      const { nickname } = req.body;
      const user = await userService.create.user({ nickname });
      return res.status(201).json({ user });
    },
  },
};