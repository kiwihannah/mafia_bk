const tutoImgs = ['url1', '2', '3'];

const tutorials = ['text1', '2', '3'];

module.exports = {
  get: {
    tutorials: async (_, res) => {
      return res.status(200).json({ tutoImgs, tutorials });
    },
  },
};
