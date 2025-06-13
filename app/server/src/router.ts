import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'
import logger, { logError } from './logger'
import { User } from '@shared/schema'
import { hash, compare } from 'bcrypt'
import { Context } from './context'
import * as EmailUtil from './utils/email'
import crypto from 'crypto'
import { prisma } from './prisma'
// import { getHost } from './utils/host'
// import { Prisma } from '@prisma/client'

import { createToken, decodeToken } from './utils/auth'

const registerUserSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1), // Just require non-empty password
})

const loginSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(1, 'Password is required'),
})
const userSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	// todo: can this be a type?
	role: z.enum(['ADMIN', 'USER']),
	createdAt: z.string(),
})

const authResponseSchema = z.object({
	user: userSchema,
	token: z.string(),
})
const tokenCheckResponseSchema = z.object({
	isAuthed: z.boolean(),
	user: userSchema.nullable(),
	token: z.string().nullable(),
})

// Create TRPC instance with context
const t = initTRPC.context<Context>().create({
	errorFormatter: ({ shape, error }) => {
		// Log the error

		// Special handling for Zod validation errors
		if (error.code === 'BAD_REQUEST' && error.cause instanceof z.ZodError) {
			logger.warn('tRPC Auth Error', error)
			const zodError = error.cause.errors[0]
			return {
				...shape,
				message: zodError.message,
				code: shape.code,
				data: {
					...shape.data,
					code: 'BAD_REQUEST',
					httpStatus: 400,
				},
			}
		}
		logError('tRPC Error', error)
		return shape
	},
})

// Middleware to check if user is authenticated
const isAuthed = t.middleware(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Not authenticated',
		})
	}
	return next({
		ctx: {
			user: ctx.user,
		},
	})
})

const delayMiddleware = t.middleware(async ({ next }) => {
	await new Promise((resolve) => setTimeout(resolve, 0))
	return next()
})

// Create a router with the middleware
const protectedProcedure = t.procedure.use(isAuthed).use(delayMiddleware)

