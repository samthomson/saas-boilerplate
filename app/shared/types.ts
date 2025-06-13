export type EmailSendingParams = {
	from?: string
	to: { email: string; name?: string }[]
	subject: string
	message: string
	htmlMessage?: string
}