import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trpc } from '../trpc'
import { useAuth } from '../context'
import {
	TextInput,
	PasswordInput,
	Title,
	Button,
	Text,
	Anchor,
	Stack,
	Alert,
	Group,
} from '@mantine/core'
import { useForm, UseFormReturnType } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'

interface EmailLoginProps {
	handleSubmit: React.FormEventHandler<HTMLFormElement>
	form: UseFormReturnType<{ email: string; password: string }>
	error: string
	loginMutation: { isLoading: boolean }
}

const EmailLogin = ({ handleSubmit, form, error, loginMutation }: EmailLoginProps) => (
	<Stack>
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
					id="email"
					{...form.getInputProps('email')}
				/>

				<PasswordInput
					label="Password"
					placeholder="Your password"
					required
					id="password"
					{...form.getInputProps('password')}
				/>

				<Group justify="space-between" mt="-xs">
					<Anchor component="a" href="/forgot-password" size="sm">
						Forgot password?
					</Anchor>
				</Group>

				<Button
					fullWidth
					type="submit"
					id="login-submit-button"
					loading={loginMutation.isLoading}
				>
					{loginMutation.isLoading ? 'Signing in...' : 'Sign in'}
				</Button>
			</Stack>
		</form>

		<Text c="dimmed" size="sm" ta="center">
			Don't have an account?{' '}
			<Anchor size="sm" component="a" href="/register">
				Create account
			</Anchor>
		</Text>
	</Stack>
)

const LoginPage = () => {
	const [error, setError] = useState('')
	const navigate = useNavigate()
	const { login, isAuthenticated } = useAuth()
	// const [loginMethod, setLoginMethod] = useState<'email' | 'whatsapp'>('email');

	// Redirect if already logged in
	if (isAuthenticated) {
		// todo: still redirect here? not sure this page exists
		// navigate('/dashboard');
	}

	const form = useForm({
		initialValues: {
			email: '',
			password: '',
		},
		validate: {
			email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
			password: (value: string) => (value.length < 1 ? 'Password is required' : null),
		},
	})

	const loginMutation = trpc.login.useMutation({
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
		await loginMutation.mutateAsync(values)
	})

	return (
		<Stack>
			<Title ta="center" order={2} fw={500} c="dimmed">
				Sign In
			</Title>

			<EmailLogin
				handleSubmit={handleSubmit}
				form={form}
				error={error}
				loginMutation={loginMutation}
			/>
		</Stack>
	)
}

export default LoginPage
