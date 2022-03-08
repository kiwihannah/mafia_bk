const gameService = require('../services/game');

module.exports = {
  create: {
    ready: async (_, res) => {
      const { nickname } = req.body;
      const user = await gameService.create.user({ nickname });
      return res.status(201).json({ user });
    },
  },

  update: {
    ready: async (_, res) => {
      const user = await gameService.create.user({ nickname });
      return res.status(201).json({ user });
    },
  },
};
