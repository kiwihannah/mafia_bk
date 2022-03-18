const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const { swaggerUi, specs } = require('./swagger');
const SocketIO = require('socket.io');
const dotenv = require('dotenv');
const { GameStatus } = require('./models');
dotenv.config();

const port = process.env.PORT || 3000; // 소켓 웹 통합 포트

const app = express();
const router = express.Router();

//swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs));

// middlewares
app.use(morgan('dev'));
app.use(cors({ origin: '*' }));
app.use('/api', bodyParser.json(), router);
// app.use(express.static('public'));
app.use(express.static(__dirname + '/public')); // Set the static files location

const httpserver = http.createServer(app);

// socket.io connect
const io = SocketIO(httpserver, {
  cors: {
    origin: '*',
  },
});

// connect DataBase
const db = require('./models');
db.sequelize
  .sync()
  .then(() => {
    console.log('mafia app DB connected');
  })
  .catch(console.error);

// router.get('/', (_, res) => {
//   res.send('#4 main proj mafia_bk sever open test');
// });

// routes
const userRouter = require('./routes/user');
const roomRouter = require('./routes/room');
const gameRouter = require('./routes/game');

app.use('/api', [userRouter, roomRouter, gameRouter]);

// web, socket port running
httpserver.listen(port, () => {
  console.log(`server listening on ${port}`);
});

module.exports = app;

io.on('connection', (socket) => {
  console.log('socket connected');
  socket['nickname'] = `Anon`;

  // socket.emit;
  // console.log(socket);
  // console.log(`User Connected: ${socket.nickname}`);

  socket.on('join_room', (data, nickname) => {
    socket.join(data);
    // console.log(io.sockets.adapter.rooms.get(roomName)?.size)
    socket.nickname = `${nickname}`;
    // socket.emit('join_room', `roomId : ${data}`, `nickname: ${socket.nickname}`, socket.id)
    socket
      .to(data)
      .emit(
        'join_room',
        `roomId : ${data}`,
        `nickname: ${socket.nickname}`,
        socket.id
      );
    console.log(`유저아이디 : ${socket.nickname} 방이름 : ${data}`, socket.id);
  });
  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', data);
  });

  socket.on('private message', (data) => {
    socket.to(data.room).to(socket.id).emit('private message', data);
  });

  socket.on('test', (msg) => {
    console.log(msg);
  });

  socket.on('getStatus', async (roomNum) => {
    console.log(roomNum);
    let game = await GameStatus.findOne({
      where: { roomId: roomNum },
      attributes: ['status'],
      raw: true,
    });
    socket.emit('getStatus', game.status);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});
