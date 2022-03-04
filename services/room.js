const { Room } = require('../models');

module.exports = {
  create: {
    room: async (data) => {
      const { roomName, maxPlayer, hostName, roomPwd } = data;
      const room = await Room.create({ roomName, maxPlayer, hostName, roomPwd });
      return room.id;
    },
  },
};
