const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const rateLimitHint = require("../../middleware/rateLimitHint");
const { hintProgression } = require("../../middleware/hintProgression");
const getHintController = require("../../controllers/userRouteController/getHintController");

router.post(
    "/hint/:slug",
    auth,
    rateLimitHint,
    hintProgression,
    getHintController
);

module.exports = router;