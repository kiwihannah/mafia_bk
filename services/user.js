const { User, Room } = require('../models');
const { ServiceAsyncWrapper } = require('../utils/wrapper');

module.exports = {
  create: {
    user: ServiceAsyncWrapper(async (data) => {
      const isNickname = await User.findOne({
        where: { nickname: data.nickname },
      });
      if (isNickname) {
        throw { msg: '이미 플레이 중인 닉네임 입니다.' };
      } else {
        const user = await User.create({
          nickname: data.nickname,
          isHost: 'N',
        });
        return user;
      }
    }),
  },

  delete: {
    user: ServiceAsyncWrapper(async (data) => {
      const user = await User.findOne({ where: { id: data.userId } });
      if (!user) throw { msg: '존재하지 않는 유저입니다.' };
      else await User.destroy({ where: { id: data.userId } });
    }),
  },
};
