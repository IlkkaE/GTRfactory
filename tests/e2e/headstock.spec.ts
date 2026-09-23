import { test, expect, type Page, type Locator } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { useAppStore } from '../../src/store'
import { settle, fileAction } from './uiHelpers'
const lap = (p: Page) => p.locator('.large .headstock-outline')
const node = (p: Page, id = 'headstock-free-6') =>
  p.locator(`.large [data-headstock-node-id="${id}"]`)
async function save(page: Page, path: string) {
  const event = page.waitForEvent('download')
  await fileAction(page, 'Download project file')
  await (await event).saveAs(path)
  return JSON.parse(await readFile(path, 'utf8'))
}
async function point(locator: Locator) {
  const b = await locator.boundingBox()
  expect(b).not.toBeNull()
  return { x: b!.x + b!.width / 2, y: b!.y + b!.height / 2 }
}
async function drag(page: Page, locator: Locator, dx: number, dy: number) {
  const p = await point(locator)
  await page.mouse.move(p.x, p.y)
  await page.mouse.down()
  await page.mouse.move(p.x + dx, p.y + dy, { steps: 4 })
  await page.mouse.up()
  await settle(page)
}
test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  ;(page as any).headstockErrors = errors
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await expect(lap(page)).toBeVisible()
  await settle(page)
})
test.afterEach(async ({ page }) => {
  expect((page as any).headstockErrors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
test('default headstock focuses in the same front view without making a document change', async ({
  page,
}, info) => {
  await expect(page.locator('.canvas-card')).toHaveCount(3)
  await expect(page.locator('.large .tuner-hole')).toHaveCount(6)
  const world = page.locator('.large [data-transform="world"]'),
    before = await world.getAttribute('transform')
  if (info.project.name === 'mobile-edge') await lap(page).tap()
  else await lap(page).click()
  await expect(node(page)).toBeVisible()
  expect(await world.getAttribute('transform')).not.toBe(before)
  await expect(page.getByTestId('save-state')).toHaveText('Saved')
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Fit to view', exact: true }).click()
  await expect(node(page)).toHaveCount(0)
  expect(await world.getAttribute('transform')).toBe(before)
  await lap(page).focus()
  await lap(page).press('Enter')
  await expect(node(page)).toBeVisible()
})
test('node and handle drag preserve the camera, undo, redo and project round trip', async ({
  page,
}, info) => {
  const before = await save(page, info.outputPath('before.gtrfactory'))
  await lap(page).click()
  await node(page).click()
  const world = page.locator('.large [data-transform="world"]'),
    camera = await world.getAttribute('transform'),
    old = await lap(page).getAttribute('d')
  await drag(page, node(page), 0, 4)
  await expect(lap(page)).not.toHaveAttribute('d', old!)
  expect(await world.getAttribute('transform')).toBe(camera)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(lap(page)).toHaveAttribute('d', old!)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(lap(page)).not.toHaveAttribute('d', old!)
  const handle = page.locator(
      '.large [data-headstock-handle-id="headstock-free-6"][data-side="outHandle"]',
    ),
    prior = await lap(page).getAttribute('d')
  await drag(page, handle, 0, 3)
  await expect(lap(page)).not.toHaveAttribute('d', prior!)
  const after = await save(page, info.outputPath('after.gtrfactory'))
  expect(after.version).toBe(13)
  expect(after.neck.headstock).not.toEqual(before.neck.headstock)
  expect(after.neck.snapshot).toEqual(before.neck.snapshot)
  expect(after.body).toEqual(before.body)
  await page.getByTestId('project-file').setInputFiles({
    name: 'reopen.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(after)),
  })
  await expect(node(page)).toHaveCount(0)
  expect(await save(page, info.outputPath('reopened.gtrfactory'))).toEqual(after)
})
test('protected nodes and invalid numeric edits preserve the accepted shape', async ({
  page,
}, info) => {
  const before = await save(page, info.outputPath('locked-before.gtrfactory'))
  await lap(page).click()
  const old = await lap(page).getAttribute('d')
  await drag(page, node(page, 'headstock-tuner-start'), 12, 12)
  await expect(lap(page)).toHaveAttribute('d', old!)
  await expect(page.getByRole('textbox', { name: 'Node X', exact: true })).toBeDisabled()
  await node(page).click()
  const field = page.getByRole('textbox', { name: 'Node X', exact: true })
  await field.fill('-500')
  await field.press('Enter')
  await expect(lap(page)).toHaveAttribute('d', old!)
  expect(await save(page, info.outputPath('locked-after.gtrfactory'))).toEqual(before)
  await node(page).focus()
  await node(page).press('ArrowDown')
  await expect(lap(page)).not.toHaveAttribute('d', old!)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(lap(page)).toHaveAttribute('d', old!)
})
test('6 7 8 and unsupported necks retain real counts and version rejection is atomic', async ({
  page,
}, info) => {
  useAppStore.getState().newProject()
  const base = structuredClone(useAppStore.getState().document)
  for (const count of [7, 8, 5, 6]) {
    useAppStore.getState().replace(base)
    const n = base.neck!
    useAppStore.getState().configureWholeNeck({
      params: {
        ...n.params,
        strings: count,
        ...(count === 7 || count === 8
          ? { stringSpanNut: (count - 1) * 7, stringSpanBridge: (count - 1) * 10.5 }
          : {}),
      },
      end: n.end,
      placement: n.placement,
    })
    const d = useAppStore.getState().document
    expect(d.neck!.params.strings).toBe(count)
    await page.getByTestId('project-file').setInputFiles({
      name: 'count.gtrfactory',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(d)),
    })
    await expect(page.locator('.large .tuner-hole')).toHaveCount(count === 5 ? 0 : count)
    if (count === 5)
      await expect(
        page.getByText(
          'Headstocks support 6–8-string guitars and a dedicated 4-string bass template.',
          { exact: true },
        ),
      ).toBeVisible()
  }
  const accepted = await save(page, info.outputPath('accepted.gtrfactory')),
    old = await lap(page).getAttribute('d')
  accepted.version = 6
  await page.getByTestId('project-file').setInputFiles({
    name: 'old-v6.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(accepted)),
  })
  await expect(
    page.locator('.notice').filter({ hasText: 'supported versions are 10, 11, 12 and 13' }),
  ).toBeVisible()
  await expect(lap(page)).toHaveAttribute('d', old!)
})
