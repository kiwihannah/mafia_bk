const { Room, User } = require('../models');

module.exports = {
  create: {
    room: async (data) => {
      const { roomName, maxPlayer, hostId, roomPwd, onPlay, currPlayer } = data;
      const room = await Room.create({ roomName, maxPlayer, hostId, roomPwd, onPlay, currPlayer });
      return room.id;
    },
  },

  get: {
    rooms: async () => {
      const room = await Room.findAll({
        include: {
          model: User,
          attributes: ["id", "nickname"],
        },
        order: [["currPlayer", "DESC"], ["onPlay", "ASC"], ["roomPwd", "ASC"]],
      });

      return room;
    },
  },


};
