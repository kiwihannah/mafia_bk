const { User, Room } = require('../models');
const { ServiceAsyncWrapper } = require('../utils/wrapper');

module.exports = {
  create: {
    user: ServiceAsyncWrapper(async (data) => {
      const isNickname = await User.findOne({
        where: { nickname: data.nickname },
      });
      if (isNickname) {
        throw ({ msg: '이미 플레이 중인 닉네임 입니다.' });
      } else {
        const user = await User.create({
          nickname: data.nickname,
          isHost: 'N',
        });
        return user;
      }
    }),
  },

  update: {
    userEnter: async (data) => {
      console.log(`SerUoomId:${data.roomId} SerUserId: ${data.userId} SerRoomPwd: ${data.roomPwd}`);

      const prevUser = await User.findOne({ where: { id: data.userId } });
      const prevRoom = await Room.findOne({ where: { id: data.roomId } });

      if (
        prevRoom.length < 1 ||
        prevRoom.onPlay === 'Y' ||
        prevRoom.currPlayer === prevRoom.maxPlayer
      ) {
        return { msg: '이미 게임이 시작되었거나, 입장 불가능한 방입니다.' };
      } else {
        if (prevRoom.roomPwd !== data.roomPwd) {
          return { msg: '방 비밀번호가 일치하지 않습니다.' };
        } else {
          User.sequelize.query(
            `UPDATE rooms SET currPlayer = currPlayer + 1 WHERE id=${data.roomId};`,
            (err) => {
              if (err) throw err;
            }
          );
          console.log(prevUser);
          const user = await prevUser.update({ roomId: data.roomId });
          return user;
        }
      }
    },

    userOut: async (data) => {
      const prevUser = await User.findOne({ where: { id: data.userId } });
      const prevRoom = await Room.findOne({ where: { id: data.roomId } });

      if (prevRoom.currPlayer < 0) {
        await prevRoom.destroy({ where: { id: data.roomId } });
      } else {
        if (prevRoom.onPlay === 'Y') {
          return { msg: '게임이 시작되면 나갈 수 없습니다.' };
        } else {
          const user = await prevUser.update({ roomId: null });

          const nextHost = await User.findOne({
            where: { roomId: data.roomId },
            order: [['createdAt', 'ASC']],
          });

          if (prevUser.id === prevRoom.hostId) {
            await prevRoom.update({ hostId: nextHost.id });
          }

          User.sequelize.query(
            `UPDATE rooms SET currPlayer = currPlayer - 1 WHERE id=${data.roomId};`,
            (err) => {
              if (err) throw err;
            }
          );

          return user;
        }
      }
    },
  },

  get: {
    users: ServiceAsyncWrapper(async (data) => {
      const users = await User.findAll({ where: { roomId: data.roomId } });
      if(!users) throw ({ msg :'* 플레이어가 없는 방 입니다. *'});
      else return users;
    }),
  },

  delete: {
    user: ServiceAsyncWrapper(async (data) => {
      const user = await User.findAll({ where: { id: data.userId } });
      if(user.length < 1 ) throw ({ msg :'존재하지 않는 유저입니다.'});
      else await User.destroy({ where: { id: data.userId } });;
    }),
  },
  
};
