import { test, expect, type Page } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'
import { fileAction, settle } from './uiHelpers'
const lap = (p: Page) => p.locator('.large .headstock-outline')
const model = (p: Page) => p.getByRole('combobox', { name: 'Headstock template', exact: true })
const field = (p: Page, name: string) => p.getByRole('textbox', { name, exact: true })
async function openLap(p: Page) {
  await lap(p).focus()
  await lap(p).press('Enter')
  await expect(model(p)).toBeVisible()
  await settle(p)
}
async function select(p: Page, id: string, accept = true) {
  p.once('dialog', (d) => (accept ? d.accept() : d.dismiss()))
  await model(p).selectOption(id)
  await settle(p)
}
async function save(p: Page, path: string) {
  const event = p.waitForEvent('download')
  await fileAction(p, 'Download project file')
  await (await event).saveAs(path)
  return JSON.parse(readFileSync(path, 'utf8'))
}
for (const [id, count, min, max] of [['bass-4-inline', 4, 42, 44.5]] as const) {
  test(id + ' confirmation, edits, nut bounds, history and v10 reopen', async ({ page }, info) => {
    test.setTimeout(90000)
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    await page.goto('/')
    await openLap(page)
    const original = await lap(page).getAttribute('d')
    await select(page, id, false)
    await expect(model(page)).toHaveValue('inline')
    await expect(lap(page)).toHaveAttribute('d', original!)
    await select(page, id)
    await expect(model(page)).toHaveValue(id)
    await expect(page.locator('.large .tuner-hole')).toHaveCount(count)
    await expect(page.getByLabel('Bass tuner row')).toContainText('°')
    const locked = page.locator('.large [data-headstock-node-id="' + id + '-tuner-start"]')
    await locked.focus()
    await locked.press('Enter')
    await expect(field(page, 'Node X')).toBeDisabled()
    const segment = page.locator('.large [data-headstock-segment-id="' + id + '-tuner-end"]')
    await segment.focus()
    await segment.press('Enter')
    await page.getByRole('button', { name: 'Add point', exact: true }).click()
    await expect(page.locator('.large [data-headstock-node-id]')).toHaveCount(9)
    await page.getByRole('button', { name: 'Delete point', exact: true }).click()
    await expect(page.locator('.large [data-headstock-node-id]')).toHaveCount(8)
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await expect(page.locator('.large [data-headstock-node-id]')).toHaveCount(9)
    await page.getByRole('button', { name: 'Redo', exact: true }).click()
    await expect(page.locator('.large [data-headstock-node-id]')).toHaveCount(8)
    await page.getByRole('button', { name: 'Fit to view', exact: true }).click()
    const neck = page.locator('.large .neck-outline')
    await neck.focus()
    await neck.press('Enter')
    await expect(field(page, 'Nut width')).toHaveValue(String(max))
    await expect(field(page, 'Strings')).toBeDisabled()
    await page.getByRole('tab', { name: 'Fit', exact: true }).click()
    await field(page, 'Corner radius').fill('5')
    await expect(page.getByRole('button', { name: 'Accept', exact: true })).toBeEnabled()
    await page.getByRole('tab', { name: 'Basic dimensions', exact: true }).click()
    await page.getByRole('button', { name: 'in', exact: true }).click()
    await page.getByRole('button', { name: 'mm', exact: true }).click()
    await field(page, 'Nut width').fill(String(min - 0.1))
    await expect(page.getByRole('button', { name: 'Accept', exact: true })).toBeDisabled()
    await field(page, 'Nut width').fill(String(min))
    await expect(page.getByRole('button', { name: 'Accept', exact: true })).toBeEnabled()
    await field(page, 'Nut width').fill(String(max + 0.1))
    await expect(page.getByRole('button', { name: 'Accept', exact: true })).toBeDisabled()
    await field(page, 'Nut width').fill(String(max))
    await page.getByRole('button', { name: 'Accept', exact: true }).click()
    const saved = await save(page, info.outputPath(id + '.gtrfactory'))
    expect(saved.version).toBe(11)
    expect(saved.neck.params.strings).toBe(count)
    expect(saved.neck.end.radiusMm).toBeCloseTo(5, 9)
    await page.getByTestId('project-file').setInputFiles(info.outputPath(id + '.gtrfactory'))
    await openLap(page)
    await expect(model(page)).toHaveValue(id)

    await select(page, 'three-three-2', false)
    await expect(model(page)).toHaveValue(id)
    await select(page, 'three-three-2')
    await expect(model(page)).toHaveValue('three-three-2')
    const guitar = await save(page, info.outputPath('returned.gtrfactory'))
    expect(guitar.neck.params).toMatchObject({ strings: 6, frets: 22, scaleTreble: 647.7 })
    expect(guitar.neck.physicalProfile).toBeNull()
    expect(guitar.neck.end.radiusMm).toBe(6)
    expect(errors).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
  test(id + ' downloads actual SVG DXF PDF with GB2 bores', async ({ page }, info) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')
    await openLap(page)
    await select(page, id)
    const folder = 'tmp/remove-bass5/artifacts/' + info.project.name
    mkdirSync(folder, { recursive: true })
    await page.screenshot({ path: folder + '/' + id + '-editor.png', fullPage: true })
    await fileAction(page, 'Export / print')
    const modal = page.getByRole('dialog', { name: 'Export / print' })
    await modal.getByLabel('Body - front', { exact: true }).uncheck()
    await modal.getByLabel('Headstock', { exact: true }).check()
    for (const format of ['SVG', 'DXF', 'PDF']) {
      await modal.getByRole('button', { name: format, exact: true }).click()
      const event = page.waitForEvent('download')
      await modal.getByRole('button', { name: 'Save ' + format, exact: true }).click()
      await (await event).saveAs(folder + '/' + id + '.' + format.toLowerCase())
    }
    await page.screenshot({ path: folder + '/' + id + '-export.png', fullPage: true })
    expect(errors).toEqual([])
  })
}

test('opens a passive legacy bass-5 key by dropping it and atomically rejects an active legacy bass-5', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await openLap(page)
  await select(page, 'bass-4-inline')
  const saved = await save(page, info.outputPath('bass4-before-legacy.gtrfactory'))
  const passive = structuredClone(saved)
  passive.neck.headstock.variants['bass-5-inline'] = structuredClone(
    passive.neck.headstock.variants['bass-4-inline'],
  )
  await page.getByTestId('project-file').setInputFiles({
    name: 'passive-legacy.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(passive)),
  })
  await openLap(page)
  await expect(model(page)).toHaveValue('bass-4-inline')
  const cleaned = await save(page, info.outputPath('bass4-cleaned.gtrfactory'))
  expect(cleaned.neck.headstock.variants).not.toHaveProperty('bass-5-inline')
  const before = await lap(page).getAttribute('d')
  const active = structuredClone(passive)
  active.neck.headstock.activeTemplateId = 'bass-5-inline'
  await page.getByTestId('project-file').setInputFiles({
    name: 'active-legacy.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(active)),
  })
  await expect(
    page.getByRole('status').filter({ hasText: 'Five-string bass headstocks' }),
  ).toBeVisible()
  await expect(model(page)).toHaveValue('bass-4-inline')
  await expect(lap(page)).toHaveAttribute('d', before!)
  expect(errors).toEqual([])
})
