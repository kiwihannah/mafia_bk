const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const { swaggerUi, specs } = require('./swagger')
const port = process.env.PORT; //3000
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const router = express.Router();

// 이미지 경로
// app.use('/', express.static(path.join(__dirname, 'images')));

//swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs));

// middlewares 
app.use(morgan("dev"));
app.use(cors({ origin: "*" }));
app.use("/api", bodyParser.json(), router);

// routes

// connect DataBase
const db = require('./models');
db.sequelize
  .sync()
  .then(() => {
    console.log('alarm app DB connected');
  })
  .catch(console.error);

router.get('/', (req, res) => { res.send('#4 main proj bk_repo'); });

// app.use("/api", postRouter);

app.listen(port, () => { console.log('서버가 켜졌어요!'); });

module.exports = app;
