import { createLogger, format, transports } from 'winston'
import { Loggly } from 'winston-loggly-bulk'

// Default environment to development if not specified
const environment = process.env.NODE_ENV || 'NO_ENV_SET'
const appName = 'GUIDE_SAAS'

// Determine log level from env var or default based on environment
const logLevel = process.env.LOG_LEVEL || (environment === 'PRODUCTION' || environment === 'STAGING' ? 'warn' : 'debug')

// Create the logger instance
const logger = createLogger({
	level: logLevel,
	format: format.combine(
		format.timestamp(),
		format.json(),
	),
	defaultMeta: {
		meta: {
			service: `${appName}-api`,
			environment,
			app: appName,
		},
	},
	transports: [
		// Console transport for local development
		new transports.Console({
			format: format.combine(
				format.colorize(),
				format.simple(),
			),
		}),
	],
})

// Add Loggly transport in production or staging environments, or if LOGGLY_TOKEN is provided
if (environment === 'PRODUCTION' || environment === 'STAGING') {
	const environmentTags = [`env-${environment}`, appName]

	// Add specific tags based on environment
	if (environment === 'PRODUCTION') {
		environmentTags.push('production')
	} else if (environment === 'STAGING') {
		environmentTags.push('staging')
	} else {
		environmentTags.push('development')
	}

	logger.add(
		new Loggly({
			token: process.env.LOGGLY_TOKEN || 'MISSING_LOGGLY_TOKEN',
			subdomain: process.env.LOGGLY_SUBDOMAIN || 'MISSING_LOGGLY_SUBDOMAIN',
			tags: ['nodejs', 'express', appName, ...environmentTags],
			json: true,
		}),
	)
	logger.info(`Loggly transport configured for ${appName} in ${environment} environment`)
} else {
	logger.warn(`Loggly not in STAGING or PRODUCTION, skipping Loggly configuration for ${appName}`)
}

// Helper methods for consistent logging
export const logInfo = (message: string, meta = {}) => {
	logger.info(message, { ...meta })
}

export const logError = (message: string, error: Error | unknown, meta = {}) => {
	const errorObj = error instanceof Error ? error : new Error(String(error))
	logger.error(message, {
		error: errorObj.message,
		stack: errorObj.stack,
		...meta,
	})
}

export const logWarning = (message: string, meta = {}) => {
	logger.warn(message, { ...meta })
}

export const logDebug = (message: string, meta = {}) => {
	logger.debug(message, { ...meta })
}

export default logger 