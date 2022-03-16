/* CONFIGURATION */

var OpenVidu = require('openvidu-node-client').OpenVidu;
var OpenViduRole = require('openvidu-node-client').OpenViduRole;

// Check launch arguments: must receive openvidu-server URL and the secret
if (process.argv.length != 4) {
  console.log('Usage: node ' + __filename + ' OPENVIDU_URL OPENVIDU_SECRET');
  process.exit(-1);
}
// For demo purposes we ignore self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Environment variable: URL where our OpenVidu server is listening
var OPENVIDU_URL = process.argv[2];
// Environment variable: secret shared with our OpenVidu server
var OPENVIDU_SECRET = process.argv[3];

// Entrypoint to OpenVidu Node Client SDK
var OV = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

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
const { User, Room } = require('./models');

const app = express();
const router = express.Router();
var fs = require('fs');
var session = require('express-session');
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
// app.use(
//   bodyParser.json({
//     type: 'application/vnd.api+json',
//   })
// ); // Parse application/vnd.api+json as json

// Listen (start app with node server.js)
var options = {
  key: fs.readFileSync('openvidukey.pem'),
  cert: fs.readFileSync('openviducert.pem'),
};
https.createServer(options, app).listen(5000);

// connect DataBase
const db = require('./models');
db.sequelize
  .sync()
  .then(() => {
    console.log('mafia app DB connected');
  })
  .catch(console.error);
app.use(express.static(__dirname + '/public')); // Set the static files location
// router.get('/', (req, res) => {
//   res.send('#4 main proj mafia_bk sever open test');
// });

router.get('/', (_, res) => {
  res.send('#4 main proj mafia_bk sever open test');
});

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

// Collection to pair session names with OpenVidu Session objects
var mapSessions = {};
// Collection to pair session names with tokens
var mapSessionNamesTokens = {};

// Get token (add new user to session)
app.post('/session', async function (req, res) {
  if (!isLogged(req.session)) {
    req.session.destroy();
    res.status(401).send('User not logged');
  } else {
    // The video-call to connect

    var sessionName = req.body.sessionName;

    let nickname = req.session.loggedUser.nickname;
    //console.log(nickname);

    var role = [{ user: `${nickname}`, role: OpenViduRole.PUBLISHER }];
    //console.log(role);
    // Role associated to this user
    //let user = User.findAll({ where: { nickname } });
    //var role = User.findOne((u) => u.nickname === req.session.loggedUser).role;
    // var role = User.findOne({ where: { nickname } });

    // Optional data to be passed to other users when this user connects to the video-call
    // In this case, a JSON with the value we stored in the req.session object on login
    // var serverData = JSON.stringify({
    //   serverData: req.session.loggedUser.nickname,
    // });
    var serverData = JSON.stringify(nickname);
    console.log(serverData);
    //let role = OpenViduRole.PUBLISHER;
    console.log('Getting a token | {sessionName}={' + sessionName + '}');

    // Build connectionProperties object with the serverData and the role
    var connectionProperties = {
      data: serverData,
      role: OpenViduRole.PUBLISHER,
    };
    //console.log(role.toLowerCase());
    console.log(connectionProperties);

    if (mapSessions[sessionName]) {
      if (mapSessions[sessionName].includes('id')) {
        let sessionName = await Room.findOne({
          raw: true,
          attributes: ['id'],
        });
        console.log(mapSessions[sessionName]);
      }
      console.log(sessionName);
      // Session already exists
      console.log('Existing session ' + sessionName);

      // Get the existing Session from the collection
      var mySession = mapSessions[sessionName];

      // Generate a new token asynchronously with the recently created connectionProperties
      mySession
        .createConnection(connectionProperties)
        .then((connection) => {
          // Store the new token in the collection of tokens
          mapSessionNamesTokens[sessionName].push(connection.token);

          // Return the token to the client
          res.status(200).send({
            0: connection.token,
          });
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      // New session
      console.log('New session ' + sessionName);

      // Create a new OpenVidu Session asynchronously
      OV.createSession()
        .then((session) => {
          // Store the new Session in the collection of Sessions
          mapSessions[sessionName] = session;
          // Store a new empty array in the collection of tokens
          mapSessionNamesTokens[sessionName] = [];

          // Generate a new connection asynchronously with the recently created connectionProperties
          session
            .createConnection(connectionProperties)
            .then((connection) => {
              // Store the new token in the collection of tokens
              mapSessionNamesTokens[sessionName].push(connection.token);

              // Return the Token to the client
              res.status(200).send({
                0: connection.token,
              });
            })
            .catch((error) => {
              console.error(error);
            });
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }
});

// Remove user from session
app.post('/api-sessions/remove-user', function (req, res) {
  if (!isLogged(req.session)) {
    req.session.destroy();
    res.status(401).send('User not logged');
  } else {
    // Retrieve params from POST body
    var sessionName = req.body.sessionName;
    var token = req.body.token;
    console.log(
      'Removing user | {sessionName, token}={' +
        sessionName +
        ', ' +
        token +
        '}'
    );

    // If the session exists
    if (mapSessions[sessionName] && mapSessionNamesTokens[sessionName]) {
      var tokens = mapSessionNamesTokens[sessionName];
      var index = tokens.indexOf(token);

      // If the token exists
      if (index !== -1) {
        // Token removed
        tokens.splice(index, 1);
        console.log(sessionName + ': ' + tokens.toString());
      } else {
        var msg = "Problems in the app server: the TOKEN wasn't valid";
        console.log(msg);
        res.status(500).send(msg);
      }
      if (tokens.length == 0) {
        // Last user left: session must be removed
        console.log(sessionName + ' empty!');
        delete mapSessions[sessionName];
      }
      res.status(200).send();
    } else {
      var msg = 'Problems in the app server: the SESSION does not exist';
      console.log(msg);
      res.status(500).send(msg);
    }
  }
});

/* REST API */

/* AUXILIARY METHODS */

// async function login(user, pass) {
//   user = await User.findOne({ where: { user }, raw: true });
//   console.log(user);
//   return user;
// }

function isLogged(session) {
  console.log(session.loggedUser);
  return session.loggedUser != null;
}
function getBasicAuth() {
  return (
    'Basic ' + new Buffer('OPENVIDUAPP:' + OPENVIDU_SECRET).toString('base64')
  );
}
app.use('/api', [userRouter, roomRouter, gameRouter]);

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
