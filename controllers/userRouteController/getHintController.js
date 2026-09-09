const Problem = require("../../models/problem");
const { generateHint } = require("../../services/aiHintService");

const getHintController = async (req, res) => {
    try {
        const { slug } = req.params;
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                message: "Code and language are required"
            });
        }

        // Fetch trusted problem from database
        const problem = await Problem.findOne({ slug });

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
        console.error("AI HINT ERROR:", error);

        return res.status(500).json({
            message: "Failed to generate hint"
        });
    }
};

module.exports = getHintController;