import { Outlet } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { Paper } from '@mantine/core'

export function AuthLayout() {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '100vh',
				backgroundColor: '#f8f9fa',
				padding: '24px',
			}}
		>
			<div style={{ marginBottom: '32px' }}>
				<Brand size="lg" />
			</div>
			<Paper
				shadow="sm"
				p="xl"
				style={{
					width: '100%',
					maxWidth: '400px',
					borderRadius: '8px',
				}}
			>
				<Outlet />
			</Paper>
		</div>
	)
}
