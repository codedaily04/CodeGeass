const Problem = require("../../models/problem");
const { generateCodeReview } = require("../../services/aiCodeReviewService");

const getCodeReviewController = async (req, res) => {
    try {
        const { slug } = req.params;
        const { code, language } = req.body;

        // Validate input types
        if (typeof code !== "string") {
            return res.status(400).json({
                message: "Code must be a string"
            });
        }

        if (typeof language !== "string") {
            return res.status(400).json({
                message: "Language must be a string"
            });
        }

        // Only languages supported by the platform
        const allowedLanguages = ["cpp", "py"];

        if (!allowedLanguages.includes(language)) {
            return res.status(400).json({
                message: "Unsupported language. Allowed: cpp, py"
            });
        }

        // Prevent excessively large requests
        if (code.length > 20000) {
            return res.status(400).json({
                message: "Code too large. Maximum 20000 characters allowed."
            });
        }

        // Only fetch information the AI actually needs
        const problem = await Problem
            .findOne({ slug })
            .select("title difficulty description");

        if (!problem) {
            return res.status(404).json({
                message: "Problem not found"
            });
        }

        const review = await generateCodeReview(
            problem,
            code,
            language
        );

        return res.status(200).json({
            review
        });

    } catch (err) {
        console.error("Code Review Controller Error:", err);

        return res.status(500).json({
            message: "Unable to generate code review"
        });
    }
};

module.exports = getCodeReviewController;