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
const path = require('path');
const { swaggerUi, specs } = require('./swagger');
const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT; // 4000

var session = require('express-session');

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
  })
);
//swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs));

// middlewares
app.use(morgan('dev'));
app.use(cors({ origin: '*' }));
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
app.use(
  bodyParser.json({
    type: 'application/vnd.api+json',
  })
); // Parse application/vnd.api+json as json

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

// routes
const userRouter = require('./routes/user');
const roomRouter = require('./routes/room');
const tutolRouter = require('./routes/tutorial');

app.use('/api', [userRouter, roomRouter, tutolRouter]);

app.listen(port, () => {
  console.log(`server listening on ${port}`);
});

module.exports = app;
