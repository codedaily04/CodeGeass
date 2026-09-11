const express = require("express");
const router = express.Router();

const rateLimitLogin = require("../../middleware/rateLimitLogin");
const loginController = require("../../controllers/userRouteController/loginController");

router.post('/login', rateLimitLogin, loginController);

module.exports = router;