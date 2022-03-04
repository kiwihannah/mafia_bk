const roomService = require('../services/room');

module.exports = {
  create: {
    room: async (req, res) => {
      const { roomName, maxPlayer, hostName, roomPwd } = req.body;
      const room = await roomService.create.room({
        roomName,
        maxPlayer,
        hostName,
        roomPwd,
      });
      return res.status(201).json({ room });
    },
  },
};
