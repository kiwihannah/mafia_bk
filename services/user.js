const { User, Log } = require('../models');
const { ServiceAsyncWrapper } = require('../utils/wrapper');
const date = new Date().toISOString().substring(0,10).replace(/-/g,'');

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

        // 유저 닉네임 생성 로그
        const prevLog = await Log.findOne({ where: { date } });
        if (prevLog) {
          prevLog.update({ nicknameCnt: prevLog.nicknameCnt + 1 });
        } else {
          await Log.create({
            date,
            nicknameCnt: 1,
            roomCnt: 0,
            onGameCnt: 0,
            compGameCnt: 0,
            playMemCnt: 0,
          });
        }

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
