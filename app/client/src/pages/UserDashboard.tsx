import { MainLayout } from '../layouts/MainLayout'

export default function UserDashboard() {
	return (
		<MainLayout
			isLoading={false}
			header={{
				title: 'Dashboard',
			}}
		>
			[todo: dashboard]
		</MainLayout>
	)
}
