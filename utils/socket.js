const express = require('express');
const SocketIO = require('socket.io');
const { GameStatus, GameGroup, Vote } = require('../models');
const { SocketAsyncWrapper } = require('./wrapper'); // 에러 핸들러 작업 요망

const app = express();

module.exports = (server) => {
  console.log('[ socket util on ] : 한나소켓시작');
  const io = SocketIO(server, { cors: { origin: '*' } });

  // 라우터에서 io 객체를 쓸 수 있게 해줌. req.app.get('io')로 접근
  app.set('io', io);

  io.on('connection', (socket) => {
    console.log('socket connected');
    socket['nickname'] = `Anon`;

    socket.on('join_room', async (data) => {
      // 방검색 socket.rooms
      // 변수 정리
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

    socket.on('send_message', (data) => {
      socket.to(data.room).emit('receive_message', data);
    });

    socket.on('privateMsg', async (data) => {
      const { roomId, socketId, privateMsg } = data;
      socket.to(roomId).to(socketId).emit('privateMsg', privateMsg);
    });

    socket.on('disconnect', () => {
      console.log('User Disconnected', socket.id);
    });

    // 상태 데이터 반환 data: { roomId: 0, status: 'blah'};
    socket.on('getStatus', async (data) => {
      const { roomId, status } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });
      const gameStatus = await prevStatus.update({ status });
      socket.to(roomId).emit('getStatus', gameStatus);
    });

    // 레디(준비)
    socket.on('ready', async (data) => {
      const { roomId, userId } = data;
      const readyUser = await GameGroup.findOne({ where: { roomId, userId } });
      await readyUser.update({ isReady: 'Y' });
      const users = await GameGroup.findAll({ where: { roomId } });
      socket.to(roomId).emit('ready', { users });
    });

    // 레디(취소)
    socket.on('cancelReady', async (data) => {
      const { roomId, userId } = data;
      const readyUser = await GameGroup.findOne({ where: { roomId, userId } });
      await readyUser.update({ isReady: 'N' });
      const users = await GameGroup.findAll({ where: { roomId } });
      socket.to(roomId).emit('cancelReady', { users });
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
          socket.to(roomId).emit('dayTimeVoteArr', {
            voter: userId,
            candidacy: candidacy,
            voteCnt: candidacyCnt.length,
          });
        }
      } catch (error) {
        throw error;
      }
    });
  });
};
