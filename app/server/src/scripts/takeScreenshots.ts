import { chromium, Page, devices } from 'playwright'
import path from 'path'
import fs from 'fs'

const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots')
const appUrl = 'TODO'
const loginEmail = 'TODO'
const loginPassword = 'TODO'

let expectedScreenshots = 0 // Counter for expected screenshots

function setupScreenshotsDir(): void {
	if (fs.existsSync(screenshotsDir)) {
		const files = fs.readdirSync(screenshotsDir)
		for (const file of files) {
			if (file.endsWith('.png')) {
				fs.unlinkSync(path.join(screenshotsDir, file))
			}
		}
	} else {
		fs.mkdirSync(screenshotsDir, { recursive: true })
	}
}

async function login(page: Page): Promise<void> {
	await page.goto(appUrl, { waitUntil: 'networkidle' })

	const emailInputLocator = page.locator('#email')
	const passwordInputLocator = page.locator('#password')
	const submitButtonLocator = page.locator('#login-submit-button')

	await emailInputLocator.waitFor({ state: 'visible' })
	await emailInputLocator.fill(loginEmail)

	await passwordInputLocator.waitFor({ state: 'visible' })
	await passwordInputLocator.fill(loginPassword)

	await submitButtonLocator.waitFor({ state: 'visible' })
	await submitButtonLocator.click()

	// Wait for navigation to the agency dashboard URL pattern
	await page.waitForURL('**/agency', { waitUntil: 'networkidle' })
}

async function captureScreenshot(page: Page, name: string, viewportType: string): Promise<void> {
	const filePath = path.join(screenshotsDir, `${name}-${viewportType}.png`)
	await page.screenshot({
		path: filePath,
		fullPage: false,
	})
}

async function captureTripsPage(page: Page, viewportType: string): Promise<void> {
	expectedScreenshots++
	await page.goto(appUrl + '/agency/trips', { waitUntil: 'networkidle' })
	// Wait for the main content area to likely be loaded, targeting the specific H3 heading
	
	await page.waitForTimeout(500)
	await captureScreenshot(page, 'agency-trips', viewportType)
}

async function captureTimelinePage(page: Page, viewportType: string): Promise<void> {
	expectedScreenshots++
	await page.goto(appUrl + '/agency/trips/timeline', { waitUntil: 'networkidle' })
	await page.waitForTimeout(5000)
	await captureScreenshot(page, 'agency-trips-timeline', viewportType)
}

async function captureTripDetailsPage(page: Page, viewportType: string): Promise<void> {
	expectedScreenshots += 3 // Expecting three screenshots from this function

	// Go to the main trips page first to find a trip
	await page.goto(appUrl + '/agency/trips', { waitUntil: 'networkidle' })
	await page.waitForTimeout(1000) // Wait for trips to potentially load

	// Find the first 'Manage Trip' button/link and click it
	// Using a selector that targets a link within a card containing the text 'Manage Trip'
	const manageTripButton = page.locator('div:has-text("Manage Trip") a:has-text("Manage Trip")').first()
	await manageTripButton.waitFor({ state: 'visible', timeout: 5000 }) // Wait for the button to appear
	await manageTripButton.click()

	// Wait for navigation/page load after clicking 'Manage Trip'
	await page.waitForURL('**/agency/trips/*', { waitUntil: 'networkidle' }) // Wait for URL pattern like /agency/trips/some-trip-id
	await page.waitForTimeout(1000) // Extra wait for rendering

	// Capture screenshot of the trip details page
	await captureScreenshot(page, 'agency-trip-details', viewportType)

	// Navigate to the clients tab of the same trip page
	const currentUrl = page.url()
	await page.goto(currentUrl + '#clients', { waitUntil: 'networkidle' })

	const clientsCardLocator = page.locator('div.mantine-Card-root:has(h3:has-text("Clients"))')
	const clientsTableLocator = clientsCardLocator.locator('table')
	try {
		await clientsCardLocator.waitFor({ state: 'visible', timeout: 5000 })
		await clientsTableLocator.waitFor({ state: 'visible', timeout: 5000 })
		await clientsCardLocator.evaluate(element => element.scrollIntoView({ block: 'start' }))
	
		await page.mouse.wheel(0, -20)

		await page.waitForTimeout(500)
	} catch (error) {
		console.warn('Could not find/wait/scroll Clients card or table, capturing screenshot anyway.', error)
	}

	await captureScreenshot(page, 'agency-trip-details-clients', viewportType)

	// Navigate to and capture the file hub section
	const fileHubCardLocator = page.locator('div.mantine-Card-root:has(h3:has-text("Shared Files / Docs"))')
	try {
		await fileHubCardLocator.waitFor({ state: 'visible', timeout: 5000 })
		await fileHubCardLocator.evaluate(element => element.scrollIntoView({ block: 'start' }))
		await page.mouse.wheel(0, -20)
		await page.waitForTimeout(500)
	} catch (error) {
		console.warn('Could not find/wait/scroll File Hub card, capturing screenshot anyway.', error)
	}

	await captureScreenshot(page, 'agency-trip-details-files', viewportType)
}

