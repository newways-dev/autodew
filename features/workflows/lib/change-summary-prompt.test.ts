import { describe, expect, it } from 'vitest'

import { buildChangeSummaryPrompt } from './change-summary-prompt'

describe('buildChangeSummaryPrompt', () => {
  it('asks for a baseline statement when there is no previous value', () => {
    const prompt = buildChangeSummaryPrompt({
      previousValue: null,
      newValue: '$49.00',
    })

    expect(prompt).toContain('first time')
    expect(prompt).toContain('$49.00')
    expect(prompt).not.toContain('Previous value')
  })

  it('includes both values when comparing a change', () => {
    const prompt = buildChangeSummaryPrompt({
      previousValue: '$49.00',
      newValue: '$39.00',
    })

    expect(prompt).toContain('$49.00')
    expect(prompt).toContain('$39.00')
  })
})
