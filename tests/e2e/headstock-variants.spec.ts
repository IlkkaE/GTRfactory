import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { fileAction, settle, openNeckDock } from './uiHelpers'
const lap = (p: Page) => p.locator('.large .headstock-outline')
const nodes = (p: Page) => p.locator('.large [data-headstock-node-id]')
const model = (p: Page) => p.getByRole('combobox', { name: 'Headstock template', exact: true })
async function save(p: Page, path: string) {
  const pending = p.waitForEvent('download')
  await fileAction(p, 'Download project file')
  await (await pending).saveAs(path)
  return JSON.parse(await readFile(path, 'utf8'))
}
async function open(p: Page) {
  await lap(p).focus()
  await lap(p).press('Enter')
  await expect(model(p)).toBeVisible()
  await settle(p)
}
async function choose(p: Page, id: string) {
  await model(p).selectOption(id)
  await expect(model(p)).toHaveValue(id)
  await settle(p)
}
test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  ;(page as any).__errors = errors
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await expect(lap(page)).toBeVisible()
  await settle(page)
})
test.afterEach(async ({ page }) => {
  expect((page as any).__errors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
test('headstock context hides pickup actions and each 3+3 model supports insert and both delete controls', async ({
  page,
}) => {
  await page.getByRole('button', { name: '+ Pickup cavity', exact: true }).click()
  await open(page)
  await expect(page.getByRole('button', { name: '+ Pickup cavity', exact: true })).toHaveCount(0)
  await expect(page.locator('.pickup-profile-popup')).toHaveCount(0)
  await expect(model(page).locator('option')).toHaveCount(5)
  for (const id of ['three-three-2', 'three-three-3']) {
    await choose(page, id)
    await expect(nodes(page)).toHaveCount(9)
    await expect(page.locator('.large .tuner-hole')).toHaveCount(6)
    await expect(page.locator('.large [data-headstock-node-id].protected')).toHaveCount(6)
    const boundary = page.locator(`.large [data-headstock-node-id="${id}-node-2"]`)
    await boundary.focus()
    await boundary.press('Enter')
    await expect(page.getByRole('textbox', { name: 'Node X', exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Delete point', exact: true })).toBeDisabled()
    await boundary.press('Delete')
    await expect(nodes(page)).toHaveCount(9)
    const segment = page.locator(`.large [data-headstock-segment-id="${id}-node-3"]`)
    await segment.focus()
    await segment.press('Enter')
    await expect(page.locator('.headstock-segment-preview-marker')).toBeVisible()
    const ids = await nodes(page).evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-headstock-node-id')),
    )
    await page.getByRole('button', { name: 'Add point', exact: true }).click()
    await expect(nodes(page)).toHaveCount(10)
    const added = (
      await nodes(page).evaluateAll((els) =>
        els.map((e) => e.getAttribute('data-headstock-node-id')),
      )
    ).find((id) => !ids.includes(id))!
    const selected = page.locator(`.large [data-headstock-node-id="${added}"]`)
    await selected.focus()
    await selected.press('Delete')
    await expect(nodes(page)).toHaveCount(9)
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await expect(nodes(page)).toHaveCount(10)
    await selected.focus()
    await selected.press('Enter')
    await page.getByRole('button', { name: 'Delete point', exact: true }).click()
    await expect(nodes(page)).toHaveCount(9)
  }
  await page.getByRole('button', { name: 'Fit to view', exact: true }).click()
  await expect(model(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: '+ Pickup cavity', exact: true })).toBeVisible()
})
test('model-specific tip edits survive switching and a real v13 download/reopen', async ({
  page,
}, info) => {
  await open(page)
  const shapes: Record<string, string> = {}
  for (const id of ['three-three-2', 'three-three-3']) {
    await choose(page, id)
    const before = await lap(page).getAttribute('d'),
      node = page.locator(`.large [data-headstock-node-id="${id}-node-4"]`)
    await node.focus()
    await node.press('Enter')
    await node.press('ArrowRight')
    await expect(lap(page)).not.toHaveAttribute('d', before!)
    shapes[id] = (await lap(page).getAttribute('d'))!
    const count = await nodes(page).count(),
      field = page.getByRole('textbox', { name: 'Node X', exact: true })
    await field.focus()
    await field.press('Delete')
    await expect(nodes(page)).toHaveCount(count)
    await field.press('Escape')
  }
  await choose(page, 'inline')
  await choose(page, 'three-three-2')
  await expect(lap(page)).toHaveAttribute('d', shapes['three-three-2'])
  await choose(page, 'three-three-3')
  await expect(lap(page)).toHaveAttribute('d', shapes['three-three-3'])
  const saved = await save(page, info.outputPath('three-models-v13.gtrfactory'))
  expect(saved.version).toBe(13)
  expect(saved.neck.headstock.version).toBe(3)
  expect(Object.keys(saved.neck.headstock.variants)).toEqual([
    'inline',
    'three-three-2',
    'three-three-3',
    'bass-4-inline',
    'headless',
  ])
  await page.getByTestId('project-file').setInputFiles({
    name: 'reopen.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(saved)),
  })
  await open(page)
  await expect(lap(page)).toHaveAttribute('d', shapes['three-three-3'])
  await choose(page, 'three-three-2')
  await expect(lap(page)).toHaveAttribute('d', shapes['three-three-2'])
  const before = await lap(page).getAttribute('d')
  saved.version = 7
  await page.getByTestId('project-file').setInputFiles({
    name: 'v7.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(saved)),
  })
  await expect(
    page.locator('.notice').filter({ hasText: 'supported versions are 10, 11, 12 and 13' }),
  ).toBeVisible()
  await expect(lap(page)).toHaveAttribute('d', before!)
})
test('neck count change uses inline for seven strings and restores retained 3+3 after returning to six', async ({
  page,
}) => {
  await open(page)
  await choose(page, 'three-three-2')
  const original = await lap(page).getAttribute('d')
  await page.getByRole('button', { name: 'Fit to view', exact: true }).click()
  await openNeckDock(page)
  await page.getByRole('textbox', { name: 'Strings', exact: true }).fill('7')
  await page.getByRole('textbox', { name: 'String spacing at nut', exact: true }).fill('42')
  await page.getByRole('textbox', { name: 'String spacing at bridge', exact: true }).fill('63')
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  await open(page)
  await expect(model(page)).toHaveValue('inline')
  await expect(model(page).locator('option[value="three-three-2"]')).toHaveAttribute('disabled', '')
  expect(
    await model(page)
      .locator('option[value="three-three-2"]')
      .evaluate((el) => (el as HTMLOptionElement).disabled),
  ).toBe(true)
  await expect(page.locator('.large .tuner-hole')).toHaveCount(7)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(model(page)).toHaveValue('three-three-2')
  await expect(lap(page)).toHaveAttribute('d', original!)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(model(page)).toHaveValue('inline')
  await page.getByRole('button', { name: 'Fit to view', exact: true }).click()
  await openNeckDock(page)
  await page.getByRole('textbox', { name: 'Strings', exact: true }).fill('6')
  await page.getByRole('textbox', { name: 'String spacing at nut', exact: true }).fill('35.81224')
  await page.getByRole('textbox', { name: 'String spacing at bridge', exact: true }).fill('52.5018')
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  await open(page)
  await expect(model(page)).toHaveValue('inline')
  await choose(page, 'three-three-2')
  await expect(page.locator('.large .tuner-hole')).toHaveCount(6)
})
