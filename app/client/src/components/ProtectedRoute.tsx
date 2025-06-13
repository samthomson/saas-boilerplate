import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context'

// Basic protection - just checks if user is authenticated
export const ProtectedRoute = () => {
	const { isAuthenticated, isAuthStatusKnown } = useAuth()

	if (!isAuthStatusKnown) {
		return <div>Loading...</div>
	}

	return isAuthenticated ? <Outlet /> : <Navigate to="/login" />
}

// Admin route - only allows admin users
export const AdminRoute = () => {
	const { isAdmin, isAuthStatusKnown } = useAuth()

	if (!isAuthStatusKnown) {
		return <div>Loading...</div>
	}

	return isAdmin ? <Outlet /> : <Navigate to="/login" />
}

// Guide route - only allows guide users
export const UserRoute = () => {
	const { isUser, isAuthStatusKnown } = useAuth()

	if (!isAuthStatusKnown) {
		return <div>Loading...</div>
	}

	return isUser ? <Outlet /> : <Navigate to="/login" />
}
