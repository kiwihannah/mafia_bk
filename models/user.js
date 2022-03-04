module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'user',
    {
      nickname: {
        type: DataTypes.STRING(10),
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
    db.User.belongsTo(db.Room);
    //db.User.hasMany(db.games, { onDelete: "CASCADE" });
    //db.User.hasMany(db.chattings, { onDelete: "CASCADE" });
  };

  return User;
};
