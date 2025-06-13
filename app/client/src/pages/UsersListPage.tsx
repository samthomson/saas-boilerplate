import { trpc } from '../trpc'
import {
	Table,
	Button,
	Badge,
	Text,
	Paper,
	Group,
	Alert,
	Stack,
	Menu,
	ActionIcon,
} from '@mantine/core'
import { MainLayout } from '../layouts/MainLayout'
import { IconAlertCircle, IconRefresh, IconMail, IconLogin, IconDots } from '@tabler/icons-react'
import { useAuth } from '../context'
import { useNavigate } from 'react-router-dom'

const getRoleBadgeColor = (role: string) => {
	switch (role) {
		case 'ADMIN':
			return 'red'
		case 'USER':
			return 'blue'
		default:
			return 'gray'
	}
}

const UsersListPage = () => {
	const usersQuery = trpc.listAllUsers.useQuery()
	const { user: currentUser, login } = useAuth()
	const navigate = useNavigate()

	const loginAsMutation = trpc.adminLoginAs.useMutation({
		onSuccess: (data) => {
			login(data.token, data.user)
			setTimeout(() => {
				if (data.user.role === 'ADMIN') {
					navigate('/admin/users')
				} else if (data.user.role === 'USER') {
					navigate('/user')
				} else {
					navigate('/login')
				}
			}, 100)
		},
	})

	return (
		<MainLayout header={{ title: 'All Users' }} isLoading={usersQuery.isLoading}>
			<Paper shadow="xs" p="md">
				<Group justify="space-between" mb="md">
					<Text size="sm" c="dimmed">
						{usersQuery.data
							? `${usersQuery.data.length} users total`
							: 'Loading users...'}
					</Text>
					<Button
						onClick={() => usersQuery.refetch()}
						loading={usersQuery.isFetching}
						leftSection={<IconRefresh size={16} />}
						variant="light"
					>
						Refresh
					</Button>
				</Group>

				{usersQuery.isError ? (
					<Alert icon={<IconAlertCircle size={16} />} color="red">
						Error: {usersQuery.error.message}
					</Alert>
				) : usersQuery?.data?.length === 0 ? (
					<Text ta="center" c="dimmed" p="xl">
						No users found.
					</Text>
				) : (
					<Table striped highlightOnHover>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Email</Table.Th>
								<Table.Th>Role</Table.Th>
								<Table.Th>Created</Table.Th>
								<Table.Th>Actions</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{usersQuery?.data?.map((user) => (
								<Table.Tr key={user.id}>
									<Table.Td>
										<Stack gap="xs">
											<Group gap="xs">
												<IconMail size={16} />
												<Text size="sm">{user.email}</Text>
											</Group>
										</Stack>
									</Table.Td>
									<Table.Td>
										<Badge color={getRoleBadgeColor(user.role)}>
											{user.role}
										</Badge>
									</Table.Td>

									<Table.Td>
										<Text size="sm" c="dimmed">
											{new Date(user.createdAt).toLocaleString()}
										</Text>
									</Table.Td>
									<Table.Td>
										{currentUser?.role === 'ADMIN' &&
											currentUser?.id !== user.id && (
												<Menu position="bottom-end">
													<Menu.Target>
														<ActionIcon variant="subtle" size="sm">
															<IconDots size={16} />
														</ActionIcon>
													</Menu.Target>
													<Menu.Dropdown>
														<Menu.Item
															leftSection={<IconLogin size={16} />}
															onClick={() =>
																loginAsMutation.mutate({
																	userId: user.id,
																})
															}
														>
															Log in as
														</Menu.Item>
													</Menu.Dropdown>
												</Menu>
											)}
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				)}
			</Paper>
		</MainLayout>
	)
}

export default UsersListPage
