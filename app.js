const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const { swaggerUi, specs } = require('./swagger')
const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT; // 4000

const app = express();
const router = express.Router();  

// 캡쳐 이미지 경로
// app.use('/', express.static(path.join(__dirname, 'images')));

//swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs));

// middlewares 
app.use(morgan("dev"));
app.use(cors({ origin: "*" }));
app.use("/api", bodyParser.json(), router);

// connect DataBase
const db = require('./models');
db.sequelize
  .sync()
  .then(() => {
    console.log('mafia app DB connected');
  })
  .catch(console.error);

router.get('/', (req, res) => { res.send('#4 main proj mafia_bk sever open test'); });

// routes
const userRouter = require("./routes/user");
const roomRouter = require("./routes/room");
const tutolRouter = require("./routes/tutorial");

app.use("/api", [ userRouter, roomRouter, tutolRouter ]);

app.listen(port, () => { console.log(`server listening on ${port}`); });

module.exports = app;
 