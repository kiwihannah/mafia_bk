const roomService = require('../services/room');

module.exports = {
  create: {
    room: async (req, res) => {
      const { roomName, maxPlayer, hostId, roomPwd, onPlay, currPlayer } = req.body;
      const room = await roomService.create.room({
        roomName,
        maxPlayer,
        hostId : 1,
        roomPwd,
        onPlay : 'N',
        currPlayer : 1,
      });
      return res.status(201).json({ room });
    },
  },
};
