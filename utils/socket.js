const express = require('express');
const SocketIO = require('socket.io');
const { GameStatus, GameGroup, Vote, Log, Room } = require('../models');
const { Op } = require('sequelize');
const { SocketAsyncWrapper } = require('./wrapper'); // 에러 핸들러 작업 요망

const app = express();

module.exports = (server) => {
  console.log('[ socket util on ] : 한나소켓시작');
  const io = SocketIO(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    console.log('socket connected');
    socket['nickname'] = `Anon`;

    socket.on('join_room', async (data) => {
      // 방검색 socket.rooms
      const { userId, roomId } = data;
      const socketId = socket.id;

      try {
        socket.join(roomId);
        // db저장 로직
        const prevUser = await GameGroup.findOne({ where: { userId } });
        await prevUser.update({ socketId });
        console.log(
          `@@@ 방 입장 --> 유저아이디 : ${userId} | 방 번호 : ${roomId} | 소켓 아이디: ${socketId}`
        );
      } catch (error) {
        throw error;
      }
    });

    // 채팅 (귓속말 추가)
    socket.on('send_message', (data) => {
      data.socketId === ''
        ? socket.to(data.roomId).emit('receive_message', data)
        : socket.to(data.socketId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
      console.log('User Disconnected', socket.id);
    });

    // 상태 데이터 반환 data: { roomId: 0, status: 'blah'};
    socket.on('getStatus', async (data) => {
      const { roomId, status } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });
      const gameStatus = await prevStatus.update({ status });

      console.log(`[ ##### system ##### ]
      \n 현재 생성된 소켓 룸 리스트 :`);
      console.log(io.sockets.adapter.rooms);
      socket.to(roomId).emit('getStatus', gameStatus);
    });

    // 레디 카운트 (레디)
    socket.on('readyCnt', async (data) => {
      const { roomId, userId } = data;
      const readyUser = await GameGroup.findOne({ where: { userId } });
      await readyUser.update({ isReady: 'Y' });

      const users = await GameGroup.findAll({ where: { roomId, isReady: 'Y' } });
      const readyCnt = users.length;
      socket.to(roomId).emit('readyCnt', { readyCnt });
      socket.emit('myReadyCnt', { myReadyCnt: readyCnt });
    });

    // 레디 카운트 (취소)
    socket.on('cancelReady', async (data) => {
      const { roomId, userId } = data;
      const readyUser = await GameGroup.findOne({ where: { userId } });
      await readyUser.update({ isReady: 'N' });

      const users = await GameGroup.findAll({ where: { roomId, isReady: 'Y' } });
      const readyCnt = users.length;
      socket.to(roomId).emit('readyCnt', { readyCnt });
      socket.emit('myReadyCnt', { myReadyCnt: readyCnt });
    });

    // 각자 낮 투표 (사원) 처리
    socket.on('dayTimeVoteArr', async (data) => {
      const { roomId, userId, candidacy, roundNo } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });
      try {
        if (candidacy !== 0) {
          // 투표 테이블에 추가
          await Vote.create({
            voter: userId,
            candidacy,
            gameStatusId: prevStatus.id,
            roomId,
            roundNo,
          });
          const candidacyCnt = await Vote.findAll({ where: { candidacy } });
          const data = {
            voter: userId,
            candidacy: candidacy,
            voteCnt: candidacyCnt.length,
          };
          console.log('@@@@@ 개인 낮 투표를 했다-->', data);
          socket.to(roomId).emit('dayTimeVoteArr', data);
          socket.emit('dayTimeVoteArr', data);
        }
      } catch (error) {
        throw error;
      }
    });

    // 라운드 반환
    socket.on('getRoundNo', async (data) => {
      const { roomId } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });
      socket.to(roomId).emit('getRoundNo', { roundNo: prevStatus.roundNo });
      socket.emit('getRoundNo', { roundNo: prevStatus.roundNo });
    });

    // 결과 동시 반환
    socket.on('winner', async (roomId) => {
      console.log('@@@@@ WINNER 요청이 들어오긴 함 방번호-->', roomId);
      const prevStatus = await GameStatus.findOne({ where: { roomId } });
      const spyGroup = await GameGroup.findAll({ where: { roomId, role: 4 } });
      const emplGroup = await GameGroup.findAll({
        where: { roomId, role: { [Op.ne]: 4 } },
      });
      
      try {
        const winnerArr = []; 
        if (prevStatus.isResult === 2) winnerArr.push(spyGroup);
        if (prevStatus.isResult === 1) winnerArr.push(emplGroup);

        // 게임 데이터 삭제
        await GameGroup.destroy({ where: { roomId } });
        await GameStatus.destroy({ where: { roomId } });
        await Vote.destroy({ where: { roomId } });
        await Room.destroy({ where: { id: roomId } });

        // 게임 완료 로그
        const prevLog = await Log.findOne({ where: { date } });
        if (prevLog) prevLog.update({ compGameCnt: prevLog.compGameCnt + 1 });

        console.log(`[ ##### system ##### ]
        \n게임을 종료합니다.
        \n방 번호:${roomId} `);

        socket.to(roomId).emit('winner', { users : winnerArr[0] });

      } catch (error) {
        throw error;
      }
    });

    
    // 방 나가기 소켓 제거 기능
    socket.on('leaveRoom', (roomId) => {
      console.log('@@@@@ 방 나가기 요청이 들어오긴 함 방번호-->', roomId);
      socket.leave(roomId);
      // const currentRoom = socket.adapter.rooms[roomId];
      // const userCnt = currentRoom ? currentRoom.length : 0;
      // if (userCnt === 0) axios.delete(`http://localhost:8005/room/${roomId}`)
    });

  });
};
