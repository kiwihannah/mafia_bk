const dotenv = require('dotenv');
dotenv.config();
let { DOMAIN_OR_PUBLIC_IP, OPENVIDU_SECRET } = process.env;
/* CONFIGURATION */

var OpenVidu = require('openvidu-node-client').OpenVidu;

// 테스트할때는 오픈비듀 서버를 함께 실행해야하기때문에 node app.js localhost:4443 mysecret 같이 4자리수 아니면 서버 실행 못하게 하는코드
// if (process.argv.length != 4) {
//   console.log('Usage: node ' + __filename + ' OPENVIDU_URL OPENVIDU_SECRET');
//   process.exit(-1);
// }
//데모 테스트용(https등 무시)
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 환경변수 OPENVIDU URL/SECRET 읽는 환경변수 (테스트용일때)
// var OPENVIDU_URL = process.argv[2];
// var OPENVIDU_SECRET = process.argv[3];

// Entrypoint to OpenVidu Node Client SDK
var OV = new OpenVidu(DOMAIN_OR_PUBLIC_IP, OPENVIDU_SECRET);
console.log(DOMAIN_OR_PUBLIC_IP);
console.log(OPENVIDU_SECRET);

const express = require('express');
const router = express.Router();
var OpenViduRole = require('openvidu-node-client').OpenViduRole;
const { Room } = require('../models/');

// Collection to pair session names with OpenVidu Session objects
var mapSessions = {};
// Collection to pair session names with tokens
var mapSessionNamesTokens = {};

// Get token (add new user to session)
router.post('/session', async function (req, res) {
  if (!isLogged(req.session)) {
    req.session.destroy();
    res.status(401).send('User not logged');
  } else {
    // The video-call to connect
    let sessionName = req.body.sessionName;

    //var sessionName = req.body.sessionName;
    let findDBsessionName = await Room.findAll({
      raw: true,
      attributes: ['id'],
    });
    console.log(findDBsessionName);
    let nickname = req.session.loggedUser.nickname;
    //console.log(nickname);

    var role = [{ user: `${nickname}`, role: OpenViduRole.PUBLISHER }];
 
    // req.session에 사용자를 서버측에서 임의로 JSON화 하여 저장
    var serverData = JSON.stringify(nickname);
    console.log(serverData);
    //let role = OpenViduRole.PUBLISHER;
    console.log('Getting a token | {sessionName}={' + sessionName + '}');

    //세션에 참여한 사용자에게 역할부여 {사용자:이름,역할:publisher가 되는셈}
    var connectionProperties = {
      data: serverData,
      role: OpenViduRole.PUBLISHER,
    };
    
    console.log(connectionProperties);
    if (findDBsessionName === sessionName) {
      if (mapSessions[sessionName]) {
        console.log(sessionName);
        // 세션이존재하면
        console.log('Existing session ' + sessionName);

        // 기존있는 세션병합
        var mySession = mapSessions[sessionName];

        // 새로운 토큰생성하여 병합된 세션에 던저주기
        mySession
          .createConnection(connectionProperties)
          .then((connection) => {
            //새로운 토큰을 세션이름과 토큰들 배열에 저장
            mapSessionNamesTokens[sessionName].push(connection.token);

            // 사용자에게 토큰넘김
            res.status(200).send({
              0: connection.token,
            });
          })
          .catch((error) => {
            console.error(error);
          });
        console.log(mapSessions[sessionName]);
      }
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
router.post('/api-sessions/remove-user', function (req, res) {
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



function isLogged(session) {
  console.log(session.loggedUser);
  return session.loggedUser != null;
}


module.exports = router;
