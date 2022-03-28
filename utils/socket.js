const SocketIO = require('socket.io');
const gameService = require('../services/game');
const { GameStatus } = require('../models');
const { GameGroup } = require('../models');

module.exports = (server) => {
  console.log('[ socket util on ] : 한나소켓시작');
  const io = SocketIO(server, { path: '/socket.io' });

  //소켓 연결
  io.on('connection', (socket) => {
    console.log('socket connected');
    socket['nickname'] = `Anon`;

    //방 입장
    socket.on('join_room', async (data) => {
      // 방검색 socket.rooms
      // 변수 정리
      const { userId, roomId } = data;
      {userId: 유저아이디 값, roomId: roomNumber}

()
      const socketId = socket.id;
      const isDupUser = await GameGroup.findOne({
        where: { roomId, socketId },
      });

      // 예외 처리
      if (isDupUser) {
        socket.to(socket.id).emit('@@@ 방에 입장할 수 없는 유저입니다.');
      } else {
        socket.join(roomId);

        // db저장 로직
        const prevUser = await GameGroup.findOne({ where: { userId } });
        await prevUser.update({ socketId });

        console.log(
          `@@@ 방 입장 --> 유저아이디 : ${userId} | 방 번호 : ${roomId} | 소켓 아이디: ${socketId}`
        );
      }
    });

    // status 전달
    socket.on('getStatus', async (roomId) => {
      const game = await GameStatus.findOne({ roomId });
      socket.to(roomId).emit('getStatus', game.status, game.msg);
      console.log('getStatus', game.status, game.msg);
    });

    //채팅 메세지 전달
    socket.on('send_message', (data) => {
      socket.to(data.room).emit('receive_message', data);
    });

    //레디(준비)
    socket.on('ready', async (req) => {
      // console.log('ready start');
      const { roomId, userId } = req;
      const isReady = await gameService.create.ready({ roomId, userId });
      // console.log(isReady);
      socket.emit('ready', { isReady: isReady });
    });

    //레디(취소)
    socket.on('cancleReady', async (req) => {
      // console.log('ready start');
      const { roomId, userId } = req;
      const isReady = await gameService.create.ready({ roomId, userId });
      // console.log(isReady);
      socket.emit('ready', { isReady: isReady });
    });

    //귓속말 전달(미구현)
    socket.on('privateMsg', async (data) => {
      const { roomId, socketId, privateMsg } = data;
      socket.to(roomId).to(socketId).emit('privateMsg', privateMsg);
    });

    // 소켓 연결해제
    socket.on('disconnect', () => {
      console.log('User Disconnected', socket.id);
    });

    // socket.on('test', (req) => {
    //   socket.to(req.roomId).emit('test', req.msg);
    // });

    socket.on('test', (roomId, msg) => {
      console.log('asdfadsfasf', roomId, msg);
      socket.to(roomId).emit('test', { roommsg: msg });
      socket.emit('test', { msg: msg });
    });

    socket.on('test2', (msg) => {
      console.log(msg);
    });

    // socket.interval = setInterval(() => {
    //   // 3초마다 클라이언트로 메시지 전송
    //   socket.emit('news', 'Hello Socket.IO');
    // }, 3000);

    // socket.on('lawyerAct', async (req) => {
    //   let { roomId } = req.params;
    //   let { userId } = req.body;
    //   roomId = '1';
    //   userId = '1';
    //   const msg = await gameService.gamePlay.lawyerAct({ roomId, userId });
    //   io.to(data.room).emit('lawyerAct', msg);
    // });
  });
};
