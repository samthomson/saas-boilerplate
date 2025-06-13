import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../../server/src/router'

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>()

const serverUrl = `${import.meta.env.VITE_SERVER_HOST || 'MISSING_SERVER_HOST'}:${import.meta.env.VITE_SERVER_PORT || 'MISSING_SERVER_PORT'}/trpc`

// Debug log
// console.log('tRPC server URL:', serverUrl);

// Create a client
export const createTrpcClient = (token: string | null, logout: () => void) => {
	return trpc.createClient({
		links: [
			httpBatchLink({
				url: serverUrl,
				headers: () => {
					return {
						Authorization: token ? `Bearer ${token}` : '',
					}
				},
				fetch: async (input, init) => {
					const res = await fetch(input, init)
					if (res.status === 401) {
						const clonedRes = res.clone()
						const error = await clonedRes.json()
						console.error('TRPC 401', error)
						logout()
					}
					return res
				},
			}),
		],
	})
}
