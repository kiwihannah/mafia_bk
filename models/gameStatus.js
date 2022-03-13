module.exports = (sequelize, DataTypes) => {
  const GameStatus = sequelize.define(
    'gameStatus',
    {
      roundNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        default: 0,
      },
      spyCnt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        default: 2,
      },
      emplCnt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        default: 4,
      },
    },
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );

  GameStatus.associate = (db) => {
    db.GameStatus.belongsTo(db.Room, { onDelete: 'CASCADE' });
  };

  return GameStatus;
};
