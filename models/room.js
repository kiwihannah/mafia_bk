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
        type: DataTypes.INTEGER, // ++, -- 계산
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
        default: 'N', //Y or N
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
    db.Room.hasMany(db.User);
    // db.Room.hasMany(db.game, { onDelete: "CASCADE" });
  };
  return Room;
};
