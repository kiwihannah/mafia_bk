const gameService = require('../services/game');

module.exports = {
  create: {
    readyGroup: async (req, res) => {
      const { roomId, userId } = req.params;
      await gameService.create.user({ roomId, userId });
      return res.status(201);
    },
  },

  
};
