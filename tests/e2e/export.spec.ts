import { test, expect } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
test('export modal selects isolated parts, units and downloads real SVG DXF PDF', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.getByText('File', { exact: true }).click()
  await page.getByRole('button', { name: 'Export / print', exact: true }).click()
  const modal = page.getByRole('dialog', { name: 'Export / print' })
  await expect(modal).toBeVisible()
  await modal.getByRole('button', { name: 'SVG', exact: true }).click()
  await modal.getByLabel('Body - front', { exact: true }).uncheck()
  await modal.getByLabel('Headstock', { exact: true }).check()
  await expect(modal.locator('.export-preview svg')).toBeVisible()
  const folder = 'tmp/export-v1/downloads/' + info.project.name
  mkdirSync(folder, { recursive: true })
  const save = async (format: string) => {
    const event = page.waitForEvent('download')
    await modal.getByRole('button', { name: 'Save ' + format, exact: true }).click()
    const download = await event
    const path = folder + '/headstock.' + format.toLowerCase()
    await download.saveAs(path)
    return readFileSync(path)
  }
  const svg = (await save('SVG')).toString()
  expect(svg).toContain('width=')
  expect(svg.match(/<circle /g)).toHaveLength(6)
  expect(svg).not.toContain('FRET_GUIDE')
  await modal.getByRole('button', { name: 'DXF', exact: true }).click()
  const dxf = (await save('DXF')).toString()
  expect(dxf).toContain('AC1027')
  expect(dxf).toContain('DRILL_TUNER')
  await modal.getByRole('button', { name: 'PDF', exact: true }).click()
  await modal.getByLabel('Dimension unit').selectOption('both')
  const pdf = await PDFDocument.load(await save('PDF'))
  expect(pdf.getPageCount()).toBe(1)
  await modal.getByLabel('Paper').selectOption('a4')
  await expect(modal.getByTestId('export-size')).toContainText('pages')
  await page.screenshot({ path: folder + '/modal.png', fullPage: true })
  const overflow = await modal.evaluate((el) => el.scrollWidth > el.clientWidth + 1)
  expect(overflow).toBe(false)
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(modal).not.toBeVisible()
  expect(errors).toEqual([])
})
test('empty selection is blocked and reopening keeps export choices', async ({ page }) => {
  await page.goto('/')
  await page.getByText('File', { exact: true }).click()
  await page.getByRole('button', { name: 'Export / print', exact: true }).click()
  const modal = page.getByRole('dialog', { name: 'Export / print' })
  await modal.getByLabel('Body - front', { exact: true }).uncheck()
  await expect(modal.getByRole('alert')).toContainText('Select at least')
  await expect(modal.getByRole('button', { name: 'Save PDF', exact: true })).toBeDisabled()
  await modal.getByLabel('Fretboard', { exact: true }).check()
  await modal.getByLabel('Dimension unit').selectOption('in')
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByText('File', { exact: true }).click()
  await page.getByRole('button', { name: 'Export / print', exact: true }).click()
  await expect(modal.getByLabel('Fretboard', { exact: true })).toBeChecked()
  await expect(modal.getByLabel('Dimension unit')).toHaveValue('in')
})

test('centerline checkbox is separate from other reference lines', async ({ page }) => {
  await page.goto('/')
  await page.getByText('File', { exact: true }).click()
  await page.getByRole('button', { name: 'Export / print', exact: true }).click()
  const modal = page.getByRole('dialog', { name: 'Export / print' }),
    center = modal.getByLabel('Centerlines', { exact: true })
  await modal.getByLabel('Neck (including headstock)', { exact: true }).check()
  await modal.getByLabel('Fretboard', { exact: true }).check()
  await expect(modal.locator('[data-role="REFERENCE_CENTERLINE"] path')).toHaveCount(3)
  await expect(modal.locator('[data-role="REFERENCE_CENTERLINE"] path').first()).toHaveAttribute(
    'stroke-dasharray',
    '6 3',
  )
  await center.uncheck()
  await expect(modal.locator('[data-role="REFERENCE_CENTERLINE"]')).toHaveCount(0)
  await expect(modal.getByLabel('Nut/bridge references')).toBeChecked()
  await center.check()
  await expect(modal.locator('[data-role="REFERENCE_CENTERLINE"] path')).toHaveCount(3)
})

test('neck pocket preview uses the canonical body template with an open pocket notch', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByText('File', { exact: true }).click()
  await page.getByRole('button', { name: 'Export / print', exact: true }).click()
  const modal = page.getByRole('dialog', { name: 'Export / print' })
  await modal.getByLabel('Body - front', { exact: true }).uncheck()
  await modal.getByLabel('Neck pocket', { exact: true }).check()
  await modal.getByLabel('Nut/bridge references').check()
  await expect(modal.locator('[data-role="CUT_OUTER"]')).toHaveCount(1)
  await expect(modal.locator('[data-role="ROUTE_NECK_POCKET"]')).toHaveCount(0)
  await modal.getByLabel('Part names').uncheck()
  await modal.getByLabel('100 mm calibration check').uncheck()
  await expect(modal.locator('[data-role="REFERENCE"]')).toHaveCount(0)
})
