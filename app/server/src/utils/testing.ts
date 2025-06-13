import fs from 'fs'
import path from 'path'
import * as appRoot from 'app-root-path'
import * as Types from '@shared/types'

export const getRandomElement = <T>(items: T[]): T | undefined => {
	if (!items.length) {
		return undefined
	}
	const randomIndex = Math.floor(Math.random() * items.length)
	return items[randomIndex]
}

export const clearEmails = () => {
	// delete all files in test email output dir

	const dirPath = `${appRoot}/test-emails`
	const files = fs.readdirSync(dirPath)
	const emailFiles = files.filter((file) => file !== '.gitkeep')

	for (const file of emailFiles) {
		const filePath = path.join(dirPath, file)
		fs.unlinkSync(filePath)
	}
}

export const getLatestEmail = (): Types.EmailSendingParams | undefined => {
	const dirPath = `${appRoot}/test-emails`
	const files = fs.readdirSync(dirPath)
	const emailFiles = files.filter((file) => file !== '.gitkeep')

	if (!emailFiles.length) {
		return undefined
	}

	// Extract timestamp from file names and sort them
	const latestFile = emailFiles
		.map((file) => ({
			name: file,
			time: parseInt(file.split('-')[1].split('.')[0], 10),
		}))
		.sort((a, b) => b.time - a.time)[0].name // Sort by timestamp descending and get the first item

	const filePath = path.join(dirPath, latestFile)
	const fileContent = fs.readFileSync(filePath, 'utf8')
	const emailObject: Types.EmailSendingParams = JSON.parse(fileContent)

	return emailObject
}
