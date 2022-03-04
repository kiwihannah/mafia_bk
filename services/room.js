const { Room } = require('../models');

module.exports = {
  create: {
    room: async (data) => {
      const { roomName, maxPlayer, hostId, roomPwd, onPlay, currPlayer } = data;
      const room = await Room.create({ roomName, maxPlayer, hostId, roomPwd, onPlay, currPlayer });
      return room.id;
    },
  },
};
