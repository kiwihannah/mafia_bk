const express = require('express');
const SocketIO = require('socket.io');
const { GameStatus, GameGroup } = require('../models');

const app = express();

module.exports = (server) => {
  console.log('[ socket util on ] : 한나소켓시작');
  const io = SocketIO(server, { cors: { origin: '*' } });

  // 라우터에서 io 객체를 쓸 수 있게 해줌. req.app.get('io')로 접근
  app.set('io', io);

  io.on('connection', (socket) => {
    console.log('socket connected');
    socket['nickname'] = `Anon`;

    socket.on('join_room', (data, nickname) => {
      console.log(
        'before join roooooooooooooooooooooooooooooooooom',
        socket.rooms
      );
      socket.join(data);
      console.log(
        'after join roooooooooooooooooooooooooooooooooom',
        socket.rooms
      );
      socket.nickname = `${nickname}`;
      socket
        .to(data) // sting 형 int
        .emit(
          'join_room',
          `roomId : ${data}`,
          `nickname: ${socket.nickname}`,
          socket.id
        );
      console.log(
        `유저아이디 : ${socket.nickname} 방이름 : ${data}`,
        socket.id
      );
    });

    socket.on('send_message', (data) => {
      socket.to(data.room).emit('receive_message', data);
    });

    socket.on('private message', (data) => {
      socket.to(data.room).to(socket.id).emit('private message', data);
    });

    socket.on('disconnect', () => {
      console.log('User Disconnected', socket.id);
    });


    // 상태 데이터 반환 data: {roomId: 0, status: 'blah'};
    socket.on('getStatus', async (data) => {
      const { roomId, status } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });
      const gameStatus = await prevStatus.update({ status })
      socket.to(roomId).emit('getStatus', gameStatus);
    });
    
    // 레디(준비)
    socket.on('ready', async (data) => {
      const { roomId, userId } = data;
      const readyUser = await GameGroup.findOne({ where: { userId } });
      if (!readyUser) {
        socket
          .to(roomId)
          .emit(
            'ready',
            '[socket] 게임이 시작되지 않았거나, 게임 정보가 없습니다.'
          );
      } else {
        const ready = await readyUser.update({ isReady: 'Y' });
        const users = await GameGroup.findAll({ where: { roomId } });
        socket.to(roomId).emit('ready', { users });
      }
    });

    // 레디(취소)
    socket.on('cancelReady', async (data) => {
      const { roomId, userId } = data;
      const readyUser = await GameGroup.findOne({ where: { roomId, userId } });
      if (!readyUser) {
        socket
          .to(roomId)
          .emit(
            'cancelReady',
            '[socket] 게임이 시작되지 않았거나, 게임 정보가 없습니다.'
          );
      } else {
        const ready = await readyUser.update({ isReady: 'N' });
        const users = await GameGroup.findAll({ where: { roomId } });
        socket.to(roomId).emit('cancelReady', { users });
      }
    });
  });

};
