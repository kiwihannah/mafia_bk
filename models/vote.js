module.exports = (sequelize, DataTypes) => {
  const Vote = sequelize.define(
    'vote',
    {
      voter: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      candidacy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      roomId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );

  Vote.associate = (db) => {
    db.Vote.belongsTo(db.GameStatus, { onDelete: 'CASCADE' });
  };

  return Vote;
};
