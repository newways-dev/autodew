import { describe, expect, it } from 'vitest'

import { describeCron, schedulePresets } from './schedule-presets'

describe('describeCron', () => {
  it('returns the matching preset label for a known cron pattern', () => {
    expect(describeCron('0 9 * * *')).toBe('Daily at 9:00 AM')
  })

  it('falls back to the raw cron string for a pattern with no preset', () => {
    const custom = '17 3 * * 2'
    expect(describeCron(custom)).toBe(custom)
  })

  it('has a distinct cron pattern for every preset', () => {
    const patterns = schedulePresets.map((preset) => preset.cron)
    expect(new Set(patterns).size).toBe(patterns.length)
  })
})
