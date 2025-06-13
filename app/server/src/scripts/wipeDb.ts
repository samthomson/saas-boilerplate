
import logger from '../logger'
import * as DBUtil from '../utils/db'

const wipeDb = async () => {
	await DBUtil.wipeDb()
}

wipeDb()
	.catch(e => {
		logger.error('Error in wipeDb script:', e)
		process.exit(1)
	})
	.finally(() => {
		process.exit(0)
	}) 