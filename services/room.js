const { Room, User, GameGroup, GameStatus } = require('../models');

module.exports = {
  create: {
    room: async (data) => {
      const { roomName, maxPlayer, roomPwd, onPlay, currPlayer, userId } = data;

      // 방 만들기
      const room = await Room.create({
        roomName,
        maxPlayer,
        roomPwd,
        onPlay,
        currPlayer
      });
      
      // 유저 테이블에 방번호 입력
      const prevRoomId = await Room.findOne({ order: [['createdAt', 'DESC']] });
      User.sequelize.query(
        `UPDATE users SET roomId = ${prevRoomId.id} WHERE id=${userId};`,
        (err) => { if (err) throw err; }
      );

      // 방장 -> 자동 레디
      await GameGroup.create({
        isReady : 'Y',
        userId: data.userId,
        role: null,
        isEliminated: 'N',
        isAi : 'N',
        isHost : 'Y'
      });

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
        ],
      });

      return room;
    },
  },
};
