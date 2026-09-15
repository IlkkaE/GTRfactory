import { expect, test, type Page } from '@playwright/test'
import { activateView, fileAction, openNeckDock, settle } from './uiHelpers'
import { readFile } from 'node:fs/promises'
const errors = new WeakMap<Page, string[]>()
const cavities = (page: Page) => page.locator('.large [data-pickup-id]')
const distance = (page: Page) => page.getByLabel('Pickup-cavity distance to bridge')
const y = async (page: Page) =>
  Number(
    (await cavities(page).first().getAttribute('transform'))!.match(/translate\(0 ([^)]+)/)![1],
  )
async function download(page: Page, path: string) {
  const pending = page.waitForEvent('download')
  await fileAction(page, 'Download project file')
  await (await pending).saveAs(path)
  return JSON.parse(await readFile(path, 'utf8'))
}
async function load(page: Page, data: unknown) {
  await page.getByTestId('project-file').setInputFiles({
    name: 'pickup.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  })
  await expect(page.getByRole('status')).toContainText('Project file opened.')
}
test.beforeEach(async ({ page }) => {
  const messages: string[] = []
  errors.set(page, messages)
  page.on('pageerror', (e) => messages.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') messages.push(m.text())
  })
  await page.goto('/')
  await settle(page)
})
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('default and add selection are clean until one centerline drag; cancel, undo and front-only context work', async ({
  page,
}) => {
  await expect(cavities(page)).toHaveCount(1)
  const original = await y(page)
  await cavities(page).click()
  await expect(page.locator('[data-context="pickup"]')).toBeVisible()
  await expect(page.getByTestId('save-state')).toHaveText('Saved')
  const box = (await cavities(page).boundingBox())!,
    start = { x: box.x + box.width * 0.25, y: box.y + box.height * 0.5 }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + 8, start.y + 8, { steps: 3 })
  expect(await y(page)).not.toBe(original)
  await page.keyboard.press('Escape')
  await page.mouse.up()
  expect(await y(page)).toBe(original)
  await expect(page.getByTestId('save-state')).toHaveText('Saved')
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + 8, start.y, { steps: 3 })
  await page.mouse.up()
  expect(await y(page)).toBeLessThan(original)
  await page.keyboard.press('Control+z')
  expect(await y(page)).toBe(original)
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
  await activateView(page, 'back')
  await page.getByRole('button', { name: '+ Pickup cavity' }).click()
  await expect(page.getByRole('menuitem').locator('svg')).toHaveCount(9)
  await page.getByRole('menuitem', { name: /SSL/ }).click()
  await expect(cavities(page)).toHaveCount(2)
  await expect(page.locator('.large .canvas-card')).toHaveAttribute('data-view', 'front')
  await expect(page.locator('.large .pickup-cavity.selected')).toHaveCount(1)
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(cavities(page)).toHaveCount(1)
  await activateView(page, 'back')
  await expect(page.locator('[data-context="pickup"]')).toHaveCount(0)
})

test('pickup menus expose the nine 6/7/8-string profiles and keep a focused last item visible', async ({
  page,
}) => {
  await page.getByRole('button', { name: '+ Pickup cavity' }).click()
  const menu = page.getByRole('menu')
  await expect(menu.getByRole('menuitem')).toHaveCount(9)
  await expect(menu).toContainText('7 strings')
  await expect(menu).toContainText('8 strings')
  await page.keyboard.press('End')
  const last = menu.getByRole('menuitem').last()
  await expect(last).toBeFocused()
  const visible = await last.evaluate((node) => {
    const a = node.getBoundingClientRect(),
      b = node.parentElement!.getBoundingClientRect()
    return a.top >= b.top && a.bottom <= b.bottom
  })
  expect(visible).toBe(true)
  await page.keyboard.press('Escape')
})
test('distance keeps untouched precision, accepts comma mm and inches once, and rejects blank or collisions', async ({
  page,
}) => {
  await cavities(page).click()
  const original = await y(page)
  await page.getByRole('button', { name: 'in', exact: true }).click()
  await distance(page).focus()
  await distance(page).blur()
  expect(await y(page)).toBe(original)
  await expect(page.getByTestId('save-state')).toHaveText('Saved')
  await distance(page).fill('2')
  await distance(page).press('Enter')
  await distance(page).blur()
  expect(await y(page)).toBeCloseTo(original - 0.8, 7)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  expect(await y(page)).toBe(original)
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'mm', exact: true }).click()
  await distance(page).fill('55,5')
  await distance(page).press('Enter')
  expect(await y(page)).toBeCloseTo(original - 5.5, 7)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  expect(await y(page)).toBe(original)
  await distance(page).fill('')
  await distance(page).blur()
  await expect(page.getByText('Enter a distance.')).toBeVisible()
  expect(await y(page)).toBe(original)
  await distance(page).press('Escape')
  await expect(distance(page)).toHaveValue('50,0')
  await distance(page).fill('1')
  await distance(page).press('Enter')
  expect(await y(page)).toBe(original)
  await expect(distance(page)).toHaveValue('50,0')
  await expect(page.getByTestId('save-state')).toHaveText('Saved')
})

