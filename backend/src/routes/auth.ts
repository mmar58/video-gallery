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
        const { username, password, lowBandwidth } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        let user = await db('users').where({ username }).first();
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (lowBandwidth !== undefined && typeof lowBandwidth === 'boolean') {
            await db('users').where({ id: user.id }).update({ low_bandwidth: lowBandwidth });
            user.low_bandwidth = lowBandwidth;
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, is_admin: user.is_admin, verified: user.verified, low_bandwidth: user.low_bandwidth },
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
                verified: user.verified,
                low_bandwidth: user.low_bandwidth
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user (Me)
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    
    // Fetch latest user data to ensure we have up to date preferences
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
        id: user.id,
        username: user.username,
        is_admin: user.is_admin,
        verified: user.verified,
        low_bandwidth: user.low_bandwidth
    });
});

// Update current user settings
router.put('/me/settings', authenticateToken, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { lowBandwidth } = req.body;
    
    try {
        const updates: any = {};
        if (lowBandwidth !== undefined && typeof lowBandwidth === 'boolean') {
            updates.low_bandwidth = lowBandwidth;
        }

        if (Object.keys(updates).length > 0) {
            await db('users').where({ id: req.user.id }).update(updates);
        }

        const user = await db('users').where({ id: req.user.id }).first();
        res.json({
            id: user.id,
            username: user.username,
            is_admin: user.is_admin,
            verified: user.verified,
            low_bandwidth: user.low_bandwidth
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
