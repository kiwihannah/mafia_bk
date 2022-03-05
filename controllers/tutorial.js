const tutorials = [
    '1',
    '2',
    '3'
]

module.exports = {
  get: {
    tutorials: async (_, res) => {
      return res.status(200).json({ tutorials });
    },
  },
};
