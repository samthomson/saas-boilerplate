import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider, useIsFetching } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { trpc, createTrpcClient } from './trpc'
import { AuthProvider, useAuth } from './context'
import { AdminRoute, UserRoute } from './components/ProtectedRoute'
import { MantineProvider, createTheme, Loader } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import {
	NavigationProgress,
	startNavigationProgress,
	completeNavigationProgress,
} from '@mantine/nprogress'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import 'react-phone-input-2/lib/style.css'
import '@mantine/nprogress/styles.css'

import { AuthLayout } from './layouts/AuthLayout'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UsersListPage from './pages/UsersListPage'
import AdminEmailsPage from './pages/AdminEmailsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import UserDashboard from './pages/UserDashboard'
// import TeamPage from './pages/TeamPage'
import CheckToken from './context/CheckToken'

// Create theme with custom primary color
const theme = createTheme({
	primaryColor: 'brand', // #2379FA
	primaryShade: 4,
	colors: {
		brand: [
			'#F50000', // 1
			'#E60000', // 2
			'#CC0000', // 3
			'#B30000', // 4 - overloaded to this one
			'#990000', // 5
			'#800000', // 6
			'#700000', // 7
			'#610000', // this is the default
			'#520000',
			'#420000',
			'#3D0000',
		],
	},
})

export const ACCENT_COLOUR = theme.colors?.brand?.[4] as string

function ProgressHandler() {
	const isFetching = useIsFetching()

	useEffect(() => {
		if (isFetching > 0) {
			startNavigationProgress()
		} else {
			completeNavigationProgress()
		}
	}, [isFetching])

	return null
}

function AppContent() {
	const { token, isAuthenticated, user, isAuthStatusKnown, logout } = useAuth()
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						refetchOnWindowFocus: false,
					},
				},
			}),
	)
	const [trpcClient, setTrpcClient] = useState(() =>
		!(isAuthStatusKnown && isAuthenticated && token) ? null : createTrpcClient(token, logout),
	)

	// Update TRPC client when token changes OR when loading completes
	useEffect(() => {
		// if (!authLoading) {
		setTrpcClient(createTrpcClient(token, logout))
		// }
	}, [token, logout])

	// Determine where the root route should redirect to
	const getRootRedirect = () => {
		if (!isAuthenticated) return '/login'
		if (user?.role === 'ADMIN') return '/admin/users'
		if (user?.role === 'USER') return '/user'
		return '/login'
	}

	// Show loading state while authentication is being determined
	if (!trpcClient) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				}}
			>
				<div style={{ textAlign: 'center' }}>
					<Loader size="sm" />
					<br />
					Loading the app...
				</div>
			</div>
		)
	}

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<NavigationProgress />
				<ProgressHandler />

				{isAuthStatusKnown ? (
					<>
						<Routes>
							{/* Root route redirects based on auth status and role */}
							<Route path="/" element={<Navigate to={getRootRedirect()} />} />

							{/* Public routes with AuthLayout */}
							<Route element={<AuthLayout />}>
								<Route path="/login" element={<LoginPage />} />
								<Route path="/register" element={<RegisterPage />} />
								<Route path="/forgot-password" element={<ForgotPasswordPage />} />
								<Route
									path="/account/password-reset"
									element={<ResetPasswordPage />}
								/>
							</Route>

							{/* Protected routes */}
							{/* Admin section - requires admin role */}
							<Route path="/admin" element={<AdminRoute />}>
								<Route index element={<Navigate to="/admin/users" />} />
								<Route path="users" element={<UsersListPage />} />
								<Route path="emails" element={<AdminEmailsPage />} />
								{/* <Route path="account" element={<AccountPage />} /> */}
							</Route>

							{/* Normal user section (where the main app is) - requires user role */}
							<Route path="/user" element={<UserRoute />}>
								<Route index element={<Navigate to="/user/page1" />} />
								<Route path="page1" element={<UserDashboard />} />
								{/* // todo: team later */}
								{/* <Route path="team" element={<TeamPage />} /> */}
							</Route>

							{/* Catch-all route */}
							<Route path="*" element={<Navigate to="/" />} />
						</Routes>
					</>
				) : (
					<CheckToken />
				)}
			</QueryClientProvider>
		</trpc.Provider>
	)
}

function App() {
	return (
		<MantineProvider theme={theme}>
			<Notifications position="top-right" autoClose={3000} />
			<ModalsProvider>
				<BrowserRouter>
					<AuthProvider>
						<div className="App">
							<AppContent />
						</div>
					</AuthProvider>
				</BrowserRouter>
			</ModalsProvider>
		</MantineProvider>
	)
}

export default App
