import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../data/db';
import { authenticateToken, AuthRequest } from '../middlewares/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_key_change_in_production';

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const existingUser = await db('users').where({ username }).first();
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        
        // If this is the first user, make them admin and verified automatically
        const userCount = await db('users').count('id as count').first();
        const isFirstUser = parseInt(userCount?.count as string) === 0;

        const [newUser] = await db('users').insert({
            username,
            password_hash,
            is_admin: isFirstUser,
            verified: isFirstUser,
        }).returning(['id', 'username', 'is_admin', 'verified']);

        res.status(201).json({ message: 'Registration successful', user: newUser });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await db('users').where({ username }).first();
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, is_admin: user.is_admin, verified: user.verified },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                is_admin: user.is_admin,
                verified: user.verified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user (Me)
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    
    res.json({
        id: req.user.id,
        username: req.user.username,
        is_admin: req.user.is_admin,
        verified: req.user.verified
    });
});

export default router;
