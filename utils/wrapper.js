module.exports = {
    ControllerAsyncWrapper: asyncFn => {
      return (async (req, res, next) => {
        try {
          return await asyncFn(req, res, next);
        } catch(error) {
          console.error('Error from ControllerAsyncWrapper : ', error);
          if(error.msg) { 
            return res.status(400).json(error);
          }
          return res.status(500).json({ msg: error.message });
        };
      });
    },
  
    ServiceAsyncWrapper: asyncFn => {
      return (async (req, res, next) => {
        try {
          return await asyncFn(req, res, next);
        } catch(error) {
          throw (error);
        };
      });
    },
  };