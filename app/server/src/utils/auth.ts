import { Request, Response, NextFunction } from 'express'
import { verify, sign, Secret, SignOptions } from 'jsonwebtoken'
import logger from '../logger'
import { JWTPayload } from '@shared/schema'

// JWT secret should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'MISSING_JWT_SECRET'

// Helper function to create JWT tokens with standardized payload
export const createToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string = '30d'): string => {
	return sign(payload, JWT_SECRET as Secret, { expiresIn } as SignOptions)
}

// Define the JWT payload type
// export interface JWTPayload {
// 	userId: string;
// 	email: string | null;
// 	name: string | null;
// 	role: 'ADMIN' | 'AGENCY_USER' | 'GUIDE' | 'CLIENT';
// 	agencyId?: string;
// 	iat?: number;
// 	exp?: number;
// }

// Extend Express Request type to include user
declare global {
	namespace Express {
		interface Request {
			user?: JWTPayload;
		}
	}
}

// Middleware to verify JWT token
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
	const authHeader = req.headers.authorization

	if (!authHeader) {
		res.status(401).json({ error: 'No authorization header provided' })
		return
	}

	const token = authHeader.split(' ')[1] // Format: "Bearer TOKEN"

	if (!token) {
		res.status(401).json({ error: 'No token provided' })
		return
	}

	try {
		const decoded = verify(token, JWT_SECRET) as JWTPayload
		req.user = decoded
		next()
	} catch (error) {
		logger.warn('Invalid token', { error })
		res.status(401).json({ error: 'Invalid token' })
	}
} 

export const decodeToken = (token: string): JWTPayload => {
	return verify(token, JWT_SECRET) as JWTPayload
}