import React, { useState } from 'react'
// import type { User } from './authContext';
import type { User } from '@shared/schema'
import { AuthContext } from './authContext'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null)
	const [token, setToken] = useState<string | null>(null)
	const [isAuthStatusKnown, setIsAuthStatusKnown] = useState(false)

	// Login function
	const login = (newToken: string, newUser: User) => {
		setToken(newToken)
		setUser(newUser)
		localStorage.setItem('authToken', newToken)
		localStorage.setItem('authUser', JSON.stringify(newUser))
		setTimeout(() => {
			setIsAuthStatusKnown(true)
		}, 100)
	}

	// Logout function
	const logout = () => {
		setIsAuthStatusKnown(true)
		setToken(null)
		setUser(null)
		localStorage.removeItem('authToken')
		localStorage.removeItem('authUser')
	}

	// Update user function
	const updateUser = (updatedUser: User | null) => {
		setUser(updatedUser)
		localStorage.setItem('authUser', JSON.stringify(updatedUser))
		setIsAuthStatusKnown(true)
	}

	const isAuthenticated = !!token && !!user
	const isAdmin = isAuthenticated && user?.role === 'ADMIN'
	const isUser = isAuthenticated && user?.role === 'USER'

	// Don't render anything until we've checked auth
	// if (!isAuthStatusKnown) {
	// 	return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading (Token check)...</div>;
	// }

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				login,
				logout,
				updateUser,
				isAuthenticated,
				isAdmin,
				isUser,
				isAuthStatusKnown,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}
