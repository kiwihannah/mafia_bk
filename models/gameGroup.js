module.exports = (sequelize, DataTypes) => {
  const GameGroup = sequelize.define( 
    'gameGroup',
    {
      isReady: {
        type: DataTypes.STRING(2),
        allowNull: false,
        default: 'N',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      role: { // 시민 {일개미: 1, 변호사: 2, 탐정: 3}, 스파이: 4
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isEliminated: {
        type: DataTypes.STRING(2), 
        allowNull: false,
        default: 'N',
      },
      isAi: {
        type: DataTypes.STRING(2),
        allowNull: false,
        default: 'N',
      },
      isHost: {
        type: DataTypes.STRING(2),
        allowNull: false,
        default: 'N',
      },
      isProtected: {
        type: DataTypes.STRING(2),
        allowNull: true,
        default: 'N',
      },
    },
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );

  GameGroup.associate = (db) => {
    db.GameGroup.belongsTo(db.Room, { onDelete: 'CASCADE' });
    db.GameGroup.hasMany(db.User);
  };

  return GameGroup;
};
