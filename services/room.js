const { Room, User } = require('../models');

module.exports = {
  create: {
    room: async (data) => {
      const { roomName, maxPlayer, roomPwd, onPlay, currPlayer, userId } = data;

      const room = await Room.create({
        roomName,
        maxPlayer,
        roomPwd,
        onPlay,
        currPlayer,
      });
      
      const prevRoomId = await Room.findOne({ order: [['createdAt', 'DESC']] });
      User.sequelize.query(
        `UPDATE users SET roomId = ${prevRoomId.id} WHERE id=${userId};`,
        (err) => { if (err) throw err; }
      );

      return room.id;
    },
  },

  get: {
    rooms: async () => {
      const room = await Room.findAll({
        include: {
          model: User,
          attributes: ['id', 'nickname'],
        },
        order: [
          ['currPlayer', 'DESC'],
          ['onPlay', 'ASC'],
          ['roomPwd', 'ASC'],
        ],
      });

      return room;
    },
  },
};