test('model popup is visible, keyboard-contained and dismissible, then changes a model at the same center', async ({
  page,
}, info) => {
  await cavities(page).click()
  const original = await y(page),
    camera = await page.locator('.large [data-transform="world"]').getAttribute('transform')
  const trigger = page.getByRole('button', { name: 'Change profile' })
  await trigger.click()
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible()
  const box = (await menu.boundingBox())!,
    viewport = page.viewportSize()!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Delete')
  expect(await y(page)).toBe(original)
  await expect(cavities(page)).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await trigger.click()
  await page.locator('.wordmark').click()
  await expect(menu).toHaveCount(0)
  await trigger.click()
  await page.screenshot({ path: info.outputPath('pickup-menu.png'), fullPage: false })
  await page.getByRole('menuitem', { name: /P90/ }).click()
  await expect(cavities(page)).toHaveAttribute('aria-label', /P90/)
  expect(await y(page)).toBe(original)
  expect(await page.locator('.large [data-transform="world"]').getAttribute('transform')).toBe(
    camera,
  )
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(cavities(page)).toHaveAttribute('aria-label', /SH-12/)
})

test('real v9 download and reopen retain profiles, empty stays empty and unsupported data cannot replace work', async ({
  page,
}, info) => {
  await page.getByRole('button', { name: '+ Pickup cavity' }).click()
  await page.getByRole('menuitem', { name: /SSL/ }).click()
  const saved = await download(page, info.outputPath('pickup-v5.gtrfactory'))
  expect(saved.version).toBe(11)
  expect(saved.pickupCavities).toHaveLength(2)
  await load(page, saved)
  await expect(cavities(page)).toHaveCount(2)
  const again = await download(page, info.outputPath('pickup-roundtrip.gtrfactory'))
  expect(again).toEqual(saved)
  const invalid = structuredClone(saved)
  invalid.pickupCavities[0].profileVersion = 99
  await page.getByTestId('project-file').setInputFiles({
    name: 'unsupported.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(invalid)),
  })
  await expect(page.getByRole('status')).toContainText('Open failed')
  await expect(cavities(page)).toHaveCount(2)
  await load(page, { ...saved, pickupCavities: [saved.pickupCavities[0]] })
  await cavities(page).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(cavities(page)).toHaveCount(0)
  const empty = await download(page, info.outputPath('empty-v5.gtrfactory'))
  await load(page, empty)
  await expect(cavities(page)).toHaveCount(0)
  const unsupported = structuredClone(saved)
  unsupported.version = 5
  await page.getByTestId('project-file').setInputFiles({
    name: 'unsupported-v5.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(unsupported)),
  })
  await expect(page.getByRole('status')).toContainText('supported versions are 10 and 11')
  await expect(cavities(page)).toHaveCount(0)
})

test('join fret 17 defaults, fret 16 applies once and leaves the pickup fixed through undo', async ({
  page,
}) => {
  const original = await y(page)
  await openNeckDock(page)
  await expect(page.getByLabel('Fret at center node', { exact: true })).toHaveValue('17')
  await page.getByLabel('Fret at center node', { exact: true }).fill('16')
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  expect(await y(page)).toBe(original)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  expect(await y(page)).toBe(original)
  await openNeckDock(page)
  await expect(page.getByLabel('Fret at center node', { exact: true })).toHaveValue('17')
  await page.getByRole('button', { name: 'Cancel changes', exact: true }).click()
})
test('neck changes hold cavities in the body and conflicting neck drafts are rejected before approval', async ({
  page,
}, info) => {
  await cavities(page).click()
  const original = await y(page),
    oldDistance = await distance(page).inputValue()
  await openNeckDock(page)
  await page.getByLabel('Bass scale length', { exact: true }).fill('660.4')
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  expect(await y(page)).toBe(original)
  await cavities(page).click()
  expect(await distance(page).inputValue()).not.toBe(oldDistance)
  const saved = await download(page, info.outputPath('neck-adjusted.gtrfactory'))
  expect(saved.pickupCavities[0].centerYmm).toBe(original)
  await openNeckDock(page)
  await page.getByLabel('Fret at center node', { exact: true }).fill('1')
  await expect(page.getByRole('button', { name: 'Accept', exact: true })).toBeDisabled()
  await expect(page.locator('.neck-dock')).toContainText('pickup cavity')
  await page.getByRole('button', { name: 'Cancel changes', exact: true }).click()
  expect(await y(page)).toBe(original)
  const after = await download(page, info.outputPath('neck-rejected.gtrfactory'))
  expect(after).toEqual(saved)
})
