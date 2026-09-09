const express = require("express");
const router = express.Router();

const getHintController = require("../../controllers/userRouteController/getHintController");

router.post("/hint/:slug", getHintController);

module.exports = router;