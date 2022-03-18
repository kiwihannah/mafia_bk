const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { swaggerUi, specs } = require('./swagger');
const SocketIO = require('socket.io');
const dotenv = require('dotenv');
dotenv.config();

const port = process.env.PORT || 3000; // 소켓 웹 통합 포트

var session = require('express-session');
const FileStore = require('session-file-store')(session);

const app = express();
const router = express.Router();
var fs = require('fs');
var https = require('https');
// 캡쳐 이미지 경로
// app.use('/', express.static(path.join(__dirname, 'images')));
app.use(
  session({
    saveUninitialized: true,
    resave: false,
    secret: 'MY_SECRET',
    store: new FileStore(),
  })
);
//swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs));

// middlewares
app.use(morgan('dev'));
//app.use(cors({ origin: '*' }));
app.use(cors());
// Parse application/vnd.api+json as json
app.use(
  '/',
  bodyParser.json({
    type: 'application/vnd.api+json',
  }),
  router
);

app.use(
  bodyParser.urlencoded({
    extended: 'true',
  })
); // Parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // Parse application/json

// Listen (start app with node server.js)
var options = {
  key: fs.readFileSync('openvidukey.pem'),
  cert: fs.readFileSync('openviducert.pem'),
};
https.createServer(options, app);

// // connect DataBase
// const db = require('./models');
// db.sequelize
//   .sync()
//   .then(() => {
//     console.log('mafia app DB connected');
//   })
//   .catch(console.error);

app.use(express.static(__dirname + '/public')); // Set the static files location

// router.get('/', (req, res) => {
//   res.send('#4 main proj mafia_bk sever open test');
// });

//socket.io connect
const httpserver = http.createServer(app);
const io = SocketIO(httpserver, {
  cors: {
    origin: '*',
  },
});

// routes
const userRouter = require('./routes/user');
const roomRouter = require('./routes/room');
const gameRouter = require('./routes/game');
const webcamRouter = require('./routes/webRTC');

app.use('/api', [userRouter, roomRouter, gameRouter]);
app.use('/', webcamRouter);

//web, socket port running
httpserver.listen(port, () => {
  console.log(`server listening on ${port}`);
});

module.exports = app;

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

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});
