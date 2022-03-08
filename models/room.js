module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define(
    'room',
    {
      roomName: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      maxPlayer: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      currPlayer: {
        type: DataTypes.INTEGER,
        allowNull: false,
        default: 1,
      },
      hostId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      onPlay: {
        type: DataTypes.TEXT,
        allowNull: false,
        default: 'N',
      },
      roomPwd: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );

  Room.associate = (db) => {
    db.Room.hasMany(db.GameResult);
    db.Room.hasOne(db.GameGroup);
    db.Room.hasMany(db.User);
  };

  return Room;
};
