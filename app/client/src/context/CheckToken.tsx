import * as React from 'react'
import { useAuth } from '../context'
import { trpc } from '../trpc'
import { Loader } from '@mantine/core'

const CheckToken: React.FunctionComponent = () => {
	const { logout, updateUser, login, isAuthStatusKnown } = useAuth()
	const possibleLocalToken = localStorage.getItem('authToken')

	const { data: me, isError } = trpc.verifyLocalToken.useQuery(
		{ token: possibleLocalToken || '' },
		{
			enabled: !!possibleLocalToken,
			retry: false, // Don't retry on error since a 404 means invalid token
		},
	)

	React.useEffect(() => {
		if (!possibleLocalToken || isError) {
			logout()
		} else if (me) {
			if (me.isAuthed && me.token && me.user) {
				login(me.token, me.user)
			} else {
				logout()
			}
		}
	}, [me, possibleLocalToken, isError, logout, updateUser, login])

	if (!isAuthStatusKnown) {
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
					<Loader size="xs" />
					<br />
					Loading...
				</div>
			</div>
		)
	}

	return null
}

export default CheckToken
