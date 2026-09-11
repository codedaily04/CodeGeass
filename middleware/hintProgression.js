const progress = new Map();

const hintProgression = (req, res, next) => {
    const userId = req.userId;
    const { slug } = req.params;
    const { hintLevel } = req.body;

    const key = `${userId}:${slug}`;

    const currentLevel = progress.get(key) || 0;

    // First hint must be Level 1
    if (hintLevel !== currentLevel + 1) {
        return res.status(400).json({
            message: `Next hint level must be ${currentLevel + 1}`
        });
    }

    // Store requested level temporarily.
    // Controller will update it only after successful generation.
    req.hintProgressKey = key;
    req.previousHintLevel = currentLevel;

    next();
};

const markHintGenerated = (key, level) => {
    progress.set(key, level);
};

module.exports = {
    hintProgression,
    markHintGenerated,
};