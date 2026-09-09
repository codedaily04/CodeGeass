const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const rateLimitHint = require("../../middleware/rateLimitHint");

const getHintController = require("../../controllers/userRouteController/getHintController");

router.post("/hint/:slug", auth, rateLimitHint, getHintController);

module.exports = router;