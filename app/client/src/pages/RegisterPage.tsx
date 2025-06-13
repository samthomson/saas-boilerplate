import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trpc } from '../trpc'
import { useAuth } from '../context'
import { TextInput, PasswordInput, Title, Button, Text, Anchor, Stack, Alert } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'

const RegisterPage = () => {
	const [error, setError] = useState('')
	const navigate = useNavigate()
	const { login, isAuthenticated } = useAuth()

	// Redirect if already logged in
	if (isAuthenticated) {
		navigate('/dashboard')
	}

	type FormValues = {
		email: string
		password: string
	}

	const form = useForm<FormValues>({
		initialValues: {
			email: '',
			password: '',
		},
		validate: {
			email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
			password: (value) => (!value ? 'Password is required' : null),
		},
	})

	const registerMutation = trpc.register.useMutation({
		onError: (error) => {
			setError(error.message)
		},
		onSuccess: (data) => {
			login(data.token, data.user)
			navigate('/dashboard')
		},
	})

	const handleSubmit = form.onSubmit(async (values) => {
		setError('')
		await registerMutation.mutateAsync(values)
	})

	return (
		<Stack>
			<Title ta="center" order={2} fw={500} c="dimmed">
				Get Started
			</Title>

			<Alert>[todo: blah blah blah]</Alert>

			{error && (
				<Alert icon={<IconAlertCircle size={16} />} color="red">
					{error}
				</Alert>
			)}

			<form onSubmit={handleSubmit}>
				<Stack>
					<TextInput
						label="Email"
						placeholder="your@email.com"
						required
						{...form.getInputProps('email')}
					/>

					<PasswordInput
						label="Password"
						placeholder="Create a strong password"
						required
						{...form.getInputProps('password')}
					/>

					<Button fullWidth type="submit" loading={registerMutation.isLoading}>
						{registerMutation.isLoading ? 'Creating account...' : 'Create account'}
					</Button>
				</Stack>
			</form>

			<Text c="dimmed" size="sm" ta="center">
				Already have an account?{' '}
				<Anchor size="sm" component="a" href="/login">
					Sign in
				</Anchor>
			</Text>
		</Stack>
	)
}

export default RegisterPage
