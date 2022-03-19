const SocketIO = require('socket.io');
const gameService = require('../services/game');
const { GameStatus } = require('../models');

module.exports = (server) => {
  console.log('[ socket util on ] : 한나소켓시작');
  const io = SocketIO(server, { path: '/socket.io' });
  io.on('connection', (socket) => {
    console.log('socket connected');
    socket['nickname'] = `Anon`;
    // console.log(socket)
    // console.log(`User Connected: ${socket.nickname}`);

    socket.on('join_room', (data, nickname) => {
      socket.join(data);
      // console.log(io.sockets.adapter.rooms.get(roomName)?.size)
      socket.nickname = `${nickname}`;
      // socket.emit('join_room', `roomId : ${data}`, `nickname: ${socket.nickname}`, socket.id)
      // const room = await GameStatus.findOne({ where: {roomId: data} });
      socket.to(data).emit(
        'join_room',
        `roomId : ${data}`,
        `nickname: ${socket.nickname}`,
        socket.id
        // `[system]: ${ room.status }`
      );
      //  console.log(`[system]: ${ room.status }`);
      console.log(
        `유저아이디 : ${socket.nickname} 방이름 : ${data}`,
        socket.id
      );
    });

    // socket.interval = setInterval(() => {
    //   // 3초마다 클라이언트로 메시지 전송
    //   socket.emit('news', 'Hello Socket.IO');
    // }, 3000);

    // status 발송
    socket.on('getStatus', async (roomId) => {
      const game = await GameStatus.findOne({ roomId });
      socket.to(roomId).emit('getStatus', game.status /*game.msg*/);
      console.log('getStatus', game.status);
    });

    socket.on('send_message', (data) => {
      socket.to(data.room).emit('receive_message', data);
    });

    socket.on('private message', (data) => {
      socket.to(data.room).to(socket.id).emit('private message', data);
    });

    // socket.on('lawyerAct', async (req) => {
    //   let { roomId } = req.params;
    //   let { userId } = req.body;
    //   roomId = '1';
    //   userId = '1';
    //   const msg = await gameService.gamePlay.lawyerAct({ roomId, userId });
    //   io.to(data.room).emit('lawyerAct', msg);
    // });

    socket.on('disconnect', () => {
      console.log('User Disconnected', socket.id);
    });
  });
};
