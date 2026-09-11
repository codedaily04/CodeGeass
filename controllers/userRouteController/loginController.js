const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");

const loginController = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Validate email
        if (email === undefined || email === null) {
            return res.status(400).json({ message: 'Email is required' });
        }

        if (typeof email !== 'string') {
            return res.status(400).json({ message: 'Email must be a string' });
        }

        const trimmedEmail = email.trim();
        if (trimmedEmail.length === 0) {
            return res.status(400).json({ message: 'Email cannot be empty' });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Normalize email (lowercase for case-insensitive lookup)
        const normalizedEmail = trimmedEmail.toLowerCase();

        // Validate password
        if (password === undefined || password === null) {
            return res.status(400).json({ message: 'Password is required' });
        }

        if (typeof password !== 'string') {
            return res.status(400).json({ message: 'Password must be a string' });
        }

        // Look up user with normalized email
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
           return res.status(401).json({ message: 'No user found with this email' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password is incorrect' });
        }
        
        const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json(token);
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = loginController;