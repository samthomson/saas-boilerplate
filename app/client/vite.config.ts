import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint'
import * as path from 'path'

// Custom plugin to handle favicon switching
const faviconPlugin = (): Plugin => {
	return {
		name: 'favicon-switcher',
		transformIndexHtml(html: string) {
			const mode = process.env.ENVIRONMENT || 'DEVELOPMENT'
			let titlePrefix = ''

			// Base64 encoded SVG favicons with "D" for dev, "S" for staging, and "BG" for prod
			const devFavicon =
				'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPkQ8L3RleHQ+PC9zdmc+'
			const stagingFavicon =
				'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzOWMxMiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPlM8L3RleHQ+PC9zdmc+'
			const prodFavicon =
				'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzJlY2M3MSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPkJHPC90ZXh0Pjwvc3ZnPg=='

			let faviconPath = prodFavicon // default

			if (mode === 'DEVELOPMENT') {
				faviconPath = devFavicon
				titlePrefix = '[DEVELOPMENT] '
			} else if (mode === 'STAGING') {
				faviconPath = stagingFavicon
				titlePrefix = '[STAGING] '
			} else if (mode === 'PRODUCTION') {
				faviconPath = prodFavicon
				titlePrefix = ''
			}

			// Replace or add favicon link
			let updatedHtml = html

			if (html.includes('<link rel="icon"')) {
				updatedHtml = updatedHtml.replace(
					/<link rel="icon"[^>]*>/,
					`<link rel="icon" href="${faviconPath}" />`,
				)
			} else {
				updatedHtml = updatedHtml.replace(
					'</head>',
					`<link rel="icon" href="${faviconPath}" /></head>`,
				)
			}

			if (updatedHtml.includes('<title>')) {
				updatedHtml = updatedHtml.replace(
					/<title>(.*?)<\/title>/,
					`<title>${titlePrefix}[todo: app name]</title>`,
				)
			}

			return updatedHtml
		},
	}
}

export default defineConfig(() => {
	return {
		plugins: [
			react(),
			eslint({
				fix: true,
				include: ['src/**/*.ts', 'src/**/*.tsx'],
			}),
			faviconPlugin(),
		],
		// Define environment variables for the client
		define: {
			'import.meta.env.VITE_SERVER_HOST': JSON.stringify(
				process.env.HOST || 'MISSING_VITE_SERVER_HOST',
			),
			'import.meta.env.VITE_SERVER_PORT': JSON.stringify(
				process.env.VITE_SERVER_PORT || 'MISSING_VITE_SERVER_PORT',
			),
		},
		server: {
			host: JSON.stringify(process.env.HOST), //'0.0.0.0',
			allowedHosts: ['www.saas-boilerplate.local'],
			// port: JSON.stringify(process.env.CLIENT_PORT || 'MISSING_CLIENT_PORT'),
			// watch: {
			//   usePolling: true,
			// },
			// proxy: {
			//   '/trpc': {
			//     target: `${JSON.stringify(process.env.HOST)}:${JSON.stringify(process.env.SERVER_PORT)}`,
			//     changeOrigin: true,
			//   },
			// },
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
				'@server': path.resolve(__dirname, '../server/src'),
				'@shared': path.resolve(__dirname, '../shared'),
			},
		},
		optimizeDeps: {
			esbuildOptions: {
				// Mark problematic tRPC paths as external
				// external: [
				//   '@trpc/server/unstable-core-do-not-import',
				//   '@trpc/server/observable',
				//   '@trpc/server/rpc'
				// ]
			},
		},
		build: {
			outDir: 'dist',
			// Generate source maps for production builds
			sourcemap: true,
		},
	}
})
