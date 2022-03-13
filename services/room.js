const { Room, User, GameGroup, GameStatus } = require('../models');

module.exports = {
  create: {
    room: async (data) => {
      const { roomName, maxPlayer, roomPwd, onPlay, currPlayer, userId } = data;

      const prevUser = await User.findOne({ id : userId });

      if(!prevUser) {
        throw { msg :'존재하지 않는 유저입니다.' };
      } else {
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
          isHost : 'Y',
          roomId: room.id,
        });
       
        return room;
      }
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
