import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../data/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_key_change_in_production';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    
    if (!token && req.query.token) {
        token = req.query.token as string;
    }

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        
        try {
            const user = await db('users').where({ id: decoded.id }).first();
            if (!user) return res.status(403).json({ error: 'Forbidden' });
            
            req.user = user;
            next();
        } catch (dbError) {
            console.error('Error fetching user in auth middleware', dbError);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
};

export const requireVerified = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!req.user.verified && !req.user.is_admin) {
        return res.status(403).json({ error: 'NOT_VERIFIED', message: 'Ask admin to allow access' });
    }
    next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!req.user.is_admin) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin access required' });
    }
    next();
};
