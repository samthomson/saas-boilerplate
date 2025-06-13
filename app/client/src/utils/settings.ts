// UI settings stored in localStorage

export type DayWidthSize = 'small' | 'medium' | 'large'

export interface UISettings {}

const APP_NAME = process.env.APP_NAME as string
const SETTINGS_KEY = APP_NAME + '-ui-settings'

// Default UI settings
const defaults: UISettings = {}

/**
 * Get settings from localStorage
 */
export const getSettings = (): UISettings => {
	try {
		const stored = localStorage.getItem(SETTINGS_KEY)
		if (!stored) return defaults

		return { ...defaults, ...JSON.parse(stored) }
	} catch (error) {
		console.error('Failed to load UI settings from localStorage:', error)
		return defaults
	}
}

/**
 * Update settings in localStorage
 */
export const saveSettings = (settings: Partial<UISettings>): UISettings => {
	try {
		const current = getSettings()
		const updated = { ...current, ...settings }

		localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
		return updated
	} catch (error) {
		console.error('Failed to save UI settings to localStorage:', error)
		return getSettings()
	}
}
