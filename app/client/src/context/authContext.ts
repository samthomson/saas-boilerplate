import { createContext } from 'react'
import { User } from '@shared/schema'

export interface TRPCError {
	data?: {
		code?: string
		httpStatus?: number
		path?: string
		stack?: string
	}
	message: string
}

export interface AuthContextType {
	user: User | null
	token: string | null
	login: (token: string, user: User) => void
	logout: () => void
	updateUser: (user: User | null) => void
	isAuthenticated: boolean
	isAdmin: boolean
	isUser: boolean
	isAuthStatusKnown: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
