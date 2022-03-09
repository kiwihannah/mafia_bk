const { User, Room, GameGroup, GameResult } = require('../models');
const Roles = [
  ['사원', '사원', '사원', '스파이', '스파이', '변호사'], //6
  ['사원', '사원', '사원', '스파이', '스파이', '변호사', '탐정'], //7
  ['사원', '사원', '사원', '사원', '스파이', '스파이', '변호사', '탐정'], //8
  ['사원', '사원', '사원', '사원', '스파이', '스파이', '스파이', '변호사', '탐정'], //9
  ['사원', '사원', '사원', '사원', '사원', '스파이', '스파이', '스파이', '변호사', '탐정'], //10
];

module.exports = {
  create: {
    readyGroup: async (data) => { 
      const gameGroup = await GameGroup.create({
        isReady : 'Y',
        userId: data.userId,
        role: null,
        isEliminated: 'N',
        isAi : 'N',
        isHost : 'N'
      });
      return gameGroup;
    },
  },

  put: {
    getStart: async (data) => {
      const prevRoom = await Room.findAll({ where: { id: data.roomId } });
      const prevGameGroup = await GameGroup.findAll({ 
        where: { 
          roomId: data.roomId,
          isReady: 'Y' 
        } 
      });
      if (data.roomId === prevRoom.id) {
        if (prevGameGroup.length === prevRoom.currPlayer) {
          await prevRoom.update({ onPlay : 'Y' });
          if (prevRoom.currPlayer !== prevRoom.maxPlayer) {
            for (let i=0; i<prevRoom.maxPlayer-prevRoom.currPlayer; i++) {
               
            }
          }
        } else {
          return '모두 준비가 완료되지 않았습니다.';
        }
      } else {
        return '권한이 없습니다.';
      }
    },

    giveRole: async (data) => {
      const prevRoom = await Room.findAll({ where: { id: data.roomId } });
      const prevGameGroup = await GameGroup.findAll({ where: { roomId: data.roomId } });
      const max = prevRoom.mexPlayer;
      let tempRole = [];

      for (let i=0; i<Roles.length; i++) {
        let ranNum = Math.floor(Math.random() * max);
        if (Roles[i].length === max) {
          tempRole.push(Roles[i][ranNum]);
        }
      }
      
      // 랜덤 업데이트
      // for (let role in tempRole) {
      //   const gameGroup = await prevGameGroup.update({ role },{ where : { id : 1 }});
      // }

    },

    fire: async (data) => {
      const prevGameGroup = await GameGroup.findAll({ where: { userId: data.userId } });
      const prevUser = await User.findAll({ where: { id: data.userId } });

      await prevGameGroup.update({ isEliminated: 'Y' });
      return `선량한 시민 [ ${prevUser.nickname} ] (이)가 간 밤에 해고당했습니다.`
    },

    vote: async (data) => {
      const gameGroup = await GameGroup.create({
        isReady : 'Y',
        userId: data.userId,
        role: null,
        isEliminated: 'N',
        isAi : 'N',
        isHost : 'N'
      });
    },

    // 두번째 라운드 부터 낮이 밝기 전에 실행
    isResult: async (data) => {
      const prevGameResult = await GameResult.findAll({ where: { roomId: data.roomId } });

      // 2: spy sin, 1: empl win
      if (prevGameResult.emplCnt <= prevGameResult.spyCnt) return 2;
      if (prevGameResult.spyCnt === 0) return 1;
    },
  },

  delete: {
    playerOut: async (data) => {

    }
  }


};
