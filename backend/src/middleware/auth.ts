import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ideatech_secret_key_for_jwt_2026_itimp';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'SUPER_ADMIN' | 'HR_MANAGER' | 'TEAM_LEADER' | 'PROJECT_MANAGER' | 'MENTOR' | 'INTERN';
    firstName: string;
    lastName: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest['user'];
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

export function authorizeRoles(roles: Array<'SUPER_ADMIN' | 'HR_MANAGER' | 'TEAM_LEADER' | 'PROJECT_MANAGER' | 'MENTOR' | 'INTERN'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. User context missing.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
    }

    next();
  };
}
