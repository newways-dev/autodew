import { describe, expect, it } from 'vitest'

import { generateSlug } from './generate-slug'

describe('generateSlug', () => {
  it('returns an adjective-animal slug', () => {
    const slug = generateSlug()

    // Two words made of letters only, joined by a single hyphen — matches
    // the { dictionaries: [adjectives, animals], separator: '-', length: 2 }
    // config without depending on the exact word list.
    expect(slug).toMatch(/^[a-zA-Z]+-[a-zA-Z]+$/)
  })

  it('always produces exactly two hyphen-separated words', () => {
    // Run it a bunch of times instead of trusting a single sample — this is
    // about the *shape* the function always produces, not about any one
    // random result.
    for (let i = 0; i < 20; i++) {
      const slug = generateSlug()
      expect(slug.split('-')).toHaveLength(2)
    }
  })
})
