"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireVerified = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../data/db"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_key_change_in_production';
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    if (!token && req.query.token) {
        token = req.query.token;
    }
    if (!token)
        return res.sendStatus(401); // Unauthorized
    jsonwebtoken_1.default.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err)
            return res.sendStatus(403); // Forbidden
        try {
            const user = await (0, db_1.default)('users').where({ id: decoded.id }).first();
            if (!user)
                return res.sendStatus(403);
            req.user = user;
            next();
        }
        catch (dbError) {
            console.error('Error fetching user in auth middleware', dbError);
            res.sendStatus(500);
        }
    });
};
exports.authenticateToken = authenticateToken;
const requireVerified = (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ error: 'Not authenticated' });
    if (!req.user.verified && !req.user.is_admin) {
        return res.status(403).json({ error: 'NOT_VERIFIED', message: 'Ask admin to allow access' });
    }
    next();
};
exports.requireVerified = requireVerified;
const requireAdmin = (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ error: 'Not authenticated' });
    if (!req.user.is_admin) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
