export const getHost = (): string => {
	return process.env.HOST + ':' + process.env.CLIENT_PORT as string
}