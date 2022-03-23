const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const dotenv = require('dotenv');

const { swaggerUi, specs } = require('./swagger');

dotenv.config();
const port = process.env.PORT || 3000; // 소켓 웹 통합 포트

const app = express();
const router = express.Router();

// middlewares
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: '*' }));
app.use('/api', bodyParser.json(), router);
app.use(express.static('public'));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs));

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

app.use('/api', [userRouter, roomRouter, gameRouter]);
const httpServer = http.createServer(app).listen(port, () => {
  console.log(`[ web & socket server ] listening on ${port}`);
});
const io = require('./utils/socket').init(httpServer);
io.on('connection', (socket) => {
  console.log('socket on');
});

module.exports = app;
