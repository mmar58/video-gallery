"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../data/db"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
router.use(auth_1.requireAdmin);
// USERS MANAGEMENT
router.get('/users', async (req, res) => {
    try {
        const users = await (0, db_1.default)('users').select('id', 'username', 'is_admin', 'verified', 'created_at');
        res.json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
router.put('/users/:id/verify', async (req, res) => {
    try {
        const { verified } = req.body;
        await (0, db_1.default)('users').where({ id: req.params.id }).update({ verified: !!verified });
        res.json({ success: true, verified: !!verified });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});
router.put('/users/:id/admin', async (req, res) => {
    try {
        const { is_admin } = req.body;
        await (0, db_1.default)('users').where({ id: req.params.id }).update({ is_admin: !!is_admin });
        res.json({ success: true, is_admin: !!is_admin });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});
// ROOT DIRECTORY MANAGEMENT
router.get('/directories', async (req, res) => {
    try {
        const dirs = await (0, db_1.default)('root_directories').select('*');
        // Scan to see if they exist
        const dirsWithStatus = dirs.map(dir => ({
            ...dir,
            exists: fs_1.default.existsSync(dir.path)
        }));
        res.json(dirsWithStatus);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch directories' });
    }
});
router.post('/directories', async (req, res) => {
    try {
        const { name, path } = req.body;
        if (!name || !path)
            return res.status(400).json({ error: 'Name and path required' });
        if (!fs_1.default.existsSync(path)) {
            return res.status(400).json({ error: 'Directory does not exist on disk' });
        }
        const [newDir] = await (0, db_1.default)('root_directories').insert({ name, path }).returning('*');
        res.status(201).json(newDir);
    }
    catch (error) {
        if (error.code === '23505' || error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'Directory path already exists' });
        }
        res.status(500).json({ error: 'Failed to add directory' });
    }
});
router.delete('/directories/:id', async (req, res) => {
    try {
        await (0, db_1.default)('root_directories').where({ id: req.params.id }).delete();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete directory' });
    }
});
// PERMISSIONS MANAGEMENT
router.get('/users/:userId/permissions', async (req, res) => {
    try {
        const permissions = await (0, db_1.default)('user_directory_permissions')
            .where({ user_id: req.params.userId })
            .select('*');
        res.json(permissions);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
});
router.post('/users/:userId/permissions', async (req, res) => {
    try {
        const { directory_id, is_hidden } = req.body;
        await (0, db_1.default)('user_directory_permissions')
            .insert({ user_id: req.params.userId, directory_id, is_hidden })
            .onConflict(['user_id', 'directory_id'])
            .merge({ is_hidden });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update permissions' });
    }
});
// SYSTEM SCAN (Check for missing directories)
router.get('/scan-missing', async (req, res) => {
    try {
        const dirs = await (0, db_1.default)('root_directories').select('*');
        const missingDirs = dirs.filter(dir => !fs_1.default.existsSync(dir.path));
        res.json({ missing: missingDirs });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to scan directories' });
    }
});
router.post('/directories/:id/cleanup', async (req, res) => {
    try {
        const dir = await (0, db_1.default)('root_directories').where({ id: req.params.id }).first();
        if (!dir)
            return res.status(404).json({ error: 'Directory not found' });
        if (fs_1.default.existsSync(dir.path)) {
            return res.status(400).json({ error: 'Directory still exists on disk. Cannot cleanup.' });
        }
        // This will cascade delete videos and permissions related to this directory_id
        await (0, db_1.default)('root_directories').where({ id: req.params.id }).delete();
        res.json({ success: true, message: 'Directory and related data cleaned up' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to cleanup directory' });
    }
});
exports.default = router;
