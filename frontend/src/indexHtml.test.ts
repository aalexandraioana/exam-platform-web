import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('index.html', () => {
  it('asks search engines not to index the app until P2 decides which pages are public', () => {
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8')
    const doc = new DOMParser().parseFromString(html, 'text/html')

    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow')
  })
})
