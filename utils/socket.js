const SocketIO = require('socket.io');
const { GameStatus } = require('../models');

// module.exports = {
//   // io: SocketIO(server, { path: '/socket.io' });
//   init:socket.on('connection', (socket, io) => {
//     console.log('socket connected');
//   }),
// }
//   socket.on('getStatus', async (roomNum) => {
//     console.log(roomNum);
//     let game = await GameStatus.findOne({
//       where: { roomId: roomNum },
//       attributes: ['status'],
//       raw: true,
//     });
//     console.log(game);
//     socket.emit('getStatus', game.status);
//     console.log(game.status);
//   });
//   return socket, io;
// })

let io;

module.exports = {
  init: (httpServer) => {
    io = require('socket.io')(httpServer);
    console.log('server connected');
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
};

// module.exports = (server) => {
//   console.log('[ socket util on ] : 한나소켓시작');
//   const io = SocketIO(server, { path: '/socket.io' });
//   io.on('connection', (socket) => {
//     console.log('socket connected');
//     socket['nickname'] = `Anon`;
//     // console.log(socket)
//     // console.log(`User Connected: ${socket.nickname}`);

//     socket.on('join_room', (data, nickname) => {
//       socket.join(data);
//       // console.log(io.sockets.adapter.rooms.get(roomName)?.size)
//       socket.nickname = `${nickname}`;
//       // socket.emit('join_room', `roomId : ${data}`, `nickname: ${socket.nickname}`, socket.id)
//       // const room = await GameStatus.findOne({ where: {roomId: data} });
//       socket.to(data).emit(
//         'join_room',
//         `roomId : ${data}`,
//         `nickname: ${socket.nickname}`,
//         socket.id
//         // `[system]: ${ room.status }`
//       );
//       //  console.log(`[system]: ${ room.status }`);
//       console.log(
//         `유저아이디 : ${socket.nickname} 방이름 : ${data}`,
//         socket.id
//       );
//     });

//     // socket.interval = setInterval(() => {
//     //   // 3초마다 클라이언트로 메시지 전송
//     //   socket.emit('news', 'Hello Socket.IO');
//     // }, 3000);

//     // status 발송
//     socket.on('getStatus', async (roomId) => {
//       const game = await GameStatus.findOne({ roomId });
//       socket.to(roomId).emit('getStatus', game.status /*game.msg*/);
//       console.log('getStatus', game.status);
//     });

//     socket.on('send_message', (data) => {
//       socket.to(data.room).emit('receive_message', data);
//     });

//     socket.on('private message', (data) => {
//       socket.to(data.room).to(socket.id).emit('private message', data);
//     });

//     // socket.on('lawyerAct', async (req) => {
//     //   let { roomId } = req.params;
//     //   let { userId } = req.body;
//     //   roomId = '1';
//     //   userId = '1';
//     //   const msg = await gameService.gamePlay.lawyerAct({ roomId, userId });
//     //   io.to(data.room).emit('lawyerAct', msg);
//     // });

//     // status 예시 코드
//     // socket.emit('update item', '1', { name: 'updated' }, (response) => {
//     //   console.log(response.status); // ok
//     // });

//     // socket.on('update item', (arg1, arg2, callback) => {
//     //   console.log(arg1); // 1
//     //   console.log(arg2); // { name: "updated" }
//     //   callback({
//     //     status: 'ok',
//     //   });
//     // });

//     socket.on('disconnect', () => {
//       console.log('User Disconnected', socket.id);
//     });
//   });
// };
const gameService = require('../services/game');
const { GameStatus } = require('../models');

module.exports = (server) => {
  console.log('[ socket util on ] : 한나소켓시작');
  const io = SocketIO(server, { cors: { origin: "*" } });
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
    //   console.log('한나소켓인터벌');
    //   // socket.emit('news', '한나소켓인터벌');
    // }, 1000);

    // status 발송
    socket.on('getStatus', async (roomId) => {
      const game = await GameStatus.findOne({ roomId });
      socket.to(roomId).emit('getStatus', game.status, game.msg);
      console.log('getStatus', game.status, game.msg);
    });

    //레디(준비)
    socket.on('ready', async (req) => {
      const { roomId, userId } = req;
      const isReady = await gameService.create.ready({ roomId, userId });
      socket.to(roomId).emit('ready', { isReady: isReady });
    });

    //레디(취소)
    socket.on('cancelReady', async (req) => {
      const { roomId, userId } = req;
      const isReady = await gameService.create.ready({ roomId, userId });
      socket.to(roomId).emit('cancelReady', { isReady: isReady });
    });

    // msg 발송
    socket.on('getMsg', async (roomId) => {
      const game = await GameStatus.findOne({ roomId });
      socket.to(roomId).emit('getMsg', game.msg);
      console.log('getMsg', game.status);
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
  });
};
