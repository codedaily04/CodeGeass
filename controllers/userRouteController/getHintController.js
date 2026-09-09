const Problem = require("../../models/problem");
const { generateHint } = require("../../services/aiHintService");

const SUPPORTED_LANGUAGES = ['cpp', 'py'];
const MAX_CODE_LENGTH = 20000;

const getHintController = async (req, res) => {
    try {
        const { slug } = req.params;
        const { code, language } = req.body;

        // Validate code field
        if (code === undefined || code === null) {
            return res.status(400).json({
                message: "Code is required"
            });
        }

        if (typeof code !== 'string') {
            return res.status(400).json({
                message: "Code must be a string"
            });
        }

        // Allow empty code for conceptual hints
        if (code.length > MAX_CODE_LENGTH) {
            return res.status(400).json({
                message: `Code too large. Maximum ${MAX_CODE_LENGTH} characters allowed.`
            });
        }

        // Validate language field
        if (!language) {
            return res.status(400).json({
                message: "Language is required"
            });
        }

        if (typeof language !== 'string') {
            return res.status(400).json({
                message: "Language must be a string"
            });
        }

        if (!SUPPORTED_LANGUAGES.includes(language)) {
            return res.status(400).json({
                message: `Unsupported language. Allowed: ${SUPPORTED_LANGUAGES.join(', ')}`
            });
        }

        // Fetch problem - select ONLY safe fields (never input/output)
        const problem = await Problem.findOne({ slug })
            .select('title difficulty description');

        if (!problem) {
            return res.status(404).json({
                message: "Problem not found"
            });
        }

        // Generate personalized AI hint
        const hint = await generateHint(
            problem,
            code,
            language
        );

        return res.status(200).json({
            hint
        });

    } catch (error) {
        console.error("AI HINT ERROR:", error.message || error);

        // Don't expose internal error details to client
        return res.status(500).json({
            message: "Failed to generate hint. Please try again later."
        });
    }
};

module.exports = getHintController;