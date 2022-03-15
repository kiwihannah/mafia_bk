const { User, Room, GameGroup, GameStatus, Vote } = require('../models');
const { ServiceAsyncWrapper } = require('../utils/wrapper');

// 사용하지 않는 role 배열, 보여주기 용
const Roles = [
  { 1: 'employee' },
  { 2: 'lawyer' },
  { 3: 'detective' },
  { 4: 'spy' },
];

module.exports = {
  entryAndExit: {
    // 방 입장
    enterRoom: ServiceAsyncWrapper(async (data) => {
      const prevUser = await User.findOne({ where: { id: data.userId } });
      const prevRoom = await Room.findOne({ where: { id: data.roomId } });

      if (!prevUser) {
        // 유저 예외처리
        throw { msg: '게임을 시작하기 전 닉네임을 지정해야 합니다.' };
      } else if (
        // 방 정보 예외처리
        !prevRoom ||
        prevRoom.onPlay === 'Y' ||
        prevRoom.currPlayer === prevRoom.maxPlayer
      ) {
        throw { msg: '이미 게임이 시작되었거나, 입장 불가능한 방입니다.' };
      } else {
        // 입장 직전 예외처리
        if (prevRoom.roomPwd !== data.roomPwd) {
          throw { msg: '방 비밀번호가 일치하지 않습니다.' };
        } else {
          // 방 입장 로직 : 현재 인원 1++, 유저 리스트에 추가
          User.sequelize.query(
            `UPDATE rooms SET currPlayer = currPlayer + 1 WHERE id=${data.roomId};`,
            (err) => {
              if (err) throw err;
            }
          );

          await prevUser.update({ roomId: data.roomId });

          const gameGroup = await GameGroup.create({
            userId: data.userId,
            isReady: 'N',
            role: null,
            isEliminated: 'N',
            isAi: 'N',
            isHost: 'N',
            roomId: data.roomId,
          });

          // 유저 게임 그룹 테이블 연결
          User.sequelize.query(
            `UPDATE users SET gameGroupId = ${gameGroup.id} WHERE id=${data.userId};`,
            (err) => {
              if (err) throw err;
            }
          );

          // 유저 리스트 반환
          return gameGroup.userId;
        }
      }
    }),

    // 방 나가기
    exitRoom: ServiceAsyncWrapper(async (data) => {
      const prevUser = await User.findOne({ where: { id: data.userId } });
      const prevRoom = await Room.findOne({ where: { id: data.roomId } });

      if (!prevUser) {
        // 유저 예외 처리
        throw { msg: '존재하지 않는 유저입니다.' };
      } else if (!prevRoom) {
        // 방 예외 처리
        throw { msg: '존재하지 않는 방입니다.' };
      } else if (prevRoom.onPlay === 'Y') {
        // 게임 예외 처리
        throw { msg: '게임이 시작되면 나갈 수 없습니다.' };
      } else {
        // 방 나가기 로직
        const user = await prevUser.update({ roomId: null }); // 유저 테이블 유지
        await GameGroup.destroy({ where: { userId: data.userId } }); // 게임 그룹 테이블 삭제

        // 방장이 나가면 두번째로 오래된 멤버가 방장
        const nextHost = await User.findOne({
          where: { roomId: data.roomId },
          order: [['createdAt', 'ASC']],
        });
        if (prevUser.id === prevRoom.hostId) {
          await prevRoom.update({ hostId: nextHost.id });
        }

        // 현재 인원 1--
        User.sequelize.query(
          `UPDATE rooms SET currPlayer = currPlayer - 1 WHERE id=${data.roomId};`,
          (err) => {
            if (err) throw err;
          }
        );

        // 현재인원 < 0 방 자동 삭제
        const afterRoom = await Room.findOne({ where: { id: data.roomId } });
        if (afterRoom.currPlayer === 0) {
          await afterRoom.destroy({ where: { id: data.roomId } });
        }

        return user.id;
      }
    }),
  },

  create: {
    // 레디 하기
    readyGroup: ServiceAsyncWrapper(async (data) => {
      const prevGameGroupUser = await GameGroup.findOne({
        where: { userId: data.userId },
      });

      if (!prevGameGroupUser) {
        throw { msg: '존재하지 않는 유저입니다.' };
      } else {
        const gameGroup = await prevGameGroupUser.update({ isReady: 'Y' });
        return gameGroup.userId;
      }
    }),

    // 부족 인원 ai로 채우기
    aiPlayer: ServiceAsyncWrapper(async (data) => {
      const prevRoom = await Room.findAll({ where: { id: data.roomId } });
      const prevGameGroup = await GameGroup.findAll({
        where: { roomId: data.roomId },
      });

      if (!prevRoom || !prevGameGroup) {
        throw { msg: '게임 할 방이 삭제되었거나, 유저가 없습니다.' };
      } else {
        const gap = prevRoom.maxPlayer - prevGameGroup.length;

        while (--gap) {
          await GameGroup.create({
            isReady: 'Y',
            userId: 0,
            role: null,
            isEliminated: 'N',
            isAi: 'Y',
            isHost: 'N',
          });
          if (gap === 0) break;
        }
      }
    }),
  },

  cancel: {
    // 레디 취소 하기
    ready: ServiceAsyncWrapper(async (data) => {
      const prevGameGroup = await GameGroup.findOne({
        where: { userId: data.userId },
      });

      console.log(prevGameGroup);

      if (!prevGameGroup) {
        throw { msg: '존재하지 않는 유저입니다.' };
      } else {
        const gameGroup = await prevGameGroup.update({ isReady: 'N' });
        return gameGroup.userId;
      }
    }),
  },

  start: {
    // 게임 시작하기
    game: ServiceAsyncWrapper(async (data) => {
      const prevRoom = await Room.findOne({ where: { id: data.roomId } });
      const prevGameGroup = await GameGroup.findAll({
        where: {
          roomId: data.roomId,
          isReady: 'Y',
        },
      });
      const isHost = await GameGroup.findOne({
        where: { userId: data.userId },
      });

      if (!prevRoom) {
        throw { msg: '방이 존재하지 않습니다.' };
      } else {
        if (isHost.isHost !== 'Y') {
          throw { msg: '권한이 없습니다.' };
        } else {
          if (prevGameGroup.length !== prevRoom.currPlayer) {
            throw { msg: '모두 준비가 완료되지 않았습니다.' };
          } else {
            // 게임 시작 상태로 돌림
            await prevRoom.update({ onPlay: 'Y' });

            // status 생성
            await GameStatus.create({
              roundNo: 1,
              isResult: 0,
              roomId: data.roomId,
            });

            // ai 사용 여부
            return prevRoom.currPlayer < prevRoom.maxPlayer
              ? `부족한 인원은 인공지능 플레이어로 대체 하시겠습니까?\n미리 말씀드리자면, 인공지능은 상당히 멍청합니다.`
              : '시작!';
          }
        }
      }
    }),
  },

  update: {
    // 부족한 인원 인공지능으로 시작X , 현재인원 6명 이상인 경우 -> 방 인원 설정 변경
    changeMaxPlayer: ServiceAsyncWrapper(async (data) => {
      if (data.maxPlayer < 6) {
        throw {
          msg: '바꾸려는 인원이 최소인원을 충족하지 못했습니다.\n( 최소인원 : 6 )',
        };
      } else {
        const prevRoom = await Room.findOne({ where: { id: data.roomId } });
        const room = await prevRoom.update({ maxPlayer: data.maxPlayer });
        return room;
      }
    }),
  },

  gamePlay: {
    // 랜덤으로 역할 분담 AI 플레이어 포함
    giveRole: ServiceAsyncWrapper(async (data) => {
      const prevGameGroup = await GameGroup.findAll({
        where: { roomId: data.roomId },
      });

      // 시작 시, maxPlayer 에 맞춰 aiPlayer를 삽입 함
      const maxPlayer = prevGameGroup.length;
      let tempRoleArr;

      // [{ 1: 'employee' },  { 2: 'lawyer' },  { 3: 'detective' },  { 4: 'spy' }]
      switch (maxPlayer) {
        case 6: // 사원3, 변호사1, 스파이2
          tempRoleArr = new Array(1, 1, 1, 2, 4, 4);
          break;
        case 7: // 사원3, 탐정1, 변호사1, 스파이2
          tempRoleArr = new Array(1, 1, 1, 2, 3, 4, 4);
          break;
        case 8: // 사원4, 탐정1, 변호사1, 스파이2
          tempRoleArr = new Array(1, 1, 1, 1, 2, 3, 4, 4);
          break;
        case 9: // 사원4, 탐정1, 변호사1, 스파이3
          tempRoleArr = new Array(1, 1, 1, 1, 2, 3, 4, 4, 4);
          break;
        case 10: // 사원5, 탐정, 변호사1, 스파이3
          tempRoleArr = new Array(1, 1, 1, 1, 1, 2, 3, 4, 4, 4);
          break;
      }

      // 조건절용 userId 배열 지정
      let tempUserIdArr = new Array(maxPlayer);
      for (let userId of prevGameGroup.userId) {
        tempUserIdArr.push(userId);
      }

      // 미리 만든 tempRole 배열 크기를 이용해
      for (let i = 0; i < tempRoleArr.length; i++) {
        let ranNum = Math.floor(Math.random() * tempRoleArr.length); // floor 해서 인덱스 값에 맞음
        let tempGameGroupUser = await GameGroup.findOne({
          userId: tempUserIdArr[i],
        });
        await tempGameGroupUser.update({ role: tempRoleArr[ranNum] }); //1, 2, 3, 4 입력
        tempRoleArr.pop(ranNum);
      }
    }),

    // 의사 기능 -> 마피아에게 죽을 것 같은 사람 1회 방어
    lawyerAct: ServiceAsyncWrapper(async (data) => {
      const prevGameGroup = await GameGroup.findAll({
        where: { userId: data.userId },
      });
      const prevUser = await User.findAll({ where: { id: data.userId } });

      if (!prevGameGroup) {
        throw { msg: '존재하지 않는 유저입니다.' };
      } else {
        await prevGameGroup.update({ isProtected: 'Y' });
        return {
          msg: `[ ${prevUser.nickname} ] (이)를 스파이로 부터 1회 보호합니다.`,
        };
      }
    }),

    // 경찰 기능 -> 스파이 찾아서 본인만 알기
    detectiveAct: ServiceAsyncWrapper(async (data) => {
      const prevGameGroup = await GameGroup.findAll({
        where: { userId: data.userId },
      });

      const prevUser = await User.findAll({ where: { id: data.userId } });

      if (!prevGameGroup) {
        throw { msg: '존재하지 않는 유저입니다.' };
      } else {
        return !prevGameGroup.role === 4
          ? { msg: `[ ${prevUser.nickname} ] (은)는 스파이가 아닙니다.` }
          : { msg: `[ ${prevUser.nickname} ] (은)는 스파이 입니다.` };
      }
    }),

    // 마피아 기능
    spyAct: ServiceAsyncWrapper(async (data) => {
      const prevGameGroup = await GameGroup.findAll({
        where: { userId: data.userId },
      });
      const prevUser = await User.findAll({ where: { id: data.userId } });

      if (!prevGameGroup) {
        throw { msg: '존재하지 않는 유저입니다.' };
      } else {
        if (!prevGameGroup.isProtected === 'Y') {
          await prevGameGroup.update({ isEliminated: 'Y' });
          return {
            msg: `선량한 시민 [ ${prevUser.nickname} ] (이)가 간 밤에 해고 당했습니다.`,
          };
        } else {
          return {
            msg: `현명한 변호사가 일개미 [ ${prevUser.nickname} ] (이)의 부당 해고를 막았습니다.`,
          };
        }
      }
    }),

    // 낮 투표 모음
    dayTimeVoteArr: ServiceAsyncWrapper(async (data) => {
      const { roomId, userId, candidacy } = data;
      const prevGameStatus = await GameStatus.findOne({
        where: { roomId },
      });
      console.log(prevGameStatus);
      if (!prevGameStatus) {
        throw { msg: '게임의 상태 정보가 존재하지 않습니다.' };
      } else if (!candidacy) {
        throw { msg: '투표한 정보가 없습니다.' };
      } else if (candidacy !== 0) {
        // 투표 테이블에 추가
        await Vote.create({
          voter: userId,
          candidacy,
          gameStatusId: prevGameStatus.id,
          roomId,
        });
      }
    }),

    // 시민 낮 투표
    voteResult: ServiceAsyncWrapper(async (data) => {
      const prevVote = await Vote.findAll({
        where: { roomId: data.roomId },
      });

      if (!prevVote) {
        throw { msg: '투표 정보가 존재하지 않습니다.' };
      } else {
        let tempVoteArr = [];
        for (let i = 0; i < prevVote.length; i++) {
          tempVoteArr.push(prevVote.candidacy);
        }
        tempVoteArr.forEach((vote) => {
          result[vote] = (result[vote] || 0) + 1;
        });
        console.log(result)

        await prevGameGroup.update({ isEliminated: 'Y' });
        return !prevGameGroup.role === 4
          ? {
              msg: `선량한 시민 [ ${prevUser.nickname} ] (이)가 해고 당했습니다.`,
            }
          : {
              msg: `산업 스파이 [ ${prevUser.nickname} ] (이)가 붙잡혔습니다.`,
            };
      }
    }),
  },

  getGame: {
    roundNo: ServiceAsyncWrapper(async (data) => {
      const gameStatus = await GameStatus.findOne({
        where: { roomId: data.roomId },
        order: [['createdAt', 'DESC']],
      });
      if (!gameStatus) {
        throw { msg: '게임 정보가 존재하지 않습니다.' };
      } else {
        return gameStatus.roundNo;
      }
    }),

    // 회차, 결과 반환
    status: ServiceAsyncWrapper(async (data) => {
      const prevGameStatus = await GameStatus.findAll({
        where: { roomId: data.roomId },
      });

      if (!prevGameStatus) {
        throw {
          msg: '정보가 저장되지 않아, 게임 스테이지 불러오지 못했습니다.',
        };
      } else {
        // 두번째 판부터 결과 조회
        const spyArr = await GameGroup.findAll({
          where: { roomId: data.roomId, isEliminated: 'N', role: 4 },
        });
        const emplArr = await GameGroup.findAll({
          where: { roomId: data.roomId, isEliminated: 'N', role: 1 || 2 || 3 },
        });

        // 라운드 추가
        GameStatus.sequelize.query(
          `UPDATE rooms SET roundNo = roundNo + 1 WHERE id=${data.roomId};`,
          (err) => {
            if (err) throw err;
          }
        );

        // 결과 추가
        if (emplArr.length <= spyArr.length) {
          const spyWin = prevGameStatus.update({ isResult: 2 });
          return spyWin;
        } else if (spyArr.length === 0) {
          const emplWin = prevGameStatus.update({ isResult: 1 });
          return emplWin;
        } else {
          const gameStatus = await GameStatus.findAll({
            where: { roomId: data.roomId },
          });
          return gameStatus;
        }
      }
    }),

    // 결과 조회
    getResult: ServiceAsyncWrapper(async (data) => {
      const isResult = await GameStatus.findAll({
        where: { roomId: data.roomId, isResult: 1 || 2 },
      });
      if (!isResult) throw { msg: '아직 게임 결과가 없습니다.' };
      else return isResult;
    }),

    // 유저 배열 반환
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
  },
};
