module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define(
    'log',
    {
      date: {
        type: DataTypes.STRING(8), //2022-03-30
        allowNull: false,
        default: ''
      },
      nicknameCnt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        default: 0
      },
      roomCnt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        default: 0
      },
      onGameCnt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        default: 0
      },
      compGameCnt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        default: 0
      },
      playMemCnt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        default: 0
      },
    },
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );

  return Log;
};
