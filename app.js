const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const fs = require('fs');
const http = require('http');
const helmet = require('helmet');
const dotenv = require('dotenv');

const { swaggerUi, specs } = require('./swagger');
const SocketIO = require('./utils/socket');

dotenv.config();
const port = process.env.PORT || 3000; // 소켓 웹 통합 포트

const app = express();
const router = express.Router();

// middlewares
app.use(helmet());
app.use(morgan('dev'));
app.use(morgan('combined')); // 접속자 ip

app.use(cors({ origin: '*' }));
app.use('/api', bodyParser.json(), router);
app.use(express.static('public'));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs));

//port listen
const httpserver = http.createServer(app).listen(port, () => {
  console.log(`[ web & socket server ] listening on ${port}`);
});

// socket.io connect
SocketIO(httpserver);

// letsencrypt 로 받은 인증서 경로를 입력 ssl
const options = {
  ca: fs.readFileSync(
    '/etc/letsencrypt/live/mafia.milagros.shop/fullchain.pem'
  ),
  key: fs.readFileSync('/etc/letsencrypt/live/mafia.milagros.shop/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/mafia.milagros.shop/cert.pem'),
};

// // const httpserver = http.createServer(app);
// http.createServer(app).listen(port);
// const httpserver = https.createServer(options, app).listen(443, () => {
//   console.log(`[ web & socket server ] listening on ${port}`);
// });
// //socket.io connect
// SocketIO(httpserver, { cors: { origin: '*' } });

// Parse application/vnd.api+json as json
app.use('/', bodyParser.json({ type: 'application/vnd.api+json' }), router);
// Parse application/x-www-form-urlencoded url | 요청시, 이중 json 가능?
app.use(
  bodyParser.urlencoded({
    extended: 'true',
  })
);

// connect DataBase
const db = require('./models');
db.sequelize
  .sync()
  .then(() => {
    console.log('mafia app DB connected');
  })
  .catch(console.error);

router.get('/', (_, res) => {
  res.send('#4 main proj mafia_bk sever open test');
});

// routes
const userRouter = require('./routes/user');
const roomRouter = require('./routes/room');
const gameRouter = require('./routes/game');
const webcamRouter = require('./routes/webRTC');

app.use('/api', [userRouter, roomRouter, gameRouter]);

module.exports = app;
