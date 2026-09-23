import { describe, expect, it } from 'vitest'

import { compareValue } from './compare-value'

describe('compareValue', () => {
  it('returns first-observation when there is no previous value', () => {
    const result = compareValue({ previousValue: null, newValue: '19.99' })

    expect(result).toEqual({ kind: 'first-observation' })
  })

  it('returns unchanged when the value is identical', () => {
    const result = compareValue({
      previousValue: '19.99',
      newValue: '19.99',
    })

    expect(result).toEqual({ kind: 'unchanged' })
  })

  it('returns changed with the previous value when it differs', () => {
    const result = compareValue({
      previousValue: '19.99',
      newValue: '14.99',
    })

    expect(result).toEqual({ kind: 'changed', previousValue: '19.99' })
  })

  it('treats an empty string as a real, comparable value', () => {
    const result = compareValue({ previousValue: '', newValue: 'in stock' })

    expect(result).toEqual({ kind: 'changed', previousValue: '' })
  })
})
