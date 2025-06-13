import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { trpc } from '../trpc'
import { PasswordInput, Title, Button, Stack, Alert } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'
import { useAuth } from '../context'

const ResetPasswordPage = () => {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const [error, setError] = useState('')
	const token = searchParams.get('token')
	const { login } = useAuth()

	useEffect(() => {
		if (!token) {
			navigate('/login')
		}
	}, [token, navigate])

	const form = useForm({
		initialValues: {
			password: '',
			confirmPassword: '',
		},
		validate: {
			password: (value: string) =>
				value.length < 2 ? 'Password must be at least 2 characters' : null,
			confirmPassword: (value: string, values: { password: string }) =>
				value !== values.password ? 'Passwords do not match' : null,
		},
	})

	const resetMutation = trpc.resetPassword.useMutation({
		onError: (error) => {
			setError(error.message)
		},
		onSuccess: (data) => {
			login(data.token, data.user)

			if (data.user.role === 'ADMIN') {
				navigate('/admin/dashboard')
			} else if (data.user.role === 'USER') {
				navigate('/user')
			} else {
				navigate('/')
			}
		},
	})

	const handleSubmit = form.onSubmit(async (values) => {
		setError('')
		if (!token) return

		await resetMutation.mutateAsync({
			token,
			password: values.password,
		})
	})

	return (
		<Stack>
			<Title ta="center" order={2} fw={500} c="dimmed">
				Set New Password
			</Title>

			{error && (
				<Alert icon={<IconAlertCircle size={16} />} color="red">
					{error}
				</Alert>
			)}

			<form onSubmit={handleSubmit}>
				<Stack>
					<PasswordInput
						label="New Password"
						placeholder="Enter new password"
						required
						{...form.getInputProps('password')}
					/>

					<PasswordInput
						label="Confirm Password"
						placeholder="Confirm new password"
						required
						{...form.getInputProps('confirmPassword')}
					/>

					<Button fullWidth type="submit" loading={resetMutation.isLoading}>
						{resetMutation.isLoading ? 'Updating...' : 'Update Password'}
					</Button>
				</Stack>
			</form>
		</Stack>
	)
}

export default ResetPasswordPage
