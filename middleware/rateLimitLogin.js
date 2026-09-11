// In-memory rate limiter for login endpoint
// Tracks login attempts by client IP address

const loginAttempts = new Map();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

const rateLimitLogin = (req, res, next) => {
    // Get client IP address
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    const now = Date.now();

    // Get existing record for this IP
    const record = loginAttempts.get(clientIp);

    // If no record or window expired, create new record
    if (!record || now - record.startTime >= WINDOW_MS) {
        loginAttempts.set(clientIp, {
            startTime: now,
            count: 1
        });
        return next();
    }

    // Check if limit exceeded
    if (record.count >= MAX_REQUESTS) {
        return res.status(429).json({
            message: "Too many login attempts. Try again later."
        });
    }

    // Increment count and continue
    record.count += 1;
    next();
};

// Cleanup old records periodically (every 2 minutes)
setInterval(() => {
    const now = Date.now();

    for (const [ip, record] of loginAttempts.entries()) {
        if (now - record.startTime >= WINDOW_MS) {
            loginAttempts.delete(ip);
        }
    }
}, 2 * 60 * 1000);

module.exports = rateLimitLogin;
