const { GameGroup, GameStatus } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  SelectOneUser: async (roomId, userId) => {
    const userlist = await GameGroup.findAll({
      where: {
        roomId,
        isEliminated: { [Op.like]: 'N%' },
      },
    });

    let userArr = [], selectedUserId = 0; 
    userlist.map((user) => {
      userArr.push(user.userId);
    });

    userId
        ? selectedUserId = userId
        : selectedUserId = userArr[Math.floor(Math.random() * userArr.length)];

    const prevUser = await GameGroup.findOne({
      where: {
        userId: selectedUserId,
        isEliminated: { [Op.like]: 'N%' },
      },
    });

    return prevUser;
  },

  IsLaywerDone: async (roomId) => {
    const prevStatus = await GameStatus.findOne({ where: { roomId } });

    const isProtected = await GameGroup.findOne({
      where: {
        roomId,
        isProtected: { [Op.like]: `%${prevStatus.roundNo}` },
      },
    });

    return isProtected ? true : false;
  },

  IsSpyDone: async (roomId) => {
    const prevStatus = await GameStatus.findOne({ where: { roomId } });

    const isEliminated = await GameGroup.findOne({
      where: {
        roomId,
        isEliminated: { [Op.like]: `%${prevStatus.roundNo}` },
      },
    });

    return isEliminated ? true : false;
  },

  IsAlive: async (roomId, isAi, role) => {
    const isEliminated = await GameGroup.findOne({
      where: {
        roomId,
        isEliminated: { [Op.like]: '%N%' },
        isAi,
        role,
      },
    });

    return isEliminated ? true : false;
  },

  IsHost: async (userId) => {
    const isHost = await GameGroup.findOne({ where: { userId } });
    return isHost ? true : false;
  },
  
  IsResult: async (roomId) => {
    const userlist = await GameGroup.findAll({
      where: {
        roomId,
        isEliminated: { [Op.like]: 'N%' },
      },
    });

    let tempSpyArr = [],
      tempEmplArr = [];
    let result = 0;
    for (let i = 0; i < userlist.length; i++) {
      userlist[i].role === 4
        ? tempSpyArr.push(userlist[i].userId)
        : tempEmplArr.push(userlist[i].userId);
    }

    if (tempEmplArr.length <= tempSpyArr.length) result = 2;
    else if (tempSpyArr.length === 0) result = 1;
    else result = 0;

    return result;
  },
};
