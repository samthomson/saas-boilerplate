import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcrypt'
import logger from '../logger'

const prisma = new PrismaClient()

const ALLOWED_ENVIRONMENTS = ['DEVELOPMENT', 'STAGING'] as const

// Hard-coded credentials for development
const devUsers = {
	admin: { email: 'admin_user@email.com', password: 'password' },
	user: { email: 'user_local@email.com', password: 'password' },
} as const


async function createUser(email: string, password: string, role: UserRole) {
	const hashedPassword = await hash(password, 10)
	return prisma.user.create({
		data: {
			email,
			hashedPassword,
			role,
		},
	})
}

async function seedDev() {
	const currentEnv = process.env.ENVIRONMENT

	if (!currentEnv || !ALLOWED_ENVIRONMENTS.includes(currentEnv as typeof ALLOWED_ENVIRONMENTS[number])) {
		throw new Error(`Seeding only allowed in ${ALLOWED_ENVIRONMENTS.join('/')} environments. Current: ${currentEnv || 'undefined'}`)
	}

	try {
		const admin = await createUser(devUsers.admin.email, devUsers.admin.password, 'ADMIN')
		logger.info(`Created admin user: ${admin.email}`)

		const user = await createUser(devUsers.user.email, devUsers.user.password, 'USER')
		logger.info(`Created user: ${user.email}`)

		logger.info('Development data seeded successfully')
	} catch (error) {
		logger.error('Error seeding development data:', error)
		throw error
	} finally {
		await prisma.$disconnect()
	}
}

seedDev()
	.catch(e => {
		logger.error('Error in seedDev script:', e)
		process.exit(1)
	})
	.finally(() => {
		process.exit(0)
	}) 