const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const rateLimitReview = require("../../middleware/rateLimitReview");
const getCodeReviewController = require("../../controllers/userRouteController/getCodeReviewController");

router.post(
    "/review/:slug",
    auth,
    rateLimitReview,
    getCodeReviewController
);

module.exports = router;