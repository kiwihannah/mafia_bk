const { Room, User, GameGroup, Log } = require('../models');
const date = new Date().toISOString().substring(0,10).replace(/-/g,'');

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
          isEliminated: 'N0',
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

        // 게임 방 개설 로그
        const prevLog = await Log.findOne({ where: { date } });
        if (prevLog) {
          prevLog.update({ 
            roomCnt: prevLog.roomCnt + 1, 
            playMemCnt: prevLog.playMemCnt +maxPlayer 
          });
        } else {
          await Log.create({
            date,
            nicknameCnt: 0,
            roomCnt: 1,
            onGameCnt: 0,
            compGameCnt: 0,
            playMemCnt: maxPlayer,
          });
        }

        return room;
      }
    },
  },

  get: {
    rooms: async (data) => {
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
