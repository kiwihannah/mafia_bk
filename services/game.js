const { User, Room, GameGroup, GameStatus, Vote } = require('../models');
const { ServiceAsyncWrapper } = require('../utils/wrapper');
const {  } = require('../utils/socket');

module.exports = {
  entryAndExit: {
    // 방 입장
    enterRoom: ServiceAsyncWrapper(async (data) => {
      const { userId, roomId, roomPwd } = data;
      const prevUser = await User.findOne({ where: { id: userId } });
      const prevRoom = await Room.findOne({ where: { id: roomId } });
      const idDupUser = await GameGroup.findOne({ where: { userId } });

      if (!prevUser || idDupUser) {
        // 유저 두번 입장 예외처리
        throw { msg: '방에 진입할 수 없는 유저 입니다.' };
      } else if (
        // 방 정보 예외처리
        !prevRoom ||
        prevRoom.onPlay === 'Y' ||
        prevRoom.currPlayer === prevRoom.maxPlayer
      ) {
        throw { msg: '이미 게임이 시작되었거나, 입장 불가능한 방입니다.' };
      } else {
        // 입장 직전 예외처리
        if (prevRoom.roomPwd !== roomPwd) {
          throw { msg: '방 비밀번호가 일치하지 않습니다.' };
        } else {
          // 방 입장 로직 : 현재 인원 1++, 유저 리스트에 추가
          User.sequelize.query(
            `UPDATE rooms SET currPlayer = currPlayer + 1 WHERE id=${roomId};`,
            (err) => {
              if (err) throw err;
            }
          );

          await prevUser.update({ roomId });

          const gameGroup = await GameGroup.create({
            userId,
            nickname: prevUser.nickname,
            isReady: 'N',
            role: null,
            isEliminated: 'N',
            isAi: 'N',
            isHost: 'N',
            roomId,
          });

          // 유저 게임 그룹 테이블 연결
          User.sequelize.query(
            `UPDATE users SET gameGroupId = ${gameGroup.id} WHERE id=${userId};`,
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
      const { userId, roomId } = data;
      const prevUser = await User.findOne({ where: { id: userId } });
      const prevRoom = await Room.findOne({ where: { id: roomId } });

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
        await GameGroup.destroy({ where: { userId } }); // 게임 그룹 테이블 삭제

        // 방장이 나가면 두번째로 오래된 멤버가 방장
        const nextHost = await User.findOne({
          where: { roomId },
          order: [['createdAt', 'ASC']],
        });
        if (prevUser.id === prevRoom.hostId) {
          await prevRoom.update({ hostId: nextHost.id });
        }

        // 현재 인원 1--
        User.sequelize.query(
          `UPDATE rooms SET currPlayer = currPlayer - 1 WHERE id=${roomId};`,
          (err) => {
            if (err) throw err;
          }
        );

        // 현재인원 < 0 방 자동 삭제
        const afterRoom = await Room.findOne({ where: { id: roomId } });
        if (afterRoom.currPlayer === 0) {
          await afterRoom.destroy({ where: { id: roomId } });
        }

        return user.id;
      }
    }),
  },

  create: {
    // 레디 하기 
    ready: ServiceAsyncWrapper(async (data) => {
      const prevGameGroupUser = await GameGroup.findOne({ where: { userId: data.userId } });

      if (!prevGameGroupUser) {
        throw { msg: '존재하지 않는 유저입니다.' };
      } else {
        const isReady = await prevGameGroupUser.update({ isReady: 'Y' });
        return isReady;
      }
    }),

    // 부족 인원 ai로 채우기
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
            nickname: `AIPLAYER_${roomId}_${i}`,
            roomId,
          });

          let gameGroup = await GameGroup.create({
            userId: aiUser.id,
            nickname: `Ai P_${roomId}_${i}`,
            isReady: 'Y',
            role: null,
            isEliminated: 'N',
            isAi: 'Y',
            isHost: 'N',
            roomId,
          });
          await aiUser.update({ gameGroupId: gameGroup.id });
        }

        // status 생성 -> 시작부터
        await GameStatus.create({
          roundNo: 1,
          isResult: 0,
          status: 'isStart',
          roomId: data.roomId,
        });

        const users = await GameGroup.findAll({ where: { roomId } });
        return users;
      }
    }),
  },

  cancel: {
    ready: ServiceAsyncWrapper(async (data) => {
      const prevGameGroupUser = await GameGroup.findOne({ where: { userId: data.userId } });

      if (!prevGameGroupUser) {
        throw { msg: '존재하지 않는 유저입니다.' };
      } else {
        const isReady = await prevGameGroupUser.update({ isReady: 'N' });
        return isReady;
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

    // 요청마다 다음 스테이터스 db에 삽입 후 반환
    status: ServiceAsyncWrapper(async (data) => {
      const { roomId, userId } = data;
      const statusArr = [
        'dayTime',
        'voteDay',
        'invailedVoteCnt',
        'showResultDay',
        'voteNightLawyer',
        'voteNightDetective',
        'showMsgDetective',
        'voteNightSpy',
        'showResultNight',
        // 'isGameResult_2',
      ];

      const game = await GameStatus.findOne({ where: { roomId } });
      const isHost = await GameGroup.findOne({ where: { userId } });
      const currIdx = statusArr.indexOf(game.status);
      if (isHost.isHost === 'Y') {
        if (statusArr[statusArr.length - 1] === statusArr[currIdx]) {
          const nextStatus = await game.update({ status: statusArr[0] });
          return nextStatus.status;
        } else {
          const nextStatus = await game.update({ status: statusArr[currIdx + 1] });
          
          console.log(`@@@@@ ${ isHost } try to update current status to ${nextStatus.status}`);
          return nextStatus.status;
        }
      } else {
        return game.status;
      }
    }),
  },

  SendMsg: { // 시작 요청한 방장에게만 보내는 메세지
    start: ServiceAsyncWrapper(async (data) => {
      const { userId, roomId } = data;
      const prevRoom = await Room.findOne({ where: { id: roomId } });
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
            // ai 사용 여부
            return prevRoom.currPlayer < prevRoom.maxPlayer
              ? `부족한 인원은 인공지능 플레이어로 대체 하시겠습니까?\n미리 말씀드리자면, 인공지능은 상당히 멍청합니다.`
              : '시작!';
          }
        }
      }
    }),
  },

  start: {
    // 게임 시작하기
    game: ServiceAsyncWrapper(async (data) => {
      const { roomId } = data;
      const status = await GameStatus.findOne({ where: { roomId } });

      // 게임 시작 상태로 업데이트
      const prevRoom = await Room.findOne({ where: { id: roomId } });
      const room = await prevRoom.update({ onPlay: 'Y' });

      // 상태 업데이트
      await status.update({ status: 'roleGive' });
      return room;
    }),
  },

  gamePlay: {
    // 랜덤으로 역할 분담 AI 플레이어 포함
    giveRole: ServiceAsyncWrapper(async (data) => {
      const { roomId } = data;
      const prevGameGroup = await GameGroup.findAll({ where: { roomId } });

      const tempRoleArr = [];
      // [{ 1: 'employee' },  { 2: 'lawyer' },  { 3: 'detective' },  { 4: 'spy' }]
      switch (prevGameGroup.length) {
        case 6: // 사원3, 변호사1, 스파이2
          tempRoleArr.push(1, 1, 1, 2, 4, 4);
          break;
        case 7: // 사원3, 탐정1, 변호사1, 스파이2
          tempRoleArr.push(1, 1, 1, 2, 3, 4, 4);
          break;
        case 8: // 사원4, 탐정1, 변호사1, 스파이2
          tempRoleArr.push(1, 1, 1, 1, 2, 3, 4, 4);
          break;
        case 9: // 사원4, 탐정1, 변호사1, 스파이3
          tempRoleArr.push(1, 1, 1, 1, 2, 3, 4, 4, 4);
          break;
        case 10: // 사원5, 탐정, 변호사1, 스파이3
          tempRoleArr.push(1, 1, 1, 1, 1, 2, 3, 4, 4, 4);
          break;
        default:
          // 테스트 용
          tempRoleArr.push(1, 2, 3, 4);
      }

      const roleArr = tempRoleArr.sort(() => Math.random() - 0.5);
      // console.log(roleArr);

      for (let i = 0; i < roleArr.length; i++) {
        const updateUser = await GameGroup.findOne({
          where: { role: null, roomId },
          order: [['createdAt', 'DESC']],
        });

        await updateUser.update({ role: roleArr[i] });
      }

      // 상태 업데이트
      const status = await GameStatus.findOne({ where: { roomId } });
      await status.update({ status: 'showRole' });

      const users = await GameGroup.findAll({ where: { roomId } });
      return users;
    }),

    // 의사 기능 -> 마피아에게 죽을 것 같은 사람 1회 방어
    lawyerAct: ServiceAsyncWrapper(async (data) => {
      const { userId, roomId } = data;
      const prevGameGroup = await GameGroup.findAll({ where: { roomId } });
      const prevGameStatus = await GameStatus.findOne({ where: { roomId } });

      // 랜덤투표 로직
      let userArr = [];
      let selectedUserId = 0;
      for (let i=0; i<prevGameGroup.length; i++) { userArr.push(prevGameGroup[i].userId); }
      userId ? selectedUserId = userId : selectedUserId = userArr[Math.floor(Math.random() * userArr.length)];
      const protectedUser = await GameGroup.findOne({ where: { userId: selectedUserId } });

      if (!protectedUser) {
        throw { msg : '존재하지 않는 유저를 선택했습니다.' };
      } else {
        // 게임 상태 업데이트
        await prevGameStatus.update({ status: 'voteNightDetective' });
        await protectedUser.update({ isProtected: 'Y' });
        return `[ ${protectedUser.nickname} ] (이)를 스파이로 부터 1회 보호합니다.`;
      }
    }),

    // 경찰 기능 -> 스파이 찾아서 본인만 알기
    detectiveAct: ServiceAsyncWrapper(async (data) => {
      const { userId, roomId } = data;
      const prevGameGroup = await GameGroup.findOne({ where: { userId } });
      const prevGameStatus = await GameStatus.findOne({ where: { roomId } });

      if (!prevGameGroup) {
        throw { msg: '존재하지 않는 유저이거나, 선택하지 않았습니다.' };
      } else {
        // 게임 상태 한번만 업데이트
        await prevGameStatus.update({ status: 'voteNightSpy' });

        return prevGameGroup.role === 4
          ? `[ ${prevGameGroup.nickname} ] (은)는 스파이 입니다.`
          : `[ ${prevGameGroup.nickname} ] (은)는 스파이가 아닙니다.`;
      }
    }),

    // 마피아 기능
    spyAct: ServiceAsyncWrapper(async (data) => {
      const { userId, roomId } = data;
      const prevGameGroup = await GameGroup.findAll({ where: { roomId } });
      const prevGameStatus = await GameStatus.findOne({ where: { roomId } });

      // 랜덤투표 로직
      let userArr = [];
      let selectedUserId = 0;
      for (let i=0; i<prevGameGroup.length; i++) { userArr.push(prevGameGroup[i].userId); }
      userId ? selectedUserId = userId : selectedUserId = userArr[Math.floor(Math.random() * userArr.length)];
      const firedUser = await GameGroup.findOne({ where: { userId: selectedUserId } });

      if (!firedUser) {
        throw { msg: '존재하지 않는 유저를 선택했습니다.' };
      } else {
        // 라운드 추가
        GameStatus.sequelize.query(
          `UPDATE gameStatuses SET roundNo = roundNo + 1 WHERE id=${roomId};`,
          (err) => {
            if (err) throw err;
          }
        );

        // 게임 상태 한번만 업데이트
        await prevGameStatus.update({ status: 'showResultNight' });

        if (firedUser.isProtected === 'Y') {
          // 1회 만 보호
          await firedUser.update({ isProtected: 'N' });
          return `현명한 변호사가 일개미 [ ${firedUser.nickname} ] (이)의 부당 해고를 막았습니다.`;
        } else {
          await firedUser.update({ isEliminated: 'Y' });
          return `선량한 시민 [ ${firedUser.nickname} ] (이)가 간 밤에 해고 당했습니다.`;
        }
      }
    }),

    // 낮 투표 모음
    dayTimeVoteArr: ServiceAsyncWrapper(async (data) => {
      const { roomId, userId, candidacy, roundNo } = data;
      const prevGameStatus = await GameStatus.findOne({ where: { roomId } });
      const prevGameGroup = await GameGroup.findOne({ where: { userId } });

      console.log(prevGameStatus);
      if (!prevGameStatus) {
        throw { msg: '게임의 상태 정보가 존재하지 않습니다.' };
      } else if (!candidacy) {
        throw { msg: '투표한 정보가 없습니다.' };
      } else if (candidacy !== 0) {
        // 투표 테이블에 추가
        const vote = await Vote.create({
          voter: userId,
          candidacy,
          gameStatusId: prevGameStatus.id,
          roomId,
          roundNo,
        });

        // 게임 상태 한번만 업데이트
        if (prevGameGroup.isHost === 'Y')  await prevGameStatus.update({ status: 'invailedVoteCnt' });

        return vote.voter;
      }
    }),

    // 시민 낮 투표 부결표 처리 & ai 랜덤 투표
    invalidAndAiVote: ServiceAsyncWrapper(async (data) => {
      const { roomId, roundNo, userId } = data;

      const ai = await GameGroup.findAll({ where: { roomId, isAi: 'Y' } });
      const prevGameGroup = await GameGroup.findAll({ where: { roomId } });
      const host = await GameGroup.findOne({ where: { userId } });
      const userArr = [], aiArr = [];

      console.log(host)
      if (host.isHost === 'Y') {
        for (let i=0; i<prevGameGroup.length; i++) {
          userArr.push(prevGameGroup[i].userId);
        }
        for (let i=0; i<ai.length; i++) {
          aiArr.push(ai[i].userId);
        }

        let ranNum = 0;
        for (let i=0; i<ai.length; i++) {
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
        const prevGameStatus = await GameStatus.findOne({ where: { roomId } });

        if ((prevVote.length || 0) !== prevGameGroup.length) {
          for (
            let i = 0;
            i < prevGameGroup.length - (prevVote.length || 0);
            i++
          ) {
            await Vote.create({
              voter: 0,
              candidacy: 0,
              roomId: roomId,
              roundNo: roundNo,
              gameStatus: 0,
            });
          }
        } 
        await prevGameStatus.update({ status: 'showResultDay' });
        return `${prevGameGroup.length - prevVote.length} 개의 무효표 처리가 완료되었습니다.\n${ai.length} 명의 ai가 투표를 완료 했습니다.`;
      } else {
        return 'host가 아닌 요청';
      }
    }),

    // 시민 낮 투표 결과 반환
    getVoteResult: ServiceAsyncWrapper(async (data) => {
      const { roomId, roundNo } = data;
      const prevVote = await Vote.findAll({ where: { roomId, roundNo } });

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
        console.log(sorted);
        
        const prevGameGroup = await GameGroup.findOne({
          where: { userId: Number(sorted[0][0]) },
        });

        console.log(`######세계최고 개표 시스템이 말한다 : ${sorted}`);

        if (sorted[0][0] === '0') {
          return `${sorted}, 무효표가 가장 많으므로 다음 라운드로 갑니다.`;
        } else if (sorted[0][1] === sorted[1][1]) {
          return `${sorted}, 동표이므로 다음 라운드로 갑니다.`;
        } else {
          // isGameResult_1 를 프론트에서 사용 안하므로 여기선 상태 업데이트 스킵

          await prevGameGroup.update({ isEliminated: 'Y' });
          return prevGameGroup.role === 4
            ? `산업 스파이 [ ${prevGameGroup.nickname} ] (이)가 붙잡혔습니다.`
            : `선량한 시민 [ ${prevGameGroup.nickname} ] (이)가 해고 당했습니다.`;
        }
      }
    }),
  },

  getGame: {
    status: ServiceAsyncWrapper(async (data) => {
      const gameStatus = await GameStatus.findOne({
        where: { roomId: data.roomId },
        order: [['createdAt', 'DESC']],
      });
      if (!gameStatus) {
        throw { msg: '게임이 시작하지 않았거나, 정보가 없습니다.' };
      } else {
        console.log('roundNo: ', gameStatus.status);
        return gameStatus.status;
      }
    }),

    // 회차, 결과 반환
    result: ServiceAsyncWrapper(async (data) => {
      const { roomId } = data;
      const prevGameStatus = await GameStatus.findOne({ where: { roomId } });
      console.log(`#####회차를 반환합니다. 현재 스테이터스: ${prevGameStatus.status}`);

      const leftUsers = await GameGroup.findAll({ where: { roomId, isEliminated: 'N' } });
      if (!prevGameStatus) {
        throw {
          msg: '정보가 저장되지 않아, 게임 스테이지 불러오지 못했습니다.',
        };
      } else {
        let tempSpyArr = [], tempEmplArr = [];
        for (let i=0; i<leftUsers.length; i++) {
          leftUsers[i].role === 4 ? tempSpyArr.push(leftUsers[i].userId) : tempEmplArr.push(leftUsers[i].userId);
        }
        console.log(`######스파이 수: ${tempSpyArr.length}\n사원 수: ${tempEmplArr.length}`);

        // 결과 추가 & 반환
        if (tempEmplArr.length === tempSpyArr.length) {
          await prevGameStatus.update({ isResult: 2 });
        } else if (tempSpyArr.length === 0) {
          await prevGameStatus.update({ isResult: 1 });
        } else { // 승부 없음
          let updateStatus = prevGameStatus.status !== 'showResultNight' ? 'voteNightLawyer' : 'dayTime';
          await prevGameStatus.update({ status: `${updateStatus}` });
        }
        const afterCnt = await GameStatus.findOne({ where: { roomId } });
        return afterCnt.isResult;
      }
    }),

    // 프론트 검색용 라운드 넘버
    roundNo: ServiceAsyncWrapper(async (data) => {
      const { roomId } = data;
      const game = await GameStatus.findOne({ where: { roomId } });
      if (!game) throw { msg: '게임 정보가 존재하지 않습니다.' };
      else return game.roundNo; 
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
