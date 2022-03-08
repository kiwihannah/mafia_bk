module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'user',
    {
      nickname: {
        type: DataTypes.STRING(15),
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
    db.GameGroup.belongsTo(db.GameGroup);
  };

  return User;
};
