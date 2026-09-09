// Simple in-memory rate limiter for AI hint endpoint
// Limit: 5 requests per user per minute

const requestCounts = new Map();

// Clean up old entries every 2 minutes
setInterval(() => {
    const now = Date.now();
    const TWO_MINUTES = 2 * 60 * 1000;
    
    for (const [key, data] of requestCounts.entries()) {
        if (now - data.windowStart > TWO_MINUTES) {
            requestCounts.delete(key);
        }
    }
}, 120000);

const rateLimitHint = (req, res, next) => {
    const userId = req.userId; // Set by auth middleware
    const now = Date.now();
    const WINDOW_MS = 60 * 1000; // 1 minute
    const MAX_REQUESTS = 5;

    if (!requestCounts.has(userId)) {
        requestCounts.set(userId, {
            count: 1,
            windowStart: now
        });
        return next();
    }

    const userRequests = requestCounts.get(userId);
    const timeSinceWindowStart = now - userRequests.windowStart;

    // Reset window if expired
    if (timeSinceWindowStart > WINDOW_MS) {
        requestCounts.set(userId, {
            count: 1,
            windowStart: now
        });
        return next();
    }

    // Check if limit exceeded
    if (userRequests.count >= MAX_REQUESTS) {
        return res.status(429).json({
            message: "Too many hint requests. Please try again later."
        });
    }

    // Increment count
    userRequests.count++;
    next();
};

module.exports = rateLimitHint;
