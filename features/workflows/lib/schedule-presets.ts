export const schedulePresets = [
  { label: 'Every 15 minutes', cron: '*/15 * * * *' },
  { label: 'Hourly', cron: '0 * * * *' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
  { label: 'Daily at 9:00 AM', cron: '0 9 * * *' },
  { label: 'Weekly (Monday, 9:00 AM)', cron: '0 9 * * 1' },
] as const

export type SchedulePreset = (typeof schedulePresets)[number]

export function describeCron(cron: string): string {
  return schedulePresets.find((preset) => preset.cron === cron)?.label ?? cron
}
