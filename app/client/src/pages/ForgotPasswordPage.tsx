import { useState } from 'react'
import { trpc } from '../trpc'
import { TextInput, Title, Button, Text, Stack, Alert, Anchor } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'

const ForgotPasswordPage = () => {
	const [error, setError] = useState('')
	const [success, setSuccess] = useState(false)

	const form = useForm({
		initialValues: {
			email: '',
		},
		validate: {
			email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
		},
	})

	const resetMutation = trpc.requestPasswordReset.useMutation({
		onError: (error) => {
			setError(error.message)
		},
		onSuccess: () => {
			setSuccess(true)
			form.reset()
		},
	})

	const handleSubmit = form.onSubmit(async (values) => {
		setError('')
		setSuccess(false)
		await resetMutation.mutateAsync(values)
	})

	return (
		<Stack>
			<Title ta="center" order={2} fw={500} c="dimmed">
				Reset Password
			</Title>

			{error && (
				<Alert icon={<IconAlertCircle size={16} />} color="red">
					{error}
				</Alert>
			)}

			{success && (
				<Alert icon={<IconCheck size={16} />} color="green">
					If an account exists with this email, you will receive password reset
					instructions shortly.
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

					<Button fullWidth type="submit" loading={resetMutation.isLoading}>
						{resetMutation.isLoading ? 'Sending...' : 'Send Reset Instructions'}
					</Button>
				</Stack>
			</form>

			<Text c="dimmed" size="sm" ta="center">
				Remember your password?{' '}
				<Anchor size="sm" component="a" href="/login">
					Sign in
				</Anchor>
			</Text>
		</Stack>
	)
}

export default ForgotPasswordPage
