const app = require("../app");
const fs = require("fs");
const sequelize = require("sequelize");
const { Op } = sequelize;
const { User, Room, GameGroup, GameStatus, Vote } = require('../models');

// const options = {
//   letsencrypt로 받은 인증서 경로를 입력
// };

const server = require("http").createServer(app);

// https 실제 배포 시 연결
// const https = require("https").createServer(options, app);

// https 설정 시
// const io = require("socket.io")(https, {
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("playTime", async (data) => {
    const room = await GameStatus.findOne({ where: {roomId: data.roomId} });
    socket.emit(`[system]: ${ room.status }`);
  });
});

// https 연결 시
// module.exports = { server, https };
module.exports = { server };