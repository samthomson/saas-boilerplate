import React from 'react'
import ReactDOM from 'react-dom/client'
// import * as Sentry from '@sentry/react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { trpc, createTrpcClient } from './trpc'
import App from './App'

// Create a new empty client
const trpcClient = createTrpcClient(null, () => {})
const queryClient = new QueryClient()

if (import.meta.env.MODE !== 'development') {
	// Sentry.init({
	// 	dsn: 'https://84b10619c749848c235a9e046fee392a@o4508116831633408.ingest.us.sentry.io/4509082514817024',
	// 	environment: import.meta.env.MODE,
	// })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</trpc.Provider>
	</React.StrictMode>,
)
