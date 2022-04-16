const express = require('express');
const SocketIO = require('socket.io');
const { GameStatus, GameGroup, Vote, Log, Room, User } = require('../models');
const { Op } = require('sequelize');

module.exports = (server) => {
  const io = SocketIO(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    console.log('socket connected');
    socket['nickname'] = `Anon`;

    socket.on('join_room', async (data) => {
      const { userId, roomId } = data;
      const socketId = socket.id;

      try {
        socket.join(roomId);
        const prevUser = await GameGroup.findOne({ where: { userId } });
        await prevUser.update({ socketId });

      } catch (error) {
        throw error;
      }
    });

    socket.on('send_message', (data) => {
      console.log(data.socketId);
      
      data.socketId === ''
        ? socket.to(data.roomId).emit('receive_message', data)
        : socket.to(data.socketId).emit('receive_message', data);
      if(data.socketId) console.log('귓속말 emit 보낸 상태', data);
    });

    socket.on('disconnect', () => {
      console.log('User Disconnected', socket.id);
    });

    socket.on('currUsers', async (data) => {
      const { roomId } = data;
      const users = await GameGroup.findAll({ where: { roomId } });

      socket.to(roomId).emit('currUsers', users);
      socket.emit('currUsersToMe', users);
    });

    socket.on('currUsersToMe', async (data) => {
      const { roomId } = data;
      const users = await GameGroup.findAll({ where: { roomId } });

      socket.emit('currUsersToMe', users);
    });

    socket.on('getStatus', async (data) => {
      const { roomId, status } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });
      const gameStatus = await prevStatus.update({ status });

      socket.to(roomId).emit('getStatus', gameStatus);
      socket.emit('getStatusToMe', gameStatus);
    });

    socket.on('getMsg', async (data) => {
      const { roomId, msg } = data;

      socket.to(roomId).emit('getMsg', msg);
      socket.emit('getMsgToMe', msg);
    });

    socket.on('readyCnt', async (data) => {
      const { roomId, userId } = data;
      const readyUser = await GameGroup.findOne({ where: { userId } });
      await readyUser.update({ isReady: 'Y' });
      const users = await GameGroup.findAll({ where: { roomId, isReady: 'Y' } });
      const readyCnt = users.length;

      socket.to(roomId).emit('readyCnt', { readyCnt });
      socket.emit('myReadyCnt', { myReadyCnt: readyCnt });
    });

    socket.on('cancelReady', async (data) => {
      const { roomId, userId } = data;
      const readyUser = await GameGroup.findOne({ where: { userId } });
      await readyUser.update({ isReady: 'N' });
      const users = await GameGroup.findAll({ where: { roomId, isReady: 'Y' } });
      const readyCnt = users.length;

      socket.to(roomId).emit('readyCnt', { readyCnt });
      socket.emit('myReadyCnt', { myReadyCnt: readyCnt });
    });

    socket.on('dayTimeVoteArr', async (data) => {
      const { roomId, userId, candidacy, roundNo } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });
      try {
        if (candidacy !== 0) {
          await Vote.create({
            voter: userId,
            candidacy,
            gameStatusId: prevStatus.id,
            roomId,
            roundNo,
          });
          const candidacyCnt = await Vote.findAll({ where: { candidacy } });
          const data = {
            voter: userId,
            candidacy: candidacy,
            voteCnt: candidacyCnt.length,
          };

          socket.to(roomId).emit('dayTimeVoteArr', data);
          socket.emit('dayTimeVoteArr', data);
        }
      } catch (error) {
        throw error;
      }
    });

    socket.on('getRoundNo', async (data) => {
      const { roomId } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });

      socket.to(roomId).emit('getRoundNo', { roundNo: prevStatus.roundNo });
      socket.emit('getRoundNo', { roundNo: prevStatus.roundNo });
    });

    socket.on('winner', async (data) => {
      const { roomId, userId } = data;
      const prevStatus = await GameStatus.findOne({ where: { roomId } });
      const spyGroup = await GameGroup.findAll({ where: { roomId, role: 4 } });
      const emplGroup = await GameGroup.findAll({
        where: { roomId, role: { [Op.ne]: 4 } },
      });
      const isHost = await GameGroup.findOne({
        where: {
          roomId,
          userId,
          isHost: 'Y',
        },
      });

      const winnerArr = [];
      if (prevStatus.isResult === 2) winnerArr.push(spyGroup);
      if (prevStatus.isResult === 1) winnerArr.push(emplGroup);

      socket.to(roomId).emit('winner', { users: winnerArr[0] });
      socket.emit('winnerToMe', { users: winnerArr[0] });
    });

    socket.on('leaveRoom', (data) => {
      const { roomId } = data;
      socket.leave(roomId);
    });

    socket.on('getRooms', async () => {
      const rooms = await Room.findAll({
        include: {
          model: User,
          attributes: ['id', 'nickname'],
        },
        order: [['createdAt', 'DESC']],
      });

      socket.emit('getRooms', rooms);
    });

  });
};