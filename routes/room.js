const express = require('express');
const router = express.Router();

const RoomController = require("../controllers/room");

router.post('/room', RoomController.create.room);

module.exports = router;