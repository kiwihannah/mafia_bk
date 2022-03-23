const express = require('express');
const SocketIO = require('socket.io');
const { GameStatus } = require('../models');

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
      console.log('before join roooooooooooooooooooooooooooooooooom', socket.rooms);
      socket.join(data);
      console.log('after join roooooooooooooooooooooooooooooooooom', socket.rooms);
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

    // status, msg 발송
    socket.on('getStatus', async (roomId) => {
      console.log('iddddddddddddddddddddddddddddddddddd',roomId)
      const game = await GameStatus.findOne({ where: { roomId }  });
      
      if (!game) {
        socket.to(roomId).emit('getStatus', '[socket] 게임이 시작되지 않았거나, 게임 정보가 없습니다.');
      } else {
        console.log(game);
        socket.to(roomId).emit('getStatus', game.status, game.msg);
        console.log('getStatus', game.status, game.msg, 'roomId', roomId);
      }
    });

    // 레디(준비) 
    socket.on('ready', async (req) => {
      const { roomId, userId } = req;
      const isReady = await gameService.create.ready({ roomId, userId });
      socket.to(roomId).emit('ready', { isReady: isReady });
    });

    // 레디(취소)
    socket.on('cancelReady', async (req) => {
      const { roomId, userId } = req;
      const isReady = await gameService.create.ready({ roomId, userId });
      socket.to(roomId).emit('cancelReady', { isReady: isReady });
    });

    // msg 발송
    socket.on('getMsg', async (roomId) => {
      const game = await GameStatus.findOne({ where: { roomId } });
      socket.to(roomId).emit('getMsg', game.msg);
      console.log('getMsg', game);
    });

  });
};
