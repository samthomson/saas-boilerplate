import { Resend } from 'resend'
import fs from 'fs'
// import * as appRoot from 'app-root-path'
import path from 'path'
import mjml2html from 'mjml'
import * as Handlebars from 'handlebars'
import { getHost } from './host'
import logger from '../logger'

// Add this type alias near the top of the file, after the imports
type MakeParamsWithRecord<T> = Record<string, unknown> & T;

// Read MJML template from file
const readMjmlTemplate = async (): Promise<string> => {
	const templatePath = path.join(
		// appRoot.path,
		process.cwd(),
		'src',
		'emails',
		'baseTemplate.mjml',
	)
	try {
		const mjmlContent = await fs.readFileSync(templatePath, 'utf8')
		return mjmlContent
	} catch (error) {
		console.error('Error reading MJML template file', error)
		throw new Error('Failed to read MJML template file.')
	}
}

const createEmailContext = <T extends Record<string, unknown>>(content: string, params: T) => ({
	content,
	...params,
})
const APP_DOMAIN = process.env.APP_DOMAIN as string
const APP_NAME = process.env.APP_NAME as string
const PROD_EMAIL_DOMAIN = process.env.PROD_EMAIL_DOMAIN as string

const EMAIL_DOMAIN = (process.env.ENVIRONMENT === 'STAGING' || process.env.ENVIRONMENT === 'PRODUCTION') ? APP_DOMAIN as string : PROD_EMAIL_DOMAIN

const getEmailSignature = `Best regards,<br/>${APP_NAME}`

type EmailFrom = { name: string; email: string }
type EmailTo = { name?: string; email: string }


const noReplyFrom: EmailFrom = {
	name: APP_NAME,
	email: `noreply@${EMAIL_DOMAIN}`,
}

const appFrom: EmailFrom = {
	name: `Sam @ ${APP_NAME}`,
	email: `sam@${EMAIL_DOMAIN}`,
}
void appFrom

type EmailSendingParams = {
	from?: EmailFrom
	to: { email: string; name?: string }[]
	subject: string
	message: string
	htmlMessage?: string
}

// Helper function to write email details to disk for testing
const writeEmailToDisk = async (emailParams: EmailSendingParams): Promise<boolean> => {
	try {
		const testEmailsDir = path.join(process.cwd(), 'test-emails')
		// Ensure the directory exists
		if (!fs.existsSync(testEmailsDir)) {
			fs.mkdirSync(testEmailsDir, { recursive: true })
		}

		const emailContent = JSON.stringify(emailParams, null, 4) // Pretty print JSON
		const filename = `email-${Date.now()}.json`
		const filePath = path.join(testEmailsDir, filename)

		fs.writeFileSync(filePath, emailContent)
		console.log(`Email written to disk for testing: ${filePath}`) // Log confirmation
		return true
	} catch (error) {
		console.error('Error writing email to disk:', error)
		return false
	}
}

export const getEmails = async (): Promise<{
	name: string
	params: string
	html: string
}[]> => {

	// Sample data for previewing templates
	const sampleParams = {
		// Forgot Password
		forgotPasswordParams: {
			code: 'jfdksufgdug3232k32nfds',
		},
		// User Welcome
		welcomeUserEmail: {},
	}

	const templates = await Promise.all([
		// Forgot Password
		Templates.ForgotPassword.make(sampleParams.forgotPasswordParams),
		// User Welcome
		Templates.User.Welcome.make(sampleParams.welcomeUserEmail),
	])

	return [
		{
			name: 'Forgot password',
			params: JSON.stringify(sampleParams.forgotPasswordParams),
			html: JSON.stringify(templates[0]),
		},
		{
			name: 'User welcome',
			params: JSON.stringify(sampleParams.welcomeUserEmail),
			html: JSON.stringify(templates[1]),
		},
	]
}

