import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'
import logger from '../logger'

const prisma = new PrismaClient()

async function seedAdmin() {
	const adminEmail = process.env.ADMIN_EMAIL
	const adminPassword = process.env.ADMIN_PASSWORD
  
	if (!adminEmail || !adminPassword) {
		throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set')
	}
  
	logger.info(`Attempting to create admin user: ${adminEmail}`)
  
	try {
		// Check if admin already exists
		const existingAdmin = await prisma.user.findUnique({
			where: { email: adminEmail },
		})
    
		if (existingAdmin) {
			logger.warn('Admin user already exists.')
			return
		}
    
		// Hash the password
		const saltRounds = 10
		const hashedPassword = await hash(adminPassword, saltRounds)
    
		// Create the admin user
		const admin = await prisma.user.create({
			data: {
				email: adminEmail,
				hashedPassword: hashedPassword,
				role: 'ADMIN',
			},
		})
    
		logger.info(`Admin user created successfully with ID: ${admin.id}`)
	} catch (error) {
		logger.error('Error creating admin user:', error)
		throw error
	} finally {
		await prisma.$disconnect()
	}
}

// Run the seed function
seedAdmin()
	.catch(e => {
		logger.error('error seeding admin', e)
		process.exit(1)
	})
	.finally(() => {
		process.exit(0)
	}) 