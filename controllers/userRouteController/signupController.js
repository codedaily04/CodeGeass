const bcrypt = require("bcrypt");
const User = require("../../models/user");

const signupController = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Validate name
        if (name === undefined || name === null) {
            return res.status(400).json({ message: 'Name is required' });
        }

        if (typeof name !== 'string') {
            return res.status(400).json({ message: 'Name must be a string' });
        }

        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            return res.status(400).json({ message: 'Name cannot be empty' });
        }

        if (trimmedName.length > 100) {
            return res.status(400).json({ message: 'Name is too long. Maximum 100 characters allowed' });
        }

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

        // Normalize email (lowercase for case-insensitive comparison)
        const normalizedEmail = trimmedEmail.toLowerCase();

        // Validate password
        if (password === undefined || password === null) {
            return res.status(400).json({ message: 'Password is required' });
        }

        if (typeof password !== 'string') {
            return res.status(400).json({ message: 'Password must be a string' });
        }

        if (password.trim().length === 0) {
            return res.status(400).json({ message: 'Password cannot be empty' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        // Check if user already exists (case-insensitive)
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }
        
        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new User
        const user = new User({ 
            name: trimmedName, 
            email: normalizedEmail, 
            password: hashedPassword 
        });

        await user.save();
        res.json("success");
    } catch (error) {
        console.error("Signup error:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = signupController;