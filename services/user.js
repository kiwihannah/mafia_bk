const { User, Room } = require('../models');

module.exports = {
  create: {
    user: async (data) => {
      nickname = data.nickname;
      const user = await User.create({ nickname });
      return user;
    },
  },

  update: {
    userEnter: async (data) => {
      const prevUser = await User.findOne({ where: { id: data.userId } });
      const prevRoom = await Room.findOne({ where: { id: data.roomId } });

      if (!prevRoom || prevRoom.onPlay === 'Y' || prevRoom.currPlayer === prevRoom.maxPlayer) {
        return ({ msg: "이미 게임이 시작되었거나, 입장 불가능한 방입니다." }); 
      } else {
        if (prevRoom.roomPwd !== data.roomPwd) {
          return ({ msg: "방 비밀번호가 일치하지 않습니다." });
        } else {
          User.sequelize.query( 
            `UPDATE rooms SET currPlayer = currPlayer + 1 WHERE id=${data.roomId};`, 
            (err) => { if (err) throw err; } 
          );
          console.log(prevUser);
          const user = await prevUser.update({ roomId : data.roomId });
          return user;
        }
      }
    },

    userOut: async (data) => {
      const prevUser = await User.findOne({ where: { id: data.userId } });
      const prevRoom = await Room.findOne({ where: { id: data.roomId } });

      if (prevRoom.currPlayer < 0) {
        await prevRoom.destroy({ where: { id: data.roomId }, });
      } else {
        if (prevRoom.onPlay === 'Y') {
          return ({ msg: "게임이 시작되면 나갈 수 없습니다." }); 
        } else {
          User.sequelize.query( 
            `UPDATE rooms SET currPlayer = currPlayer - 1 WHERE id=${data.roomId};`, 
            (err) => { if (err) throw err; } 
          );
          const user = await prevUser.update({ roomId : null });
          return user;
        }
      }
    },

  },

  get : {
    users: async (data) => {
      const users = await User.findAll({ where: { roomId: data.roomId }, });
      return users.length >= 1 ? users : "잘못된 경로";
    }
  },

    
};
