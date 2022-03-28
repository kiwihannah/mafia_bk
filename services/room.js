const { Room, User, GameGroup, GameStatus } = require('../models');

module.exports = {
  create: {
    room: async (data) => {
      const { roomName, maxPlayer, roomPwd, onPlay, currPlayer, userId } = data;
      const prevUser = await User.findOne({ where: { id: userId } });

      if (!prevUser) {
        throw { msg: '존재하지 않는 유저입니다.' };
      } else {
        // 방 만들기
        const room = await Room.create({
          nickname: prevUser.nickname,
          roomName,
          maxPlayer,
          roomPwd,
          onPlay,
          currPlayer,
          userId,
        });

        // 유저 테이블에 방번호 입력
        User.sequelize.query(`UPDATE users SET roomId = ${room.id} WHERE id=${userId};`, (err) => {
          if (err) throw err;
        });

        // 방장 -> 자동 레디
        const gameGroup = await GameGroup.create({
          userId,
          nickname: prevUser.nickname,
          isReady: 'Y',
          role: null,
          isEliminated: 'N',
          isAi: 'N',
          isHost: 'Y',
          roomId: room.id,
        });

        // 유저 게임 그룹 테이블 연결
        User.sequelize.query(
          `UPDATE users SET gameGroupId = ${gameGroup.id} WHERE id=${data.userId};`,
          (err) => {
            if (err) throw err;
          }
        );

        return room;
      }
    },
  },

  get: {
    rooms: async (req, _) => {
      const room = await Room.findAll({
        include: {
          model: User,
          attributes: ['id', 'nickname'],
        },
        order: [['currPlayer', 'DESC']],
      });

      return room;
    },
  },
};
