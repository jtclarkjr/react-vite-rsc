import { randomUUID } from 'node:crypto'
import { expect, test as base, type Page } from 'playwright/test'

const test = base.extend({
  page: async ({ page }, use) => {
    const browserErrors: string[] = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text())
    })

    await use(page)

    expect(browserErrors, 'Browser exceptions, hydration errors, and failed resources').toEqual([])
  }
})

test.beforeAll(async ({ request }) => {
  await expect
    .poll(
      async () => {
        const response = await request.get('/')
        return (
          response.status() === 200 &&
          (await response.text()).includes('Minimal React RSC boilerplate for Vite Plus.')
        )
      },
      { timeout: 60_000, message: 'The server must render home HTML before browser tests begin' }
    )
    .toBe(true)
})

async function openHydratedHome(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Minimal React RSC boilerplate for Vite Plus.'
  )

  const message = 'Hydrated in the browser'
  await expect(async () => {
    const input = page.getByPlaceholder('Update starter state')
    await input.fill('')
    await input.fill(message)
    await expect(page.locator('dd').first()).toHaveText(message, { timeout: 1_000 })
  }).toPass()
}

test('renders home HTML and hydrates the starter state without browser errors', async ({
  page,
  request
}) => {
  const response = await request.get('/')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('text/html')
  const html = await response.text()
  expect(html).toContain('Minimal React RSC boilerplate for Vite Plus.')
  expect(html).toContain('value="Hello from your React RSC starter."')

  await openHydratedHome(page)
  await expect(page.locator('dd').nth(1)).toHaveText(/^\d{4}-\d{2}-\d{2}T/)
  await page.getByRole('button', { name: 'Reset message' }).click()
  await expect(page.getByPlaceholder('Update starter state')).toHaveValue(
    'Hello from your React RSC starter.'
  )
  await expect(page.locator('dd').first()).toHaveText('Hello from your React RSC starter.')
})

test('navigates through Flight, back, and a dotted blog slug without replacing the document', async ({
  page
}) => {
  await openHydratedHome(page)
  const documentId = randomUUID()
  await page.evaluate((id) => {
    document.documentElement.dataset.e2eDocument = id
  }, documentId)

  const aboutFlight = page.waitForResponse((response) => {
    return new URL(response.url()).pathname === '/_rsc/about'
  })
  await page.getByRole('link', { name: 'About', exact: true }).click()
  const response = await aboutFlight
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toContain('no-store')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Included by default.')
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Minimal React RSC boilerplate for Vite Plus.'
  )

  const slug = `e2e.${randomUUID()}`
  await page.evaluate((path) => window.history.pushState(null, '', path), `/blog/${slug}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Blog slug: ${slug}`)
  await expect(page.locator('html')).toHaveAttribute('data-e2e-document', documentId)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Blog slug: ${slug}`)
})

test('persists the newest five notes per slug through hydrated server actions', async ({
  page
}) => {
  await openHydratedHome(page)
  const slug = `e2e-notes.${randomUUID()}`
  await page.evaluate((path) => window.history.pushState(null, '', path), `/blog/${slug}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Blog slug: ${slug}`)

  const notes = page.locator('main li')
  await expect(notes).toHaveCount(0)
  for (let index = 1; index <= 6; index += 1) {
    await page.getByPlaceholder(`Add a note for ${slug}`).fill(`Note ${index}`)
    const actionResponse = page.waitForResponse((response) => {
      return (
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.startsWith('/_actions/')
      )
    })
    await page.getByRole('button', { name: 'Save server note' }).click()
    const response = await actionResponse
    expect(response.status()).toBe(200)
    expect(response.headers()['cache-control']).toContain('no-store')
    await expect(notes).toHaveText(
      Array.from({ length: Math.min(index, 5) }, (_, offset) => `Note ${index - offset}`)
    )
  }

  await page.reload()
  await expect(notes).toHaveText(['Note 6', 'Note 5', 'Note 4', 'Note 3', 'Note 2'])
  await page.goto(`/blog/e2e-other.${randomUUID()}`)
  await expect(notes).toHaveCount(0)
})

test('preserves typed posts and request API response shapes', async ({ request }) => {
  const posts = await request.get('/api/posts')
  expect(posts.status()).toBe(200)
  expect(Array.isArray(await posts.json())).toBe(true)

  const demo = await request.get('/api/demo/request')
  expect(demo.status()).toBe(200)
  expect(await demo.json()).toMatchObject({
    authenticated: false,
    kind: 'api',
    method: 'GET',
    pathname: '/api/demo/request',
    timestamp: expect.any(String)
  })
})

test('redirects unauthenticated client navigation, logs in, and clears demo authentication', async ({
  page,
  context
}) => {
  await openHydratedHome(page)
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click()
  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Demo Void auth gate.')
  await page.getByLabel('Demo username').fill('e2e-user')
  await page.getByRole('button', { name: 'Set demo auth cookie' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Protected before render.')
  expect(await context.cookies()).toContainEqual(
    expect.objectContaining({ name: 'demo-auth', value: '1', httpOnly: true })
  )
  const authenticatedApi = await page.request.get('/api/demo/request')
  expect(await authenticatedApi.json()).toMatchObject({ authenticated: true })

  await page.getByRole('button', { name: 'Clear demo auth cookie' }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(await context.cookies()).not.toContainEqual(expect.objectContaining({ name: 'demo-auth' }))
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard$/)
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('submits a bound server action as an HTML form and retains its note on a fresh GET', async ({
    page
  }) => {
    const slug = `e2e-nojs.${randomUUID()}`
    const response = await page.goto(`/blog/${slug}`)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Blog slug: ${slug}`)
    await page.getByPlaceholder(`Add a note for ${slug}`).fill('Saved without JavaScript')
    const formResponse = page.waitForResponse((result) => {
      return result.request().method() === 'POST'
    })
    await page.getByRole('button', { name: 'Save server note' }).click()
    expect((await formResponse).status()).toBe(200)
    await expect(page.locator('main li')).toHaveText(['Saved without JavaScript'])
    await page.goto(`/blog/${slug}`)
    await expect(page.locator('main li')).toHaveText(['Saved without JavaScript'])
  })
})
