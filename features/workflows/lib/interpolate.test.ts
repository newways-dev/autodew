import { describe, expect, it } from 'vitest'

import { interpolate } from './interpolate'

describe('interpolate', () => {
  it('returns the text unchanged when it has no placeholders', () => {
    const result = interpolate({ text: 'Hello, world!', outputs: {} })

    expect(result).toBe('Hello, world!')
  })

  it('substitutes a single placeholder from the outputs map', () => {
    const outputs = { openUrl: { title: 'Example Domain' } }

    const result = interpolate({
      text: 'Page title: {{ openUrl.title }}',
      outputs,
    })

    expect(result).toBe('Page title: Example Domain')
  })

  it('substitutes multiple placeholders in the same text', () => {
    const outputs = {
      extract: { price: '19.99' },
      openUrl: { url: 'https://example.com' },
    }

    const result = interpolate({
      text: '{{ openUrl.url }} costs {{ extract.price }}',
      outputs,
    })

    expect(result).toBe('https://example.com costs 19.99')
  })

  it('tolerates extra whitespace inside the braces', () => {
    const outputs = { extract: { price: '19.99' } }

    const result = interpolate({
      text: 'Price: {{   extract.price   }}',
      outputs,
    })

    expect(result).toBe('Price: 19.99')
  })

  it('walks an array index in the path', () => {
    const outputs = {
      observe: { matches: [{ selector: '#buy-button' }] },
    }

    const result = interpolate({
      text: '{{ observe.matches[0].selector }}',
      outputs,
    })

    expect(result).toBe('#buy-button')
  })

  it('replaces a placeholder that resolves to nothing with an empty string', () => {
    const result = interpolate({
      text: 'Value: [{{ missingNode.field }}]',
      outputs: { openUrl: { url: 'https://example.com' } },
    })

    expect(result).toBe('Value: []')
  })

  it('replaces a placeholder pointing past a non-object with an empty string', () => {
    // "extract.price" resolves to a string, so ".length" tries to read a key
    // off a string — getByPath bails out and returns undefined instead of
    // throwing.
    const result = interpolate({
      text: '{{ extract.price.length }}',
      outputs: { extract: { price: '19.99' } },
    })

    expect(result).toBe('')
  })

  it('stringifies an object or array value as JSON', () => {
    const outputs = { extract: { extraction: { price: 19.99, inStock: true } } }

    const result = interpolate({
      text: '{{ extract.extraction }}',
      outputs,
    })

    expect(result).toBe('{"price":19.99,"inStock":true}')
  })

  it('keeps falsy-but-present values instead of treating them as missing', () => {
    // A naive `if (!value) return ''` would wrongly blank out 0 and false —
    // the implementation checks `value == null` specifically to avoid that.
    const outputs = { act: { success: false }, observe: { count: 0 } }

    expect(
      interpolate({ text: '{{ act.success }}', outputs })
    ).toBe('false')
    expect(
      interpolate({ text: '{{ observe.count }}', outputs })
    ).toBe('0')
  })
})
