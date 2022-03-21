const SocketIO = require('socket.io');
const gameService = require('../services/game');
const { GameStatus } = require('../models');

module.exports = (server) => {
  console.log('[ socket util on ] : 한나소켓시작');
  const io = SocketIO(server, { path: '/socket.io' });

  //소켓 연결
  io.on('connection', (socket) => {
    console.log('socket connected');
    socket['nickname'] = `Anon`;

    //방 입장
    socket.on('join_room', (data, nickname) => {
      socket.join(data);
      socket.nickname = `${nickname}`;
      // socket.emit('join_room', `roomId : ${data}`, `nickname: ${socket.nickname}`, socket.id)
      // const room = await GameStatus.findOne({ where: {roomId: data} });
      socket
        .to(data)
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

    // status 전달
    socket.on('getStatus', async (roomId) => {
      const game = await GameStatus.findOne({ roomId });
      socket.to(roomId).emit('getStatus', game.status /*game.msg*/);
      console.log('getStatus', game.status);
    });

    //채팅 메세지 전달
    socket.on('send_message', (data) => {
      socket.to(data.room).emit('receive_message', data);
    });

    //레디
    socket.on('ready', async (req) => {
      console.log('ready start');
      const { roomId, userId, isReady } = req;
      const ready = await gameService.create.readyGroup({
        roomId,
        userId,
        isReady,
      });
      console.log(ready);
      socket.emit('ready', { userId: Number(userId), isReady: ready });
      // return res.status(201).json({ userId : Number(userId), isReady : ready });
    });

    //귓속말 전달(미구현)
    socket.on('private message', (data) => {
      socket.to(data.room).to(socket.id).emit('private message', data);
    });

    // 소켓 연결해제
    socket.on('disconnect', () => {
      console.log('User Disconnected', socket.id);
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