export const appRouter = t.router({
	register: t.procedure
		.input(registerUserSchema)
		.output(authResponseSchema)
		.mutation(async ({ input }) => {
			logger.debug('Registering agency user', { email: input.email })

			// Check if user already exists
			const existingUser = await prisma.user.findUnique({
				where: { email: input.email },
			})

			if (existingUser) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'User with this email already exists',
				})
			}

			// Hash the password
			const hashedPassword = await hash(input.password, 10)

			try {
				// Use Prisma transaction to create both agency and user
				const result = await prisma.$transaction(async (tx) => {
					// Then create the user with reference to the agency
					const user = await tx.user.create({
						data: {
							email: input.email,
							hashedPassword: hashedPassword,
							role: 'USER',
						},
						select: {
							id: true,
							email: true,
							role: true,
							createdAt: true,
						},
					})

					return {
						id: user.id,
						email: user.email,
						role: user.role,
						createdAt: user.createdAt.toISOString(),
					} satisfies User
				})

				// Send welcome email after transaction completes
				await EmailUtil.Templates.User.Welcome.send({ to: [{ email: input.email }] }, {})

				// Send admin notification
				const adminEmail = process.env.ADMIN_EMAIL
				const environment = process.env.NODE_ENV || 'development'
				if (adminEmail && (environment === 'STAGING' || environment === 'PRODUCTION')) {
					await EmailUtil.Templates.AdminNotifs.send(
						{ to: [{ email: adminEmail }] },
						{
							subject: `[${environment}] New User Registered`,
							message: `A new user "${input.email}" has registered`,
						},
					)
				}

				// Generate JWT token
				const token = createToken({
					userId: result.id,
					email: result.email,
					role: result.role,
				})

				logger.debug('Agency user registered successfully', { userId: result.id })
				return { user: result, token }
			} catch (error) {
				logger.error('Error during registration', { error })
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to complete registration',
				})
			}
		}),

	// Login user
	login: t.procedure
		.input(loginSchema)
		.output(authResponseSchema)
		.mutation(async ({ input }) => {
			logger.debug('User login attempt', { email: input.email })

			// Find the user by email
			const user = await prisma.user.findUnique({
				where: { email: input.email },
				select: {
					id: true,
					email: true,
					hashedPassword: true,
					role: true,
					createdAt: true,
				},
			})

			if (!user) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'User not found',
				})
			}

			// Verify password
			const passwordValid = await compare(
				input.password,
				user.hashedPassword ?? '', // Provide empty string as fallback
			)

			if (!user.hashedPassword) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'User account is not properly configured',
				})
			}

			// Add this check to use the passwordValid variable
			if (!passwordValid) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Invalid password',
				})
			}

			// Generate JWT token
			const token = createToken({
				userId: user.id,
				email: user.email,
				role: user.role,
			})

			const userResponse = {
				id: user.id,
				email: user.email,
				role: user.role,
				createdAt: user.createdAt.toISOString(),
			} satisfies User

			logger.debug('User logged in successfully', { userId: user.id })
			return { user: userResponse, token }
		}),

	// List all users (admin function) - now protected
	listAllUsers: protectedProcedure.query(async ({ ctx }) => {
		// Check if user is admin
		if (ctx.user.role !== 'ADMIN') {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'Only admins can list all users',
			})
		}

		logger.debug('Listing all users')

		const users = await prisma.user.findMany({
			select: {
				id: true,
				email: true,
				role: true,
				createdAt: true,
			},
			orderBy: [
				{
					createdAt: 'asc',
				},
			],
		})

		logger.debug('Users retrieved', { count: users.length })
		return users.map((user) => ({
			...user,
			createdAt: user.createdAt.toISOString(),
		})) satisfies User[]
	}),

	// Get current user info
	me: protectedProcedure.output(userSchema).query(async ({ ctx }) => {
		const user = await prisma.user.findUnique({
			where: { id: ctx.user.userId },
			select: {
				id: true,
				email: true,
				role: true,
				createdAt: true,
			},
		})

		if (!user) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'User not found',
			})
		}

		return {
			...user,
			createdAt: user.createdAt.toISOString(),
		} satisfies User
	}),

	// Add this new procedure
	getEmailTemplates: protectedProcedure
		.input(
			z.object({
				agencyLogo: z.string().optional(),
				agencyName: z.string().optional(),
			}),
		)
		.output(
			z.array(
				z.object({
					name: z.string(),
					params: z.string(),
					html: z.string(),
				}),
			),
		)
		.query(async ({ ctx }) => {
			// Check if user is admin
			if (ctx.user.role !== 'ADMIN') {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only admins can view email templates',
				})
			}

			// Get email templates from the utility function
			const templates = await EmailUtil.getEmails()
			return templates
		}),

	requestPasswordReset: t.procedure
		.input(
			z.object({
				email: z.string().email(),
			}),
		)
		.mutation(async ({ input }) => {
			// Find user by email field or via contactMethods in a single query
			const user = await prisma.user.findFirst({
				where: {
					email: input.email,
				},
			})

			// Don't reveal if user exists or not
			if (!user) {
				logger.warn('User not found for password reset', { email: input.email })
				return { success: true }
			}

			// Generate reset token
			const token = crypto.randomBytes(32).toString('hex')
			const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

			// Create password reset record
			await prisma.passwordReset.create({
				data: {
					token,
					userId: user.id,
					expiresAt,
				},
			})

			// Send email to the email address provided in the request
			const sendResult = await EmailUtil.Templates.ForgotPassword.send(
				{ to: [{ email: input.email }] },
				{ code: token },
			)

			logger.info('password reset send result', { sendResult})

			return { success: true }
		}),

	resetPassword: t.procedure
		.input(
			z.object({
				token: z.string(),
				password: z.string(),
			}),
		)
		.output(authResponseSchema)
		.mutation(async ({ input }) => {
			const reset = await prisma.passwordReset.findFirst({
				where: {
					token: input.token,
					used: false,
					expiresAt: {
						gt: new Date(),
					},
				},
				include: {
					user: true,
				},
			})

			if (!reset) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Invalid or expired reset token',
				})
			}

			// Hash new password
			const hashedPassword = await hash(input.password, 10)

			// Update user password and mark reset token as used
			await prisma.$transaction([
				prisma.user.update({
					where: { id: reset.userId },
					data: { hashedPassword },
				}),
				prisma.passwordReset.update({
					where: { id: reset.id },
					data: { used: true },
				}),
			])

			// Generate JWT token like in login
			const token = createToken({
				userId: reset.user.id,
				email: reset.user.email,
				role: reset.user.role,
			})

			// Build the user response object
			const userResponse = {
				id: reset.user.id,
				email: reset.user.email,
				role: reset.user.role,
				createdAt: reset.user.createdAt.toISOString(),
			} satisfies User

			return { user: userResponse, token }
		}),

	verifyLocalToken: t.procedure
		.input(
			z.object({
				token: z.string(),
			}),
		)
		.output(tokenCheckResponseSchema)
		.query(async ({ input }) => {
			try {
				// Verify the token and get the decoded payload
				const decoded = decodeToken(input.token)

				// Find the user in the database
				const user = await prisma.user.findUnique({
					where: { id: decoded.userId },
				})

				if (!user) {
					return {
						isAuthed: false,
						user: null,
						token: null,
					}
				}

				// Generate a new token
				const newToken = createToken({
					userId: user.id,
					email: user.email,
					role: user.role,
				})

				const userResponse = {
					id: user.id,
					email: user.email,
					role: user.role,
					createdAt: user.createdAt.toISOString(),
				} satisfies User

				return { isAuthed: true, user: userResponse, token: newToken }
			} catch (error) {
				return {
					isAuthed: false,
					user: null,
					token: null,
				}
			}
		}),

	// // Add a new agency team member
	// authenticationAddAgencyTeamMember: protectedProcedure
	// 	.input(z.object({
	// 		email: z.string().email(),
	// 		name: z.string().min(2, 'Name must be at least 2 characters'),
	// 	}))
	// 	.mutation(async ({ ctx, input }) => {
	// 		// Verify user is an agency user
	// 		if (ctx.user.role !== 'AGENCY_USER' && ctx.user.role !== 'OWNER_OPERATOR') {
	// 			throw new TRPCError({
	// 				code: 'FORBIDDEN',
	// 				message: 'Only agency users can add team members',
	// 			})
	// 		}

	// 		// Get current user's agency information
	// 		const currentUser = await prisma.user.findUnique({
	// 			where: { id: ctx.user.userId },
	// 			select: {
	// 				agencyId: true,
	// 				agency: {
	// 					select: {
	// 						name: true,
	// 						logo: {
	// 							select: {
	// 								url: true,
	// 							},
	// 						},
	// 					},
	// 				},
	// 			},
	// 		})

	// 		if (!currentUser?.agencyId) {
	// 			throw new TRPCError({
	// 				code: 'FORBIDDEN',
	// 				message: 'User is not associated with an agency',
	// 			})
	// 		}

	// 		// Check if a user with this email already exists
	// 		const existingUser = await prisma.user.findUnique({
	// 			where: { email: input.email },
	// 		})

	// 		if (existingUser) {
	// 			throw new TRPCError({
	// 				code: 'CONFLICT',
	// 				message: 'User with this email already exists',
	// 			})
	// 		}

	// 		// Create a new user record without a password (not onboarded)
	// 		const newUser = await prisma.user.create({
	// 			data: {
	// 				email: input.email,
	// 				name: input.name,
	// 				role: 'AGENCY_USER',
	// 				agencyId: currentUser.agencyId,
	// 			},
	// 		})

	// 		// Generate a token for password setup
	// 		const token = crypto.randomBytes(32).toString('hex')
	// 		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

	// 		// Create password reset record that will be used for initial setup
	// 		await prisma.passwordReset.create({
	// 			data: {
	// 				token,
	// 				userId: newUser.id,
	// 				expiresAt,
	// 			},
	// 		})

	// 		// Send invitation email
	// 		await EmailUtil.Templates.AgencyUser.Invite.send(
	// 			{ to: [{ email: input.email }] },
	// 			{
	// 				token,
	// 				agencyName: currentUser.agency!.name,
	// 				agencyLogo: currentUser.agency?.logo?.url || null,
	// 			},
	// 		)

	// 		return { success: true }
	// 	}),

	// Add admin login-as functionality
	adminLoginAs: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
			}),
		)
		.output(authResponseSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify user is admin
			if (ctx.user.role !== 'ADMIN') {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only admins can use this feature',
				})
			}

			// Get the target user
			const targetUser = await prisma.user.findUnique({
				where: { id: input.userId },
			})

			if (!targetUser) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'User not found',
				})
			}

			// Generate JWT token for the target user
			const token = createToken({
				userId: targetUser.id,
				email: targetUser.email,
				role: targetUser.role,
			})

			const userResponse: User = {
				id: targetUser.id,
				email: targetUser.email,
				role: targetUser.role,
				createdAt: targetUser.createdAt.toISOString(),
			}

			return { user: userResponse, token }
		}),
})

export type AppRouter = typeof appRouter
