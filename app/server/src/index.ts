import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import cors from 'cors'
import { appRouter } from './router'
import path from 'path'
import logger from './logger'
import { createContext } from './context'
import { existsSync  } from 'fs'
// import { prisma } from './prisma'
// import * as EmailUtil from './utils/email'

const app = express()

// Add request logging middleware
// app.use((req, res, next) => {
//   const start = Date.now();

//   res.on('finish', () => {
//     const duration = Date.now() - start;
//     logger.info('Request processed', {
//       method: req.method,
//       url: req.originalUrl,
//       status: res.statusCode,
//       duration,
//       ip: req.ip,
//     });
//   });

//   next();
// });

const clientHost = process.env.HOST || 'MISSING_HOST'
const clientPort = process.env.CLIENT_PORT || 'MISSING_CLIENT_PORT'

app.use(cors({
	origin: [`${clientHost}:${clientPort}`],
	credentials: true,
}))

app.use('/trpc', createExpressMiddleware({
	router: appRouter,
	createContext,
}))

app.get('/health', (_, res) => {
	res.status(200).send('OK')
})

// Note: The file upload endpoints have been removed as we're now using direct uploads to Cloudflare
// through tRPC procedures. The client now gets a direct upload URL and uploads directly to Cloudflare.

if (process.env.ENVIRONMENT === 'STAGING' || process.env.ENVIRONMENT === 'PRODUCTION') {
	// Use absolute paths instead of relative
	const clientDistPath = path.resolve(process.cwd(), '../client/dist')

	// Serve static files from the React app
	app.use(express.static(clientDistPath))

	// The "catchall" handler
	app.get('*', (_, res) => {
		const indexPath = path.join(clientDistPath, 'index.html')

		if (existsSync(indexPath)) {
			res.sendFile(indexPath)
		} else {
			res.status(404).send('File not found: ' + indexPath)
			logger.error('Index file not found', { path: indexPath })
		}
	})
}

// Use environment variable for port or default to 5000
const PORT = process.env.SERVER_PORT || 'MISSING_SERVER_PORT'

app.listen(PORT, () => {
	logger.info(`Server started on port ${PORT}`)
	logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

export type AppRouter = typeof appRouter;

export { app } // Export for testing