import { inferAsyncReturnType } from '@trpc/server'
import { verify } from 'jsonwebtoken'
import { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import logger from './logger'
import { JWTPayload } from '@shared/schema'

// JWT secret should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'MISSING_JWT_SECRET'

// export interface JWTPayload {
// 	userId: string;
// 	email: string | null;
// 	name: string | null;
// 	role: string;
// 	// agencyId?: string;
// 	agency?: {
// 		id: string;
// 		name: string;
// 	}
// }

export const createContext = ({ req, res }: CreateExpressContextOptions) => {
	// Get the token from the Authorization header
	const authHeader = req.headers.authorization
	let user: JWTPayload | null = null

	if (authHeader) {
		const token = authHeader.split(' ')[1] // Format: "Bearer TOKEN"

		try {
			// Verify and decode the token
			const decoded = verify(token, JWT_SECRET) as JWTPayload
			user = decoded
		} catch (error) {
			// Token is invalid, user will remain null
			logger.error('Invalid token in createContext:', error)
		}
	}

	return { req, res, user }
}

export type Context = inferAsyncReturnType<typeof createContext>; 