module.exports = (sequelize, DataTypes) => {
  const GameResult = sequelize.define(
    'gameResult',
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

  GameResult.associate = (db) => {
    db.GameResult.belongsTo(db.Room, { onDelete: 'CASCADE' });
  };

  return GameResult;
};
