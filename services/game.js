const { User, Room, GameGroup, GameStatus, Vote, Log } = require('../models');
const { ServiceAsyncWrapper } = require('../utils/wrapper');
const { IsLaywerDone, IsSpyDone, IsResult, SelectOneUser, IsAlive, IsHost } = require('../utils/gameFunc');
const { Op } = require('sequelize');

const moment = require('moment');
const today = moment();
const date = today.format('YYYYMMDD');

module.exports = {
  entryAndExit: {
    enterRoom: ServiceAsyncWrapper(async (data) => {
      const { userId, roomId, roomPwd } = data;
      const prevUser = await User.findOne({ where: { id: userId } });
      const prevRoom = await Room.findOne({ where: { id: roomId } });
      const idDupUser = await GameGroup.findOne({ where: { userId } });

      if (!prevUser || idDupUser) {
        throw { msg: '방에 진입할 수 없는 유저 입니다.' };

      } else if (
        !prevRoom ||
        prevRoom.onPlay === 'Y' ||
        prevRoom.currPlayer === prevRoom.maxPlayer
      ) {
        throw { msg: '이미 게임이 시작되었거나, 입장 불가능한 방입니다.' };

      } else {
        if (prevRoom.roomPwd !== roomPwd) {
          throw { msg: '방 비밀번호가 일치하지 않습니다.' };
        } else {
          await prevRoom.update({ currPlayer: prevRoom.currPlayer +1 });
          const gameGroup = await GameGroup.create({
            userId,
            nickname: prevUser.nickname,
            isReady: 'N',
            role: null,
            isEliminated: 'N0',
            isAi: 'N',
            isHost: 'N',
            roomId,
          });

          await prevUser.update({ roomId, gameGroupId: gameGroup.id });
          return gameGroup.userId;
        }
      }
    }),

    // 방 나가기
    exitRoom: ServiceAsyncWrapper(async (data) => {
      const { userId, roomId } = data;
      const prevUser = await User.findOne({ where: { id: userId } });
      const prevGameGroup = await GameGroup.findOne({ where: { userId } });
      const prevRoom = await Room.findOne({ where: { id: roomId } });

      if (!prevUser || !prevGameGroup) {
        throw { msg: '존재하지 않는 유저입니다.' };

      } else if (!prevRoom) {
        throw { msg: '존재하지 않는 방입니다.' };

      } else if (prevRoom.onPlay === 'Y') {
        throw { msg: '게임이 시작되면 나갈 수 없습니다.' };

      } else {
        const user = await prevUser.update({ roomId: null }); 
        await GameGroup.destroy({ where: { userId } }); 
        const nextHost = await GameGroup.findOne({
          where: { roomId },
          order: [['createdAt', 'ASC']],
        });
        if (nextHost && prevGameGroup.isHost === 'Y') await nextHost.update({ isHost: 'Y', isReady: 'Y' });

        await prevRoom.update({ currPlayer: prevRoom.currPlayer -1 });
        const afterRoom = await Room.findOne({ where: { id: roomId } });

        if (afterRoom.currPlayer === 0) await afterRoom.destroy();

        return user.id;
      }
    }),
  },

  create: {
    aiPlayer: ServiceAsyncWrapper(async (data) => {
      const { roomId } = data;
      const prevRoom = await Room.findOne({ where: { id: roomId } });
      const prevGameGroup = await GameGroup.findAll({ where: { roomId } });

      if (!prevRoom || !prevGameGroup) {
        throw { msg: '게임 할 방이 삭제되었거나, 유저가 없습니다.' };
      } else {
        const gap = prevRoom.maxPlayer - prevGameGroup.length;

        for (let i = 1; i <= gap; i++) {
          const aiUser = await User.create({
            nickname: `AI_${roomId}_${i}`,
            roomId,
          });

          let gameGroup = await GameGroup.create({
            userId: aiUser.id,
            nickname: `AI_${roomId}_${i}`,
            isReady: 'Y',
            role: null,
            isEliminated: 'N0',
            isAi: 'Y',
            isHost: 'N',
            roomId,
          });
          await aiUser.update({ gameGroupId: gameGroup.id });
        }

        const users = await GameGroup.findAll({ where: { roomId } });
        return users;
      }
    }),
  },

  update: {
    changeMaxPlayer: ServiceAsyncWrapper(async (data) => {
      if (data.maxPlayer < 6) {
        throw {
          msg: `바꾸려는 인원이 최소인원을 충족하지 못했습니다.\n( 최소인원 : 6 )`,
        };
      } else {
        const prevRoom = await Room.findOne({ where: { id: data.roomId } });
        const room = await prevRoom.update({ maxPlayer: data.maxPlayer });
        return room;
      }
    }),
  },

  sendMsg: {
    start: ServiceAsyncWrapper(async (data) => {
      const { userId, roomId } = data;
      const prevRoom = await Room.findOne({ where: { id: roomId } });
      const prevGameStatus = await GameStatus.findOne({ where: { roomId } });
      const prevGameGroup = await GameGroup.findAll({
        where: {
          roomId,
          isReady: 'Y',
          isAi: 'N',
        },
      });
      const isHost = await GameGroup.findOne({ where: { userId } });

      if (!prevRoom || !isHost) {
        throw { msg: '방이나 유저의 정보가 존재하지 않습니다.' };

      } else {
        if (isHost.isHost !== 'Y') {
          throw { msg: '권한이 없습니다.' };
        } else {
          if (prevGameGroup.length !== prevRoom.currPlayer) {
            throw { msg: '모두 준비가 완료되지 않았습니다.' };
          } else {
            if (!prevGameStatus) {
              await GameStatus.create({
                roundNo: 1,
                isResult: 0,
                status: 'isStart',
                roomId: data.roomId,
              });
            } else {
              await prevGameStatus.update({ status: 'isStart' });
            }

            return prevRoom.currPlayer < prevRoom.maxPlayer
              ? `부족한 인원은 인공지능 플레이어로 대체합니다.
              \n미리 말씀드리자면, 인공지능은 상당히 멍청합니다.`
              : '시작!';
          }
        }
      }
    }),
  },

  start: {
    game: ServiceAsyncWrapper(async (data) => {
      const { roomId } = data;
      const status = await GameStatus.findOne({ where: { roomId } });

      const prevRoom = await Room.findOne({ where: { id: roomId } });
      const room = await prevRoom.update({ onPlay: 'Y' });

      await status.update({
        msg: '게임이 시작되었습니다.\n게임 시작 후, 퇴장이 불가합니다.',
      });

      // 게임 방 개설 로그
      const prevLog = await Log.findOne({ where: { date } });
      if (prevLog) prevLog.update({ onGameCnt: prevLog.onGameCnt +1 });

      return room;
    }),
  },

  gamePlay: {
    giveRole: ServiceAsyncWrapper(async (data) => {
      const { roomId } = data;
      const prevGameGroup = await GameGroup.findAll({ where: { roomId } });
      const status = await GameStatus.findOne({ where: { roomId } });

      const tempRoleArr = [];
      // [{ 1: 'employee' },  { 2: 'lawyer' },  { 3: 'detective' },  { 4: 'spy' }]
      switch (prevGameGroup.length) {
        case 6: 
          tempRoleArr.push(1, 1, 2, 3, 4, 4);
          break;
        case 7:
          tempRoleArr.push(1, 1, 1, 2, 3, 4, 4);
          break;
        case 8: 
          tempRoleArr.push(1, 1, 1, 1, 2, 3, 4, 4);
          break;
        case 9: 
          tempRoleArr.push(1, 1, 1, 1, 2, 3, 4, 4, 4);
          break;
        case 10: 
          tempRoleArr.push(1, 1, 1, 1, 1, 2, 3, 4, 4, 4);
          break;
        default: // for testing
          tempRoleArr.push(1, 2, 3, 4);
      }

      const roleArr = tempRoleArr.sort(() => Math.random() - 0.5);

      for (let i = 0; i < roleArr.length; i++) {
        const updateUser = await GameGroup.findOne({
          where: { role: null, roomId },
          order: [['createdAt', 'DESC']],
        });

        if (!updateUser || !status) {
          throw {
            msg: '이미 유저에게 직업이 부여 되었거나, 게임정보를 불러오는데 실패 했습니다.',
          };
        } else {
          await updateUser.update({ role: roleArr[i] });
        }
      }

      const users = await GameGroup.findAll({ where: { roomId } });
      return users;
    }),

    aiLawyerAct: ServiceAsyncWrapper(async (data) => {
      const { roomId } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });
      
      const isAiLawyer = await IsAlive(roomId, 'Y', 2); // isAi = Y or N
      const isSelectedUser = await SelectOneUser(roomId);
      const isAlreadyProtected = await IsLaywerDone(roomId);

      let msg = '';
      if (isSelectedUser && isAiLawyer && !isAlreadyProtected) {
        const protectedUser = await isSelectedUser.update({ isProtected: `Y${prevStatus.roundNo}` });
        msg = `[ ${protectedUser.nickname} ] (이)를 스파이로 부터 1회 보호합니다.`;
      } else {
        throw { msg: '잘못된 정보로 요청 했습니다.' };
      }
      return msg;
    }),

    aiSpyAct: ServiceAsyncWrapper(async (data) => {
      const { roomId } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });

      const isAiSpy = await IsAlive(roomId, 'Y', 4);
      const isPlayerSpy = await IsAlive(roomId, 'N', 4);
      const isAlreadyEliminated = await IsSpyDone(roomId);
      const prevUser = await SelectOneUser(roomId);

      let msg = '';
      if (isAiSpy && !isPlayerSpy && prevUser && !isAlreadyEliminated) {
        if (prevUser.isProtected === `Y${prevStatus.roundNo}`) {
          const savedUser = await prevUser.update({
            isProtected: `N${prevStatus.roundNo}`,
            isEliminated: `N${prevStatus.roundNo}`,
          });
          msg = `현명한 변호사가 일개미 [ ${savedUser.nickname} ] (이)의 부당 해고를 막았습니다.`;
        } else {
          const firedUser = await prevUser.update({ isEliminated: `Y${prevStatus.roundNo}` });
          msg = `스파이에 의해, 성실한 일개미 [ ${firedUser.nickname} ] (이)가 간 밤에 해고 당했습니다.`;
        }
        await prevStatus.update({ msg });
      } else {
        throw { msg: '잘못된 정보로 요청 했습니다.' };
      }

      return msg;
    }),

    lawyerAct: ServiceAsyncWrapper(async (data) => {
      const { userId, roomId } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });

      const isLawyer = await IsAlive(roomId, 'N', 2);
      const isAlreadyProtected = await IsLaywerDone(roomId);
      const prevUser = await SelectOneUser(roomId, userId);

      let msg = '';
      if (prevUser && isLawyer && !isAlreadyProtected) {
        const protectedUser = await prevUser.update({ isProtected: `Y${prevStatus.roundNo}` });
        msg = `[ ${protectedUser.nickname} ] (이)를 스파이로 부터 1회 보호합니다.`;
        
      } else {
        throw { msg: '잘못된 정보로 요청 했습니다.' };
      }

      return msg;
    }),

    detectiveAct: ServiceAsyncWrapper(async (data) => {
      const { userId, roomId } = data;
      const selectedUser = await GameGroup.findOne({
        where: {
          roomId,
          userId,
          isEliminated: { [Op.like]: 'N%' },
        },
      });
      const isDetectiveAlive = await IsAlive(roomId, 'N', 3);

      if (!selectedUser || !isDetectiveAlive) {
        throw { msg: '잘못된 정보로 요청 했습니다.' };

      } else {
        const msg =
          selectedUser.role === 4
            ? `[ ${selectedUser.nickname} ] (은)는 스파이 입니다.`
            : `[ ${selectedUser.nickname} ] (은)는 스파이가 아닙니다.`;

        return msg;
      }
    }),

    spyAct: ServiceAsyncWrapper(async (data) => {
      const { userId, roomId } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });

      const isSpyAlive = await IsAlive(roomId, 'N', 4);
      const prevUser = await SelectOneUser(roomId, userId);
      const isAlreadyEliminated = await IsSpyDone(roomId);

      let msg = '';
      if (prevUser && isSpyAlive && !isAlreadyEliminated) {
        if (prevUser.isProtected === `Y${prevStatus.roundNo}`) {
          const firedUser = await prevUser.update({
            isProtected: `N${prevStatus.roundNo}`,
            isEliminated: `N${prevStatus.roundNo}`,
          });
          msg = `현명한 변호사가 일개미 [ ${firedUser.nickname} ] (이)의 부당 해고를 막았습니다.`;
        } else {
          const firedUser = await prevUser.update({ isEliminated: `Y${prevStatus.roundNo}` });
          msg = `스파이에 의해, 성실한 일개미 [ ${firedUser.nickname} ] (이)가 간 밤에 해고 당했습니다.`;
        }
        await prevStatus.update({ msg });

      } else {
        throw { msg: '잘못된 정보로 요청 했습니다.' };
      }

      return msg;
    }),

    // 프론트 확인용
    isZeroVote: ServiceAsyncWrapper(async (data) => {
      const { roomId } = data;
      const isVote = await Vote.findAll({ where: { roomId } });
      
      return isVote.length > 0 ? true : false;
    }),

    invalidAndAiVote: ServiceAsyncWrapper(async (data) => {
      const { roomId, roundNo, userId } = data;

      const prevAiGroup = await GameGroup.findAll({
        where: {
          roomId,
          isAi: 'Y',
          isEliminated: { [Op.like]: 'N%' },
        },
      });
      const prevGameGroup = await GameGroup.findAll({
        where: { roomId, isEliminated: { [Op.like]: 'N%' } },
      });
      const host = await GameGroup.findOne({ where: { userId } });

      const userArr = [],
        aiArr = [];
      if (host.isHost === 'Y') {
        prevGameGroup.map((user) => { userArr.push(user.userId); });
        prevAiGroup.map((ai) => { aiArr.push(ai.userId); });

        let ranNum = 0;
        for (let i = 0; i < prevAiGroup.length; i++) {
          ranNum = Math.floor(Math.random() * userArr.length);
          await Vote.create({
            voter: aiArr[i],
            candidacy: userArr[ranNum],
            roomId: roomId,
            roundNo: roundNo,
            gameStatus: 0,
          });
        }

        const prevVote = await Vote.findAll({ where: { roomId, roundNo } });
        if ((prevVote.length || 0) !== prevGameGroup.length) {
          for (let i = 0; i < prevGameGroup.length - (prevVote.length || 0); i++) {
            await Vote.create({
              voter: 0,
              candidacy: 0,
              roomId: roomId,
              roundNo: roundNo,
              gameStatus: 0,
            });
          }
        }

        // 프론트 확인용
        return `${prevGameGroup.length - prevVote.length} 개의 무효표 처리가 완료되었습니다.
        \n${prevAiGroup.length} 명의 ai가 투표를 완료 했습니다.`;

      } else {
        throw { msg: '방장이 아닌 유저는 요청할 수 없습니다.' };
      }
    }),

    getVoteResult: ServiceAsyncWrapper(async (data) => {
      const { roomId, roundNo } = data;
      const prevVote = await Vote.findAll({ where: { roomId, roundNo } });
      const prevStatus = await GameStatus.findOne({ where: { roomId } });

      if (!prevVote) {
        throw { msg: '투표 정보가 존재하지 않습니다.' };
      } else {
        let tempVoteArr = [];
        for (let i = 0; i < prevVote.length; i++) {
          const votes = await Vote.findOne({
            where: { roomId, roundNo },
            order: [['createdAt', 'DESC']],
          });
          tempVoteArr.push(votes.candidacy);
          await Vote.destroy({ where: { id: votes.id } });
        }

        await Vote.destroy({ where: { voter: 0 } });

        let result = {};
        tempVoteArr.forEach((vote) => {
          result[vote] = (result[vote] || 0) + 1;
        });
        let sorted = Object.entries(result).sort((a, b) => b[1] - a[1]);
        const selectedUser = await GameGroup.findOne({ where: { userId: Number(sorted[0][0]) } });

        let msg = '';
        if (sorted[0][0] === '0') {
          msg = '무효표가 가장 많습니다. 아무도 해고당하지 않았습니다.'
          await prevStatus.update({ msg });
          return { msg, result: 0 };

        } else if (sorted[0][1] === sorted[1][1]) {
          msg = '동표입니다. 아무도 해고당하지 않았습니다.'
          await prevStatus.update({ msg });
          return { msg, result: 0 };

        } else {
          const isResult = await IsResult(roomId);
          await prevStatus.update({ isResult });

          msg =
            selectedUser.role === 4
              ? `사원 투표로 인해, 산업 스파이 [ ${selectedUser.nickname} ] (이)가 붙잡혔습니다.`
              : `사원 투표로 인해, 성실한 일개미 [ ${selectedUser.nickname} ] (이)가 해고 당했습니다.`;
          await selectedUser.update({ msg, isEliminated: 'YD' });

          return { msg, isResult };
        }
      }
    }),
  },

  getGame: {
    result: ServiceAsyncWrapper(async (data) => {
      const { roomId, userId } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });
      const prevRoom = await Room.findOne({ where: { id: roomId } });
      const isHost = await IsHost(userId)

      if (!prevStatus) {
        throw { msg: '정보가 저장되지 않아, 게임 스테이지를 불러오지 못했습니다.' };

      } else {
        const isResult = await IsResult(roomId);
        let onPlay = 'N';

        if (isResult === 0 && isHost) { 
          const nextRoundNo = prevStatus.roundNo + 1;
          await prevStatus.update({ roundNo: nextRoundNo });
          onPlay = 'Y';
        }

        await prevStatus.update({ isResult });
        await prevRoom.update({ onPlay });

        return isResult;
      }
    }),

    roundNo: ServiceAsyncWrapper(async (data) => {
      const { roomId } = data;
      const game = await GameStatus.findOne({ where: { roomId } });
      if (!game) throw { msg: '게임 정보가 존재하지 않습니다.' };
      else return game.roundNo;
    }),

    users: ServiceAsyncWrapper(async (data) => {
      const users = await GameGroup.findAll({
        where: { roomId: data.roomId },
        include: {
          model: User,
          attributes: ['id', 'nickname'],
        },
      });
      if (!users) throw { msg: '방에 입장한 유저가 없습니다.' };
      else return users;
    }),

    winner: ServiceAsyncWrapper(async (data) => {
      const { roomId, userId } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });
      const spyGroup = await GameGroup.findAll({ where: { roomId, role: 4 } });
      const emplGroup = await GameGroup.findAll({
        where: { roomId, role: { [Op.ne]: 4 } },
      });

      const winnerArr = [];
      if (prevStatus.isResult === 2) winnerArr.push(spyGroup);
      if (prevStatus.isResult === 1) winnerArr.push(emplGroup);

      return winnerArr[0];
    }),

    // 프론트 확인용
    userInfo: ServiceAsyncWrapper(async (data) => {
      const { roomId, userId } = data;
      const userInfo = await GameGroup.findOne({ where: { roomId, userId } });

      if (!userInfo) throw { msg: '존재하지 않는 유저입니다.' };
      else return userInfo;
    }),

  },

  delete: {
    game: ServiceAsyncWrapper(async (data) => {
      const { roomId } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });

      if (prevStatus || prevStatus.isResult !== 0) {
        // 게임 완료 로그
        const prevLog = await Log.findOne({ where: { date } });
        if (prevLog) prevLog.update({ compGameCnt: prevLog.compGameCnt +1 });

        // 게임 데이터 삭제
        await User.update(
          { roomId: null },
          { where: { roomId } },
        );
        await User.destroy({
          where: { nickname: { [Op.like]: `AI_${roomId}%` } },
        });
        await GameGroup.destroy({ where: { roomId } });
        await Vote.destroy({ where: { roomId } });
        await GameStatus.destroy({ where: { roomId } });
        await Room.destroy({ where: { id: roomId } });
      } else {
        throw { msg : '이미 존재하지 않는 게임입니다.' };
      }
    }),
  },

};