import express from 'express';
import db from '../data/db';
import fs from 'fs';
import { authenticateToken, requireAdmin, AuthRequest } from '../middlewares/auth';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// USERS MANAGEMENT
router.get('/users', async (req, res) => {
    try {
        const users = await db('users').select('id', 'username', 'is_admin', 'verified', 'created_at');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.put('/users/:id/verify', async (req, res) => {
    try {
        const { verified } = req.body;
        await db('users').where({ id: req.params.id }).update({ verified: !!verified });
        res.json({ success: true, verified: !!verified });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.put('/users/:id/admin', async (req, res) => {
    try {
        const { is_admin } = req.body;
        await db('users').where({ id: req.params.id }).update({ is_admin: !!is_admin });
        res.json({ success: true, is_admin: !!is_admin });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// ROOT DIRECTORY MANAGEMENT
router.get('/directories', async (req, res) => {
    try {
        const dirs = await db('root_directories').select('*');
        
        // Scan to see if they exist
        const dirsWithStatus = dirs.map(dir => ({
            ...dir,
            exists: fs.existsSync(dir.path)
        }));
        
        res.json(dirsWithStatus);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch directories' });
    }
});

router.post('/directories', async (req, res) => {
    try {
        const { name, path } = req.body;
        if (!name || !path) return res.status(400).json({ error: 'Name and path required' });
        
        if (!fs.existsSync(path)) {
            return res.status(400).json({ error: 'Directory does not exist on disk' });
        }

        const [newDir] = await db('root_directories').insert({ name, path }).returning('*');
        res.status(201).json(newDir);
    } catch (error: any) {
        if (error.code === '23505' || error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'Directory path already exists' });
        }
        res.status(500).json({ error: 'Failed to add directory' });
    }
});

router.delete('/directories/:id', async (req, res) => {
    try {
        await db('root_directories').where({ id: req.params.id }).delete();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete directory' });
    }
});

// PERMISSIONS MANAGEMENT
router.get('/users/:userId/permissions', async (req, res) => {
    try {
        const permissions = await db('user_directory_permissions')
            .where({ user_id: req.params.userId })
            .select('*');
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
});

router.post('/users/:userId/permissions', async (req, res) => {
    try {
        const { directory_id, is_hidden } = req.body;
        
        await db('user_directory_permissions')
            .insert({ user_id: req.params.userId, directory_id, is_hidden })
            .onConflict(['user_id', 'directory_id'])
            .merge({ is_hidden });
            
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update permissions' });
    }
});

// SYSTEM SCAN (Check for missing directories)
router.get('/scan-missing', async (req, res) => {
    try {
        const dirs = await db('root_directories').select('*');
        const missingDirs = dirs.filter(dir => !fs.existsSync(dir.path));
        
        res.json({ missing: missingDirs });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scan directories' });
    }
});

router.post('/directories/:id/cleanup', async (req, res) => {
    try {
        const dir = await db('root_directories').where({ id: req.params.id }).first();
        if (!dir) return res.status(404).json({ error: 'Directory not found' });
        
        if (fs.existsSync(dir.path)) {
            return res.status(400).json({ error: 'Directory still exists on disk. Cannot cleanup.' });
        }
        
        // This will cascade delete videos and permissions related to this directory_id
        await db('root_directories').where({ id: req.params.id }).delete();
        
        res.json({ success: true, message: 'Directory and related data cleaned up' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cleanup directory' });
    }
});

export default router;
