const { User } = require('../models');

module.exports = {
  create: {
    user: async (data) => {
      nickname = data.nickname;
      const user = await User.create({ nickname });
      return user.nickname;
    },
  },
};
