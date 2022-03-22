module.exports = {
  ControllerAsyncWrapper: (asyncFn) => {
    return async (req, res, next) => {
      try {
        return await asyncFn(req, res, next);
      } catch (error) {
        console.error('Error from ControllerAsyncWrapper : ', error);
        return !error.msg
          ? res.status(500).json({ msg: error.message })
          : res.status(400).json(error);
      }
    };
  },

  ServiceAsyncWrapper: (asyncFn) => {
    return async (req, res, next) => {
      try {
        return await asyncFn(req, res, next);
      } catch (error) {
        throw error;
      }
    };
  },
};
