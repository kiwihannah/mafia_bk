var OpenViduRole = require('openvidu-node-client').OpenViduRole;

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'user',
    {
      nickname: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false,
      },
    },
    {
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

  User.associate = (db) => {
    db.User.belongsTo(db.GameGroup);
    db.User.belongsTo(db.Room);
  };

  return User;
};
