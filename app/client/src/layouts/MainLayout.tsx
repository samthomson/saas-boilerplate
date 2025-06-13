import React, { useEffect, useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
	IconUsers,
	IconMail,
	IconUser,
	IconLogout,
	IconChevronUp,
	IconLayoutDashboard,
	IconHelp,
} from '@tabler/icons-react'
import { useAuth } from '../context'
import {
	Menu,
	NavLink,
	Divider,
	Title,
	Group,
	Box,
	LoadingOverlay,
	Loader,
	Text,
	Burger,
	Drawer,
	ActionIcon,
	Modal,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Brand } from '../components/Brand'

interface NavItemProps {
	icon: React.ReactNode
	label: string
	to: string
	active?: boolean
	style?: React.CSSProperties
	onClick?: () => void
}

// Define the types for navigation items
type NavItem = NavItemProps
type DividerItem = { divider: true }
type NavItemOrDivider = NavItem | DividerItem

function NavItem({ icon, label, to, active, style, onClick }: NavItemProps) {
	return (
		<NavLink
			label={label}
			leftSection={icon}
			active={active}
			component={Link}
			to={to}
			styles={(theme) => ({
				root: {
					padding: '8px 12px',
					margin: '0 12px',
					width: 'calc(100% - 24px)',
					backgroundColor: active ? '#f1f3f5' : 'transparent',
					color: active ? '#1f2937' : theme.colors.gray[6],
					borderRadius: '6px',
					fontSize: '16px',
					fontWeight: 600,
					'&:hover': {
						backgroundColor: active ? '#f1f3f5' : theme.colors.gray[0],
					},
				},
			})}
			style={style}
			onClick={onClick}
		/>
	)
}

const accountMenuStyles = {
	padding: '8px 16px',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	transition: 'background-color 0.2s ease',
	cursor: 'pointer',
	backgroundColor: 'transparent',
	margin: '0',
	width: '100%',
	borderRadius: '6px',
}

interface HeaderProps {
	title: string
	rightSection?: React.ReactNode
}

interface MainLayoutProps {
	children?: React.ReactNode
	header?: HeaderProps | React.ReactNode
	isLoading?: boolean
}

