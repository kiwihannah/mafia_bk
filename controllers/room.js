const roomService = require('../services/room');

module.exports = {
  create: {
    room: async (req, res) => {
      const { roomName, maxPlayer, roomPwd } = req.body;
      const { userId } = req.params;
      const room = await roomService.create.room({
        roomName,
        maxPlayer,
        roomPwd,
        onPlay: 'N',
        currPlayer: 1,
        userId
      });
      return res.status(201).json({ room });
    },
  },

  get: {
    rooms: async (_, res) => {
      const rooms = await roomService.get.rooms({});
      return res.status(200).json({ rooms });
    },
  },
};