const sendEmail = async (params: EmailSendingParams): Promise<boolean> => {
	const { subject, to, htmlMessage } = params
	const from = params.from || noReplyFrom

	// If in testing or CI environment, write to disk instead of sending
	if (process.env.NODE_ENV === 'testing' || process.env.NODE_ENV === 'ci') {
		logger.warn('Detected testing/ci environment, writing email to disk.')
		
		return await writeEmailToDisk(params)
	}

	try {
		if (!process.env.API_KEY_RESEND) {
			logger.error('MISSING API KEY - RESEND')
			throw new Error('MISSING API KEY - RESEND')
		}

		const resend = new Resend(process.env.API_KEY_RESEND)
		const fromLiteral = `${from.name} <${from.email}>`
		const toAddresses = to.map((recipient) => recipient.email)
		const response = await resend.emails.send({
			from: fromLiteral,
			to: toAddresses,
			subject,
			text: 'This message contains html, please enable it in your mail client, in order to view the message',
			html: htmlMessage,
		})

		if (response?.error) {
			logger.error('ERROR SENDING EMAIL', { response, fromLiteral, toAddresses })
			throw new Error('ERROR SENDING EMAIL')
		}

		return !response?.error
	} catch (err) {
		logger.error('err sending', err)
		return false
	}
}

export type SendParams = {
	to: EmailTo[]
}

export namespace Templates {
	export namespace ForgotPassword {

		export type MakeParams = MakeParamsWithRecord<{ code: string }>

		export const make = async (params: MakeParams): Promise<string> => {
			const mjmlTemplate = await readMjmlTemplate()
			const template = Handlebars.compile(mjmlTemplate)

			const host = getHost()
			const resetLink = `${host}/account/password-reset?token=${params.code}`

			const htmlMessage = `
		Hi,<br><br>
		We received a request to reset your password for your account. If you did not initiate this request, please ignore this email.<br><br>
		To reset, click on the link:<br><br>
		<a href="${resetLink}">${resetLink}</a><br><br>
		<p>(This link will only work for a short time)</p><p>
${getEmailSignature}</p>
`
			const context = createEmailContext(htmlMessage, params)
			const mjml = template(context)

			const message = mjml2html(mjml)
			return message.html
		}

		export const send = async (
			sendParams: SendParams,
			makeParams: MakeParams,
		) => {
			const html = await make(makeParams)

			const subject = `Password Reset - ${APP_NAME}`

			const result = await sendEmail({
				to: sendParams.to,
				from: noReplyFrom,
				subject,
				message: 'this email contains html content. please enable html content.',
				htmlMessage: html,
			})

			return result
		}
	}

	export namespace User {
		export namespace Welcome {

			export type MakeParams = MakeParamsWithRecord<object>

			export const make = async (params: MakeParams): Promise<string> => {
				const mjmlTemplate = await readMjmlTemplate()
				const template = Handlebars.compile(mjmlTemplate)

				const host = getHost()
				const link = `${host}`

				const message = `
	Hi,<br/>
	
	<p>Welcome to <strong>${APP_NAME}</strong>.</p>
	
	<p>Get started now: <a href="${link}">${APP_NAME}</a>.</p>
	<p>
	${getEmailSignature}</p>
	`
				const context = createEmailContext(message, params)
				const mjml = template(context)

				const htmlMessage = mjml2html(mjml)
				return htmlMessage.html
			}

			export const send = async (
				sendParams: SendParams,
				makeParams: MakeParams,
			) => {
				const html = await make(makeParams)

				const subject = `Welcome to ${APP_NAME}`

				await sendEmail({
					to: sendParams.to,
					subject,
					message: 'this email contains html content. please enable html content.',
					htmlMessage: html,
				})
			}
		}
	}

	export namespace AdminNotifs {

		export type MakeParams = MakeParamsWithRecord<{ subject: string; message: string }>

		export const make = async (params: MakeParams): Promise<string> => {
			const mjmlTemplate = await readMjmlTemplate()
			const template = Handlebars.compile(mjmlTemplate)

			const htmlMessage = `
				<h2>Admin Notification</h2>
				<p>${params.message}</p>
				<p>
				${getEmailSignature}</p>
			`
			const context = createEmailContext(htmlMessage, params)
			const mjml = template(context)

			const message = mjml2html(mjml)
			return message.html
		}

		export const send = async (
			sendParams: SendParams,
			makeParams: MakeParams,
		) => {
			const html = await make(makeParams)

			const result = await sendEmail({
				to: sendParams.to,
				from: noReplyFrom,
				subject: makeParams.subject,
				message: 'this email contains html content. please enable html content.',
				htmlMessage: html,
			})

			return result
		}
	}
}