export function MainLayout({ children, header, isLoading }: MainLayoutProps) {
	const location = useLocation()
	const navigate = useNavigate()
	const { user, logout } = useAuth()
	const [menuOpened, setMenuOpened] = useState(false)
	const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false)
	const [helpOpened, setHelpOpened] = useState(false)

	// Close account menu when drawer closes
	useEffect(() => {
		if (!drawerOpened) {
			setMenuOpened(false)
		}
	}, [drawerOpened])

	const adminNavItems: NavItemOrDivider[] = [
		{ icon: <IconUsers size={18} stroke={1.5} />, label: 'Users', to: '/admin/users' },
		{ icon: <IconMail size={18} stroke={1.5} />, label: 'Emails', to: '/admin/emails' },
	]

	const userNavItems: NavItemOrDivider[] = [
		{
			icon: <IconLayoutDashboard size={18} stroke={1.5} />,
			label: 'Dashboard',
			to: '/user/dashboard',
		},
	]

	// Select nav items based on user role
	const navItems = (() => {
		switch (user?.role) {
			case 'ADMIN':
				return adminNavItems
			case 'USER':
				return userNavItems
			default:
				return [] as NavItemOrDivider[]
		}
	})()

	// Helper function to check if a path is active
	const isPathActive = (path: string | undefined) => {
		if (!path) return false

		// For other paths, use startsWith
		return location.pathname.startsWith(path)
	}

	// Render the header based on the type of header prop
	const renderHeader = () => {
		if (!header) return null

		// If header is a React node (for backward compatibility)
		if (React.isValidElement(header)) {
			return header
		}

		// If header is a HeaderProps object
		const headerProps = header as HeaderProps
		return (
			<Group justify="space-between" style={{ width: '100%' }}>
				<Title order={3} style={{ fontWeight: 600 }}>
					{headerProps.title}
				</Title>
				<Group gap="xs">
					{headerProps.rightSection}
					<ActionIcon variant="subtle" size="lg" onClick={() => setHelpOpened(true)}>
						<IconHelp size={24} stroke={2} />
					</ActionIcon>
				</Group>
			</Group>
		)
	}

	const renderNavItems = () => (
		<div
			style={{
				flex: 1,
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
			}}
		>
			{navItems.map((item, index) => {
				if ('divider' in item) {
					return <Divider key={`divider-${index}`} my={6} mx={24} mr={64} />
				}

				const navItem = item as NavItem
				if (navItem.label && !navItem.icon && !navItem.to) {
					// Section title styling
					return (
						<Text
							key={`section_title-${index}`}
							style={{
								padding: '8px 12px 8px 12px',
								margin: '8px 12px 0 4px',
								color: '#444',
								fontSize: '10px',
								fontWeight: 700,
								textTransform: 'uppercase',
								letterSpacing: '0.5px',
							}}
						>
							{navItem.label}
						</Text>
					)
				} else {
					return (
						<NavItem
							key={`nav_item-${index}`}
							{...navItem}
							active={isPathActive(navItem.to)}
							onClick={closeDrawer}
						/>
					)
				}
			})}
		</div>
	)

	const handleLogout = () => {
		closeDrawer()
		logout()
		setTimeout(() => {
			navigate('/', { replace: true })
		}, 0)
	}

	const renderAccountMenu = () => (
		<>
			{!!user && (
				<div style={{ padding: '0 16px 16px 16px' }}>
					<Divider my={12} mx={8} />
					<Menu
						position={drawerOpened ? 'bottom' : 'top'}
						width={200}
						opened={menuOpened}
						onChange={setMenuOpened}
						withinPortal={!drawerOpened}
						closeOnItemClick
						closeOnClickOutside={!drawerOpened}
					>
						<Menu.Target>
							<div
								style={accountMenuStyles}
								onMouseEnter={(e) =>
									(e.currentTarget.style.backgroundColor = '#f8f9fa')
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.backgroundColor = 'transparent')
								}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										minWidth: 0,
										flex: 1,
										marginRight: '8px',
									}}
								>
									<IconUser
										size={16}
										style={{
											marginRight: '12px',
											flexShrink: 0,
											color: '#6b7280',
										}}
									/>
									<div
										style={{
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											display: 'flex',
											flexDirection: 'column',
											width: '100%',
										}}
									>
										<span
											style={{
												color: '#374151',
												fontSize: '14px',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}
										>
											{user.email}
										</span>
										{user.role && (
											<span
												style={{
													fontSize: '10px',
													color: '#9ca3af',
													textTransform: 'capitalize',
													marginTop: '-2px',
												}}
											>
												{user.role === 'ADMIN' ? 'Admin' : ''}
											</span>
										)}
									</div>
								</div>
								<IconChevronUp
									size={16}
									style={{
										transform: menuOpened ? 'rotate(0deg)' : 'rotate(180deg)',
										transition: 'transform 200ms ease',
										flexShrink: 0,
										color: '#6b7280',
									}}
								/>
							</div>
						</Menu.Target>

						<Menu.Dropdown style={{ zIndex: 1000 }}>
							<Menu.Item
								leftSection={<IconUser size={16} />}
								component={Link}
								to={'/account'}
								onClick={closeDrawer}
							>
								Account
							</Menu.Item>
							<Menu.Item
								leftSection={<IconLogout size={16} />}
								onClick={handleLogout}
								color="red"
							>
								Logout
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				</div>
			)}
		</>
	)

	const renderSidebarContent = () => (
		<>
			{/* Brand - only show in desktop sidebar */}
			<Box visibleFrom="sm" mb={32} px={24}>
				<Brand />
			</Box>

			{renderNavItems()}
			{renderAccountMenu()}
		</>
	)

	return (
		<div style={{ display: 'flex', height: '100vh', background: '#f8f9fa' }}>
			{/* Desktop Sidebar */}
			<Box
				component="nav"
				visibleFrom="sm"
				style={{
					width: '250px',
					background: 'white',
					borderRight: '1px solid #e9ecef',
					display: 'flex',
					flexDirection: 'column',
					padding: '24px 0 0',
				}}
			>
				{renderSidebarContent()}
			</Box>

			{/* Mobile Drawer */}
			<Drawer
				opened={drawerOpened}
				onClose={closeDrawer}
				size="100%"
				padding="md"
				title={<Brand size="sm" />}
				hiddenFrom="sm"
				zIndex={1000}
			>
				{renderSidebarContent()}
			</Drawer>

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				{/* Top Bar */}
				<header
					style={{
						height: '64px',
						background: 'white',
						borderBottom: '1px solid #e9ecef',
						padding: '0 8px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<Group justify="space-between" w="100%" wrap="nowrap" align="center">
						<Group gap="md" wrap="nowrap">
							<Burger
								opened={drawerOpened}
								onClick={() => {
									toggleDrawer()
									setMenuOpened(false)
								}}
								hiddenFrom="sm"
								size="sm"
							/>
							<Box hiddenFrom="sm">
								<Brand size="sm" logoOnly />
							</Box>
						</Group>
						{renderHeader()}
					</Group>
				</header>

				{/* Main Content */}
				<main
					style={{
						flex: 1,
						overflow: 'auto',
						display: 'block',
					}}
				>
					{isLoading ? (
						<Box
							pos="relative"
							style={{
								display: 'block',
								height: '100%',
								width: '100%',
							}}
						>
							<LoadingOverlay
								visible={isLoading}
								overlayProps={{ blur: 2 }}
								loaderProps={{
									size: 'sm',
									children: (
										<>
											<div style={{ textAlign: 'center' }}>
												<Loader size="md" />
												<br />
												<Text c="dimmed">Loading...</Text>
											</div>
										</>
									),
								}}
								zIndex={1000}
							/>
						</Box>
					) : (
						<Box p={{ base: 'sm', sm: 'md', md: 'lg' }}>{children || <Outlet />}</Box>
					)}
				</main>
			</div>

			<Modal
				opened={helpOpened}
				onClose={() => setHelpOpened(false)}
				title="Help"
				styles={{
					content: {
						marginTop: '10vh',
					},
				}}
			>
				<Text size="sm">
					<p>Need help with anything?</p>
					<p>
						{/* // todo: add a support email  */}
						Email <a href="mailto:hello@">hello@</a>
					</p>
				</Text>
			</Modal>
		</div>
	)
}
