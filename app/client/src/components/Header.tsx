import { Link } from 'react-router-dom'
import { useAuth } from '../context'
import './Header.css'

const Header = () => {
	const { isAuthenticated, user, logout } = useAuth()

	// Determine the dashboard URL based on user role
	const getDashboardUrl = () => {
		if (!user) return '/login'

		switch (user.role) {
			case 'ADMIN':
				return '/admin/dashboard'
			case 'USER':
				return '/user'
			default:
				return '/login'
		}
	}

	return (
		<header className="header">
			<div className="header-content">
				<div className="brand">
					<Link to="/">[todo: app name]</Link>
				</div>
				<nav className="nav">
					{isAuthenticated ? (
						<>
							<Link to={getDashboardUrl()}>Dashboard</Link>
							<span>Hello, {user?.email}</span>
							<button onClick={logout} className="logout-button">
								Logout
							</button>
						</>
					) : (
						<>
							<Link to="/">Home</Link>
							<Link to="/login">Login</Link>
							<Link to="/register">Register</Link>
						</>
					)}
				</nav>
			</div>
		</header>
	)
}

export default Header
