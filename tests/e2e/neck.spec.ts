import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { DEFAULT_NECK } from '../../src/neck/fretfactoryGeometry'
import { createStarterDocument } from '../../src/model/project'
import { useAppStore } from '../../src/store'
import { activateView, fileAction, openNeckDock, settle } from './uiHelpers'
const field = (page: Page, name: string) => page.getByRole('textbox', { name, exact: true })
const neck = (page: Page) => page.locator('[data-view="front"] .neck-outline')
async function download(page: Page, path: string) {
  const pending = page.waitForEvent('download')
  await fileAction(page, 'Download project file')
  await (await pending).saveAs(path)
  return JSON.parse(await readFile(path, 'utf8'))
}
const load = (page: Page, data: unknown) =>
  page.getByTestId('project-file').setInputFiles({
    name: 'neck-test.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  })
test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  ;(page as any).__errors = errors
  await page.goto('/')
  await expect(neck(page)).toBeVisible()
  await settle(page)
})
test.afterEach(async ({ page }) => {
  expect((page as any).__errors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('default neck and direct keyboard selection share three labelled views', async ({
  page,
}, info) => {
  await expect(page.locator('.canvas-card')).toHaveCount(3)
  await expect(
    page.getByRole('button', {
      name: /^(Body|Neck|Front|Back|Pocket|Neck pocket|Hide controls|[123] (Front|Back|Neck pocket))$/,
    }),
  ).toHaveCount(0)
  await expect(page.locator('button.canvas-title')).toHaveCount(0)
  await expect(page.locator('.large [data-fret]')).toHaveCount(0)
  const inside = await neck(page).evaluate((el) => {
    const p = el as SVGPathElement,
      m = p.getScreenCTM()!,
      r = p.ownerSVGElement!.getBoundingClientRect()
    return Array.from({ length: 101 }, (_, i) => {
      const q = p.getPointAtLength((p.getTotalLength() * i) / 100)
      return new DOMPoint(q.x, q.y).matrixTransform(m)
    }).every((q) => q.x >= r.left + 40 && q.y >= r.top + 40 && q.x <= r.right && q.y <= r.bottom)
  })
  expect(inside).toBe(true)
  await neck(page).focus()
  await neck(page).press('Enter')
  await expect(field(page, 'Frets')).toHaveValue('22')
  await expect(field(page, 'Treble scale length')).toHaveValue('647.7')
  await page.getByRole('tab', { name: 'Fit', exact: true }).click()
  await expect(field(page, 'Neck end allowance')).toHaveValue('10')
  await expect(field(page, 'Fretboard end allowance')).toHaveValue('16.35')
  await expect(page.locator('.large .neck-heel')).toBeVisible()
  await page.getByRole('tab', { name: 'Basic dimensions', exact: true }).click()
  await expect(page.locator('.large .neck-guide-fret')).toHaveCount(22)
  await expect(page.locator('.large .neck-guide-string')).toHaveCount(6)
  await field(page, 'Frets').press('Escape')
  await expect(page.locator('.neck-dock')).toHaveCount(0)
  const mini = page.locator('.small[data-view="back"]')
  await mini.focus()
  await mini.press('Space')
  await expect(page.locator('.large .canvas-card')).toHaveAttribute('data-view', 'back')
  await expect(
    page.locator('.large .neck-outline,.large .nut-line,.large .bridge-line'),
  ).toHaveCount(0)
  await page.locator('.small[data-view="pocket"]').focus()
  await page.keyboard.press('Enter')
  await settle(page)
  expect((await page.locator('.large .body-path').getAttribute('d'))!.match(/ A /g)).toHaveLength(2)
  const saved = await download(page, info.outputPath('default.gtrfactory'))
  expect(saved.version).toBe(13)
  expect(saved.neck.params).toMatchObject({
    frets: 22,
    strings: 6,
    scaleTreble: 647.7,
    scaleBass: 647.7,
  })
})

test('live draft, invalid fields, unit and view switches are atomic with a stable camera', async ({
  page,
}, info) => {
  const original = await neck(page).getAttribute('d')
  await openNeckDock(page)
  const world = page.locator('.large [data-transform="world"]'),
    camera = await world.getAttribute('transform')
  const pocketBefore = await page.locator('[data-view="pocket"] .body-path').getAttribute('d')
  await field(page, 'Bass scale length').fill('660,4')
  await expect(neck(page)).not.toHaveAttribute('d', original!)
  await expect(page.getByTestId('save-state')).toHaveText('Saved')
  expect(await world.getAttribute('transform')).toBe(camera)
  expect(await page.locator('[data-view="pocket"] .body-path').getAttribute('d')).not.toBe(
    pocketBefore,
  )
  expect(await page.locator('[data-view="front"] .body-path').getAttribute('d')).toBe(
    await page.locator('[data-view="back"] .body-path').getAttribute('d'),
  )
  const valid = await neck(page).getAttribute('d')
  await page.getByRole('tab', { name: 'Fit', exact: true }).click()
  await field(page, 'Corner radius').fill('1000')
  await expect(page.locator('.field-error')).toContainText('exceeds')
  await expect(neck(page)).toHaveAttribute('d', valid!)
  await expect(page.getByRole('button', { name: 'Accept', exact: true })).toBeDisabled()
  await field(page, 'Corner radius').fill('')
  await expect(page.locator('.field-error')).toContainText('must be a number')
  await activateView(page, 'pocket')
  await expect(field(page, 'Corner radius')).toHaveValue('')
  await expect(page.locator('.neck-dock')).toBeVisible()
  await field(page, 'Corner radius').fill('6')
  await page.getByRole('tab', { name: 'Basic dimensions', exact: true }).click()
  await page.getByRole('button', { name: 'in', exact: true }).click()
  await expect
    .poll(async () => Number(await field(page, 'Bass scale length').inputValue()) * 25.4)
    .toBeCloseTo(660.4, 7)
  await page.getByRole('button', { name: 'mm', exact: true }).click()
  await activateView(page, 'front')
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  await expect(page.locator('.neck-dock')).toHaveCount(0)
  await expect(page.getByTestId('save-state')).toHaveText('Modified')
  await expect(neck(page)).toHaveAttribute('d', valid!)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(neck(page)).toHaveAttribute('d', original!)
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(neck(page)).toHaveAttribute('d', valid!)
  await page.screenshot({ path: info.outputPath('unified-front.png'), fullPage: true })
})

test('clean context selection closes without dragging; pending input blocks body edits and cancels exactly', async ({
  page,
}, info) => {
  const before = await page.locator('.large .body-path').getAttribute('d'),
    height = (await page.locator('.large').boundingBox())!.height
  await openNeckDock(page)
  if (info.project.name === 'desktop-edge')
    expect(height - (await page.locator('.large').boundingBox())!.height).toBeGreaterThan(80)
  await page.locator('.large .editor-svg').click({ position: { x: 50, y: 50 } })
  await expect(page.locator('.neck-dock')).toHaveCount(0)
  await expect(page.locator('.large .body-path')).toHaveAttribute('d', before!)
  await openNeckDock(page)
  await field(page, 'Bass scale length').fill('660.4')
  const preview = await page.locator('.large .body-path').getAttribute('d')
  await page.locator('.large [data-node-id="starter-03"]').click()
  await expect(page.locator('.neck-dock')).toBeVisible()
  await expect(page.locator('.notice')).toContainText('Accept or cancel')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.large .body-path')).toHaveAttribute('d', preview!)
  await page.keyboard.press('Escape')
  await expect(page.locator('.neck-dock')).toHaveCount(0)
  await expect(page.locator('.large .body-path')).toHaveAttribute('d', before!)
  await openNeckDock(page)
  await page.getByRole('button', { name: 'in', exact: true }).click()
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
})

test('FretFactory import previews precise values and rejects incomplete input', async ({
  page,
}, info) => {
  await openNeckDock(page)
  await page.getByRole('tab', { name: 'Import', exact: true }).click()
  const params = {
    ...DEFAULT_NECK,
    scaleBass: 660.412345678,
    anchorFret: 0,
    curvedExponent: 1.6,
    units: 'inch',
  }
  await field(page, 'FretFactory-URL').fill('#state=' + encodeURIComponent(JSON.stringify(params)))
  await page.getByRole('button', { name: 'Import FretFactory design', exact: true }).click()
  const valid = await neck(page).getAttribute('d')
  await field(page, 'FretFactory-URL').fill(
    '#state=' + encodeURIComponent(JSON.stringify({ frets: 22 })),
  )
  await page.getByRole('button', { name: 'Import FretFactory design', exact: true }).click()
  await expect(page.locator('.field-error')).toContainText('missing')
  await expect(neck(page)).toHaveAttribute('d', valid!)
  await field(page, 'FretFactory-URL').fill('#state=' + encodeURIComponent(JSON.stringify(params)))
  await page.getByRole('button', { name: 'Import FretFactory design', exact: true }).click()
  await page.getByRole('tab', { name: 'Advanced settings', exact: true }).click()
  await expect(field(page, 'Straight-fret number')).toHaveValue('0')
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  const saved = await download(page, info.outputPath('imported.gtrfactory'))
  expect(saved.neck.params.scaleBass).toBe(params.scaleBass)
  await fileAction(page, 'New')
  await load(page, saved)
  await expect(neck(page)).toHaveAttribute('d', valid!)
})

test('pending draft blocks saving and new-project cancellation retains invalid fields', async ({
  page,
}) => {
  await openNeckDock(page)
  await field(page, 'Bass scale length').fill('')
  const downloads: string[] = []
  page.on('download', (d) => downloads.push(d.suggestedFilename()))
  await fileAction(page, 'Download project file')
  await expect(page.locator('.notice')).toContainText('before saving')
  expect(downloads).toEqual([])
  await fileAction(page, 'New')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(field(page, 'Bass scale length')).toHaveValue('')
  await fileAction(page, 'New')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.locator('.neck-dock')).toHaveCount(0)
  await expect(page.locator('.field-error')).toHaveCount(0)
  await openNeckDock(page)
  await expect(field(page, 'Bass scale length')).toHaveValue('647.7')
  await expect(field(page, 'Frets')).toHaveValue('22')
})

test('a delayed file read cannot replace a newer neck draft', async ({ page }) => {
  const incoming = createStarterDocument()
  incoming.name = 'Vanha luku'
  await page.evaluate(() => {
    const original = File.prototype.text
    File.prototype.text = function () {
      return original.call(this).then(
        (text) =>
          new Promise<string>((resolve) => {
            ;(window as any).__finishRead = () => resolve(text)
          }),
      )
    }
  })
  await load(page, incoming)
  await expect.poll(() => page.evaluate(() => typeof (window as any).__finishRead)).toBe('function')
  await openNeckDock(page)
  await field(page, 'Bass scale length').fill('660.4')
  const path = await neck(page).getAttribute('d')
  await page.evaluate(() => (window as any).__finishRead())
  await expect(page.locator('.notice')).toContainText('open operation was not used')
  await expect(neck(page)).toHaveAttribute('d', path!)
  await expect(field(page, 'Bass scale length')).toHaveValue('660.4')
})

test('legacy task stays intact until the visible neck template is accepted once', async ({
  page,
}, info) => {
  useAppStore.getState().replace(createStarterDocument())
  const legacy: any = structuredClone(useAppStore.getState().document)
  legacy.neck = null
  legacy.body.neckPocket = null
  await load(page, legacy)
  await expect(page.locator('.large .neck-template')).toBeVisible()
  const body = await page.locator('.large .body-path').getAttribute('d')
  const saved = await download(page, info.outputPath('legacy-untouched.gtrfactory'))
  expect(saved.neck).toBeNull()
  expect(saved.body).toEqual(legacy.body)
  await openNeckDock(page)
  await page.getByRole('button', { name: 'Cancel changes', exact: true }).click()
  await expect(page.locator('.large .body-path')).toHaveAttribute('d', body!)
  await openNeckDock(page)
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  await expect(page.locator('.neck-template')).toHaveCount(0)
  const accepted = await download(page, info.outputPath('legacy-accepted.gtrfactory'))
  expect(accepted.neck.params.frets).toBe(22)
  expect(accepted.body.neckPocket).toBeNull()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.locator('.large .neck-template')).toBeVisible()
  await expect(page.locator('.large .body-path')).toHaveAttribute('d', body!)
})

test('a neckless document without a joint opens without guessed geometry', async ({
  page,
}, info) => {
  const legacy: any = createStarterDocument()
  legacy.body.neckJointBoundary = null
  await load(page, legacy)
  await expect(page.locator('.neck-outline')).toHaveCount(0)
  await expect(
    page.getByText('The neck cannot be placed without a recognised neck joint.'),
  ).toBeVisible()
  const saved = await download(page, info.outputPath('no-joint.gtrfactory'))
  expect(saved.body).toEqual(legacy.body)
  expect(saved.neck).toBeNull()
})
