import { Title } from '@mantine/core'
import { ACCENT_COLOUR } from '../App'

interface BrandProps {
	size?: 'sm' | 'md' | 'lg'
	logoOnly?: boolean
}

const Logo = ({
	size = 'md',
	color = ACCENT_COLOUR,
}: {
	size?: BrandProps['size'] | 'xs'
	color?: string
}) => {
	const sizes = {
		sm: 24,
		md: 32,
		lg: 40,
		xs: 16, // Added for the "powered by" version
	}

	const dimension = sizes[size]

	return (
		<svg
			width={dimension}
			height={dimension}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"
				stroke={color}
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				fill="none"
			/>
		</svg>
	)
}

export function Brand({ size = 'md', logoOnly }: BrandProps) {
	const textSizes = {
		sm: '16px',
		md: '20px',
		lg: '24px',
	}

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '12px',
			}}
		>
			<Logo size={size} />
			{!logoOnly && (
				<Title
					order={2}
					style={{
						margin: 0,
						fontSize: textSizes[size],
						fontWeight: 700,
						color: '#111827',
					}}
				>
					[todo: app name?]
				</Title>
			)}
		</div>
	)
}
