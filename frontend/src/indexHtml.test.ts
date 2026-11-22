import { describe, expect, it } from 'vitest'
import html from '../index.html?raw'

describe('index.html', () => {
  it('asks search engines not to index the app until P2 decides which pages are public', () => {
    const doc = new DOMParser().parseFromString(html, 'text/html')

    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow')
  })
})