async function captureGuidesPage(page: Page, viewportType: string): Promise<void> {
	expectedScreenshots++
	await page.goto(appUrl+'/agency/guides', { waitUntil: 'networkidle' })
	await page.waitForTimeout(500)
	await captureScreenshot(page, 'agency-guides', viewportType)
}

async function captureGuidesAvailabilityPage(page: Page, viewportType: string): Promise<void> {
	expectedScreenshots++
	await page.goto(appUrl + '/agency/guides/availability', {
		waitUntil: 'networkidle',
	})
	await page.waitForTimeout(500)
	await captureScreenshot(page, 'agency-guides-availability', viewportType)
}

async function captureCheckAvailabilityPage(page: Page, viewportType: string): Promise<void> {
	expectedScreenshots++
	
	// Create a date string in ISO format for June 2nd and June 9th of the current year
	const currentYear = new Date().getFullYear()
	const startDate = new Date(currentYear, 5, 2) // June is month 5 (0-indexed)
	const endDate = new Date(currentYear, 5, 9)
	
	// Navigate to the check availability page with date parameters in the URL
	const dateParams = `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
	await page.goto(`${appUrl}/agency/guides/check-availability?${dateParams}`, {
		waitUntil: 'networkidle',
		timeout: 15000,
	})
	
	console.log('Navigated to check availability page with date parameters')
	
	// Allow more time for the page to fully load and render
	await page.waitForTimeout(5000)
	
	// Wait for the DatePicker to be visible
	try {
		await page
			.locator('div[role="dialog"], .mantine-Collapse-content')
			.waitFor({ state: 'visible', timeout: 2000 })
		
		console.log('Page content has loaded')
	} catch (error) {
		console.log('Could not find expected content, continuing anyway')
	}
	
	// Take the screenshot
	await captureScreenshot(page, 'agency-guides-check-availability-results', viewportType)
}

async function captureClientsPage(page: Page, viewportType: string): Promise<void> {
	expectedScreenshots++
	await page.goto(appUrl + '/agency/clients', { waitUntil: 'networkidle' })

	await page.waitForTimeout(500)
	await captureScreenshot(page, 'agency-clients', viewportType)
}

function validateScreenshotCount(): void {
	const files = fs.readdirSync(screenshotsDir)
	const actualScreenshots = files.filter((file) => file.endsWith('.png')).length

	if (actualScreenshots !== expectedScreenshots) {
		throw new Error(
			`Screenshot count mismatch: Expected ${expectedScreenshots}, found ${actualScreenshots}`,
		)
	}
}

async function runScreenshots() {
	setupScreenshotsDir()
	expectedScreenshots = 0 // Reset counter at the start of the run

	const browser = await chromium.launch({ headless: true })
	
	const contexts = [
		{
			type: 'mobile',
			context: await browser.newContext({
				...devices['iPhone 12 Mini'],
			}),
		},
		{
			type: 'desktop',
			context: await browser.newContext({
				viewport: { width: 1440, height: 900 },
			}),
		},
	]
	
	try {
		for (const { type, context } of contexts) {
			const page = await context.newPage()
			await login(page)
			
			try {
				await captureTripsPage(page, type)
				await captureTimelinePage(page, type)
				await captureTripDetailsPage(page, type)
				await captureGuidesPage(page, type)
				await captureGuidesAvailabilityPage(page, type)
				if (type === 'desktop') {
					await captureCheckAvailabilityPage(page, type)
				}
				await captureClientsPage(page, type)
			} catch (error) {
				console.error(`Error capturing screenshots for ${type}:`, error)
			} finally {
				await context.close()
			}
		}
		
		validateScreenshotCount()
	} catch (error) {
		console.error('Error during screenshot process:', error)
		throw error
	} finally {
		await browser.close()
	}
}

// --- Script Execution ---
runScreenshots()
	.then(() => console.log('Screenshot script finished successfully.'))
	.catch((_err) => {
		// The error is already logged in the runScreenshots catch block
		// We log a simpler failure message here and ensure exit code is non-zero
		console.error('Screenshot script failed.')
		process.exit(1)
	}) 