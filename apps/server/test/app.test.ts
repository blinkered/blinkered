import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'

describe('the API', () => {
  it('answers /healthz without touching anything else', async () => {
    const response = await createApp().request('/healthz')
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('ok')
  })

  it('404s a path it does not have, rather than answering everything', async () => {
    // The same rule the static site follows: an unknown path is an error and should say so.
    const response = await createApp().request('/v1/nope')
    expect(response.status).toBe(404)
  })
})
