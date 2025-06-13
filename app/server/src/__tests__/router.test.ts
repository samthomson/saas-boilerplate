import request from 'supertest'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import express, { json } from 'express'
import { appRouter } from '../router'
import { createContext } from '../context'
import * as EmailUtil from '../utils/email'
import * as DBUtil from '../utils/db'
import { prisma } from '../prisma'

// Mock email sending
jest.mock('../utils/email', () => ({
	Templates: {
		User: {
			Welcome: {
				send: jest.fn(),
			},
		},
	},
}))

describe('register', () => {
	const app = express()
	app.use(json())
	app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }))

	beforeEach(async () => {
		jest.clearAllMocks()
		// Clean up any test data
		await DBUtil.wipeDb()
	})

	it('should register a new agency user and send welcome email', async () => {
		const input = {
			email: 'test@example.com',
			password: 'securepassword',
		}

		const response = await request(app)
			.post('/trpc/register')
			.send(input)
			.expect(200)

		// Check response format
		const result = response.body.result
		expect(result.data.user.email).toBe(input.email)
		expect(result.data.token).toBeDefined()

		// Verify email was sent
		expect(EmailUtil.Templates.User.Welcome.send).toHaveBeenCalledWith(
			{ to: [{ email: input.email }] }, {},
		)

		// Verify database records
		const user = await prisma.user.findUnique({
			where: { email: input.email },
		})

		expect(user).toBeTruthy()
		expect(user?.role).toBe('USER')
		expect(user?.hashedPassword).toBeTruthy() // Password should be hashed
	})

	it('should reject registration if user already exists', async () => {
		const input = {
			email: 'test@example.com',
			password: 'securepassword',
			agencyName: 'Test Agency',
			name: 'Test User',
			role: 'AGENCY_USER' as const,
		}

		// First registration should succeed
		await request(app)
			.post('/trpc/register')
			.send(input)
			.expect(200)

		// Second registration should fail
		const response = await request(app)
			.post('/trpc/register')
			.send(input)
			.expect(409) // tRPC returns 400 for application errors

		expect(response.body.error.message).toBe('User with this email already exists')
		expect(EmailUtil.Templates.User.Welcome.send).toHaveBeenCalledTimes(1)

		// Verify only one user exists
		const userCount = await prisma.user.count({
			where: { email: input.email },
		})
		expect(userCount).toBe(1)
	})
})
