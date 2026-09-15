import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { DEFAULT_NECK } from '../../src/neck/fretfactoryGeometry'
import { useAppStore } from '../../src/store'
import { fileAction, openNeckDock, settle } from './uiHelpers'

const field = (page: Page, name: string) => page.getByRole('textbox', { name, exact: true })
const notice = (page: Page) =>
  page.locator('.field-hint').filter({ hasText: 'Legacy-project length offset' })
function legacyDocument() {
  useAppStore.getState().newProject()
  const empty = structuredClone(useAppStore.getState().document)
  empty.name = 'Legacy anchor fixture'
  empty.pickupCavities = []
  useAppStore.getState().replace(empty)
  useAppStore.getState().configureNeckPlacement({ joinFret: 12, offsetMm: 8.5 })
  expect(useAppStore.getState().message).toBeNull()
  return structuredClone(useAppStore.getState().document)
}
async function download(page: Page, path: string) {
  const pending = page.waitForEvent('download')
  await fileAction(page, 'Download project file')
  await (await pending).saveAs(path)
  return JSON.parse(await readFile(path, 'utf8'))
}
const load = async (page: Page, data: unknown) => {
  await page.getByTestId('project-file').setInputFiles({
    name: 'legacy-anchor.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  })
  await expect(page.locator('.notice')).toContainText('Project file opened.')
  await settle(page)
}
test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  ;(page as any).__errors = errors
  await page.goto('/')
  await settle(page)
})
test.afterEach(async ({ page }) => {
  expect((page as any).__errors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('legacy offset survives reopening and clean acceptance; explicit alignment and undo are exact', async ({
  page,
}, info) => {
  const legacy = legacyDocument()
  await load(page, legacy)
  expect(await download(page, info.outputPath('legacy-roundtrip.gtrfactory'))).toEqual(legacy)
  await openNeckDock(page)
  await expect(field(page, 'Fret at center node')).toHaveValue('12')
  await expect(field(page, 'Length offset')).toHaveCount(0)
  await expect(notice(page)).toContainText('8.5 mm')
  await page.getByRole('button', { name: 'in', exact: true }).click()
  await expect(notice(page)).toContainText('0.334646 in')
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
  expect(await download(page, info.outputPath('clean-acceptance.gtrfactory'))).toEqual(legacy)
  await page.getByRole('button', { name: 'mm', exact: true }).click()
  await openNeckDock(page)
  await page.getByRole('button', { name: 'Align fret to center node', exact: true }).click()
  await expect(notice(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  const aligned = await download(page, info.outputPath('aligned.gtrfactory'))
  expect(aligned.neck.placement).toEqual({ joinFret: 12, offsetMm: 0 })
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  expect(await download(page, info.outputPath('alignment-undone.gtrfactory'))).toEqual(legacy)
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
})

test('URL import retains edited anchor and end settings and rejects a shorter fret count without clamping', async ({
  page,
}, info) => {
  const legacy = legacyDocument()
  await load(page, legacy)
  await openNeckDock(page)
  await field(page, 'Fret at center node').fill('16')
  await expect(notice(page)).toHaveCount(0)
  await page.getByRole('tab', { name: 'Fit', exact: true }).click()
  await field(page, 'Neck end allowance').fill('12.75')
  await field(page, 'Fretboard end allowance').fill('19.1')
  await field(page, 'Corner radius').fill('7.25')
  await page.getByRole('tab', { name: 'Import', exact: true }).click()
  const imported = { ...DEFAULT_NECK, strings: 8, scaleBass: 660.412345678 }
  await field(page, 'FretFactory-URL').fill(
    '#state=' + encodeURIComponent(JSON.stringify({ ...imported, frets: 12 })),
  )
  await page.getByRole('button', { name: 'Import FretFactory design', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Accept', exact: true })).toBeDisabled()
  await field(page, 'FretFactory-URL').fill(
    '#state=' + encodeURIComponent(JSON.stringify(imported)),
  )
  await page.getByRole('button', { name: 'Import FretFactory design', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Accept', exact: true })).toBeEnabled()
  await page.getByRole('tab', { name: 'Basic dimensions', exact: true }).click()
  await expect(field(page, 'Fret at center node')).toHaveValue('16')
  await expect(field(page, 'Strings')).toHaveValue('8')
  await page.getByRole('tab', { name: 'Fit', exact: true }).click()
  await expect(field(page, 'Neck end allowance')).toHaveValue('12.75')
  await expect(field(page, 'Fretboard end allowance')).toHaveValue('19.1')
  await expect(field(page, 'Corner radius')).toHaveValue('7.25')
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  const saved = await download(page, info.outputPath('imported-anchor.gtrfactory'))
  expect(saved.neck.placement).toEqual({ joinFret: 16, offsetMm: 0 })
  expect(saved.neck.end).toMatchObject({
    endMarginMm: 12.75,
    fretboardEndMarginMm: 19.1,
    radiusMm: 7.25,
  })
  expect(saved.neck.params).toEqual(imported)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  expect(await download(page, info.outputPath('import-undone.gtrfactory'))).toEqual(legacy)
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
})
