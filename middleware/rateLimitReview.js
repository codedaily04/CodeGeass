const requests = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;

const rateLimitReview = (req, res, next) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const now = Date.now();

    const record = requests.get(userId);

    if (!record || now - record.startTime >= WINDOW_MS) {
        requests.set(userId, {
            startTime: now,
            count: 1
        });

        return next();
    }

    if (record.count >= MAX_REQUESTS) {
        return res.status(429).json({
            message: "Too many code review requests. Try again later."
        });
    }

    record.count += 1;

    next();
};

// Cleanup old records periodically
setInterval(() => {
    const now = Date.now();

    for (const [userId, record] of requests.entries()) {
        if (now - record.startTime >= WINDOW_MS) {
            requests.delete(userId);
        }
    }
}, 2 * 60 * 1000);

module.exports = rateLimitReview;