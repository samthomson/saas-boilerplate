import { trpc } from '../trpc'
import { Tabs, TextInput, Paper, Grid, Box, Stack } from '@mantine/core'
import { MainLayout } from '../layouts/MainLayout'
import { useState, useEffect } from 'react'

const formatParams = (paramsStr: string) => {
	try {
		const params = JSON.parse(paramsStr)
		const entries = Object.entries(params)
		const formattedEntries = entries.map(([key, value]) => {
			const valueStr = typeof value === 'string' ? `"${value}"` : JSON.stringify(value)
			return `  "${key}": ${valueStr}`
		})
		return `{\n${formattedEntries.join(',\n')}\n}`
	} catch {
		return paramsStr
	}
}

const AdminEmailsPage = () => {
	const [logoUrl, setLogoUrl] = useState('')
	const [agencyName, setAgencyName] = useState('')
	const [debouncedLogo, setDebouncedLogo] = useState(logoUrl)
	const [debouncedName, setDebouncedName] = useState(agencyName)

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedLogo(logoUrl)
			setDebouncedName(agencyName)
		}, 500)
		return () => clearTimeout(timer)
	}, [logoUrl, agencyName])

	const { data, isLoading } = trpc.getEmailTemplates.useQuery({
		agencyLogo: debouncedLogo || undefined,
		agencyName: debouncedName || undefined,
	})

	if (!data?.length && !isLoading) {
		return (
			<MainLayout header={{ title: 'Email Templates' }}>
				<div>No email templates found.</div>
			</MainLayout>
		)
	}

	return (
		<MainLayout header={{ title: 'Email Templates' }} isLoading={isLoading}>
			{!!data && (
				<>
					<Paper shadow="xs" p="md" mb="xl" withBorder>
						<Grid>
							<Grid.Col span={6}>
								<TextInput
									label="Agency Name"
									placeholder="Enter agency name"
									value={agencyName}
									onChange={(e) => setAgencyName(e.currentTarget.value)}
									size="md"
								/>
							</Grid.Col>
							<Grid.Col span={6}>
								<TextInput
									label="Agency Logo URL"
									placeholder="Enter logo URL"
									value={logoUrl}
									onChange={(e) => setLogoUrl(e.currentTarget.value)}
									size="md"
								/>
							</Grid.Col>
						</Grid>
					</Paper>

					<Tabs defaultValue={data[0].name} variant="outline" orientation="vertical">
						<Tabs.List>
							{data.map((template) => (
								<Tabs.Tab bg="white" key={template.name} value={template.name}>
									{template.name}
								</Tabs.Tab>
							))}
						</Tabs.List>

						{data.map((template) => (
							<Tabs.Panel
								key={template.name}
								value={template.name}
								bg="white"
								pl="xl"
							>
								<Box p="md">
									<Stack gap="md">
										<Paper shadow="xs" p="md" withBorder>
											<Box mb="xs" fz="sm" fw={500}>
												Parameters:
											</Box>
											<Box
												component="pre"
												style={{
													fontSize: '14px',
													backgroundColor: '#f8f9fa',
													padding: '12px',
													borderRadius: '4px',
													whiteSpace: 'pre-wrap',
													wordBreak: 'break-word',
												}}
											>
												{formatParams(template.params)}
											</Box>
										</Paper>

										<Paper shadow="xs" p="md" withBorder>
											<Box mb="xs" fz="sm" fw={500}>
												Preview:
											</Box>
											<div
												dangerouslySetInnerHTML={{
													__html: JSON.parse(template.html),
												}}
											/>
										</Paper>
									</Stack>
								</Box>
							</Tabs.Panel>
						))}
					</Tabs>
				</>
			)}
		</MainLayout>
	)
}

export default AdminEmailsPage
