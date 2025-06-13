import { PrismaClient } from '@prisma/client'

import logger from '../logger'

const prisma = new PrismaClient()

const ALLOWED_ENVIRONMENTS = ['development', 'STAGING', 'testing', 'ci'] as const
type AllowedEnvironment = typeof ALLOWED_ENVIRONMENTS[number]


export const wipeDb = async () => {
	const currentEnv = process.env.NODE_ENV

	if (!currentEnv || !ALLOWED_ENVIRONMENTS.includes(currentEnv as AllowedEnvironment)) {
		throw new Error(`Database wipe only allowed in ${ALLOWED_ENVIRONMENTS.join('/')} environments. Current: ${currentEnv || 'undefined'}`)
	}

	try {
		// Delete in order of dependencies
		await prisma.user.deleteMany()

		logger.info('Database wiped successfully')
	} catch (error) {
		logger.error('Error wiping database:', error)
		throw error
	} finally {
		await prisma.$disconnect()
	}
}