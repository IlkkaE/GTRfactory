import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { activateView, fileAction, openNeckDock, settle } from './uiHelpers'
import { useAppStore } from '../../src/store'
import { buildExportDrawing } from '../../src/export/geometry'
import { DEFAULT_EXPORT_OPTIONS, PART_NAMES, type ExportPart } from '../../src/export/model'

function fixture(name: string, bass = false) {
  const s = useAppStore.getState()
  s.newProject()
  if (bass) {
    s.setView('front')
    s.setEditingTarget('headstock')
    s.switchHeadstockTemplate('bass-4-inline')
    expect(useAppStore.getState().message).toBeNull()
  }
  const doc = structuredClone(useAppStore.getState().document)
  doc.name = name
  return doc
}
async function load(page: Page, doc: ReturnType<typeof fixture>) {
  await page.getByTestId('project-file').setInputFiles({
    name: 'handedness.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(doc)),
  })
  await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue(
    doc.name,
  )
  await settle(page)
}
async function save(page: Page, path: string) {
  const pending = page.waitForEvent('download')
  await fileAction(page, 'Download project file')
  await (await pending).saveAs(path)
  return JSON.parse(readFileSync(path, 'utf8')) as ReturnType<typeof fixture>
}
async function center(el: Locator) {
  const b = await el.boundingBox()
  expect(b).not.toBeNull()
  return { x: b!.x + b!.width / 2, y: b!.y + b!.height / 2 }
}

test('one handedness toggle mirrors all editor views, saves v11 and exports left geometry', async ({
  page,
}, info) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  const folder = 'tmp/neck-direction/artifacts/' + info.project.name
  mkdirSync(folder, { recursive: true })
  await page.goto('/')
  const initial = fixture('Handedness interaction')
  await load(page, initial)
  const toggle = page.getByRole('button', { name: 'Handedness', exact: true })
  await expect(toggle).toHaveCount(1)
  for (const view of ['front', 'back', 'pocket'] as const) {
    await activateView(page, view)
    const group = page.locator('.large [data-transform="world"]')
    const right = (await group.getAttribute('transform'))!
      .match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/g)!
      .map(Number)
    const landmarks =
      view === 'front'
        ? await Promise.all(
            ['.neck-outline', '.nut-line', '.headstock-outline'].map(async (selector) => {
              const point = await center(page.locator('.large ' + selector))
              return point.x
            }),
          )
        : []
    await toggle.click()
    await expect(toggle).toHaveText('Left-handed')
    const left = (await group.getAttribute('transform'))!
      .match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/g)!
      .map(Number)
    expect(left[1]).toBeCloseTo(right[1], 8)
    expect(left[2]).toBeCloseTo(-right[2], 8)
    if (view === 'front') {
      const leftLandmarks = await Promise.all(
        ['.neck-outline', '.nut-line', '.headstock-outline'].map(async (selector) => {
          const point = await center(page.locator('.large ' + selector))
          return point.x
        }),
      )
      for (let i = 0; i < landmarks.length; i++) expect(leftLandmarks[i]).toBeLessThan(landmarks[i])
    }
    await toggle.click()
    await expect(toggle).toHaveText('Right-handed')
  }
  await activateView(page, 'front')
  await toggle.click()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(toggle).toHaveText('Right-handed')
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(toggle).toHaveText('Left-handed')
  const canonical = await save(page, folder + '/left.gtrfactory')
  expect(canonical).toEqual({ ...initial, handedness: 'left' })
  const node = page.locator('.large [data-node-id="starter-04"]')
  await node.focus()
  await node.press('Enter')
  await node.press('ArrowDown')
  await settle(page)
  const moved = await save(page, folder + '/left-node.gtrfactory')
  expect(moved.body.outline.nodes.find((n) => n.id === 'starter-04')!.x).toBeCloseTo(
    initial.body.outline.nodes.find((n) => n.id === 'starter-04')!.x + 1,
    7,
  )
  await page.keyboard.press('Control+z')
  await settle(page)
  const nodeLeft = await center(node)
  await node.press('ArrowRight')
  await settle(page)
  expect((await center(node)).x).toBeGreaterThan(nodeLeft.x)
  await page.keyboard.press('Control+z')
  await settle(page)
  const a = await center(node)
  await page.mouse.move(a.x, a.y)
  await page.mouse.down()
  await page.mouse.move(a.x, a.y + 4, { steps: 3 })
  await page.mouse.up()
  await settle(page)
  const b = await center(node)
  expect(b.y).toBeGreaterThan(a.y + 2)
  await page.keyboard.press('Control+z')
  await settle(page)
  const head = page.locator('.large .headstock-outline')
  await head.focus()
  await head.press('Enter')
  const tip = page.locator('.large [data-headstock-node-id="headstock-free-6"]')
  await tip.focus()
  await tip.press('Enter')
  const tipBefore = await center(tip)
  await tip.press('ArrowDown')
  await settle(page)
  expect((await center(tip)).y).toBeGreaterThan(tipBefore.y)
  await page.keyboard.press('Control+z')
  await settle(page)
  const tipLeft = await center(tip)
  await tip.press('ArrowRight')
  await settle(page)
  expect((await center(tip)).x).toBeGreaterThan(tipLeft.x)
  await page.keyboard.press('Control+z')
  await page.getByRole('button', { name: 'Fit to view', exact: true }).click()
  const pickup = page.locator('.large .pickup-cavity').first()
  await pickup.focus()
  await pickup.press('Enter')
  const pickupBefore = await center(pickup)
  await pickup.press('ArrowRight')
  await settle(page)
  expect((await center(pickup)).x).toBeGreaterThan(pickupBefore.x)
  await page.keyboard.press('Control+z')
  await settle(page)
  await activateView(page, 'back')
  const cavity = page.locator('.large path.electronics-cavity.outer')
  await cavity.focus()
  await cavity.press('Enter')
  const cavityBefore = await center(cavity)
  await cavity.press('ArrowDown')
  await settle(page)
  expect((await center(cavity)).y).toBeGreaterThan(cavityBefore.y)
  await page.keyboard.press('Control+z')
  await settle(page)
  const cavityLeft = await center(cavity)
  await cavity.press('ArrowRight')
  await settle(page)
  expect((await center(cavity)).x).toBeGreaterThan(cavityLeft.x)
  await page.keyboard.press('Control+z')
  await settle(page)
  for (const side of ['left', 'right', 'top', 'bottom'] as const) {
    const handle = page.locator(`.large [data-electronics-cavity-handle="${side}"]`)
    await handle.focus()
    const handleBefore = await center(handle)
    const cavityCenter = await center(cavity)
    const key =
      Math.abs(handleBefore.x - cavityCenter.x) > Math.abs(handleBefore.y - cavityCenter.y)
        ? handleBefore.x > cavityCenter.x
          ? 'ArrowRight'
          : 'ArrowLeft'
        : handleBefore.y > cavityCenter.y
          ? 'ArrowDown'
          : 'ArrowUp'
    const before = await save(page, folder + `/left-cavity-${side}-before.gtrfactory`)
    await handle.press(key)
    await settle(page)
    const after = await save(page, folder + `/left-cavity-${side}.gtrfactory`)
    const beforeCavity = before.body.rearElectronicsCavity!
    const afterCavity = after.body.rearElectronicsCavity!
    if (side === 'left' || side === 'right')
      expect(afterCavity.horizontalMm).toBeCloseTo(beforeCavity.horizontalMm + 1, 7)
    else expect(afterCavity.verticalMm).toBeCloseTo(beforeCavity.verticalMm + 1, 7)
    await page.keyboard.press('Control+z')
    await settle(page)
  }
  await settle(page)
  await openNeckDock(page)
  await expect(toggle).toBeDisabled()
  await page
    .locator('.neck-dock')
    .getByRole('button', { name: 'Cancel changes', exact: true })
    .click()
  await expect(toggle).toBeEnabled()
  await page.screenshot({ path: folder + '/left-editor.png', fullPage: true })
  await page.reload()
  await expect(toggle).toHaveText('Right-handed')
  await page.getByTestId('project-file').setInputFiles(folder + '/left.gtrfactory')
  await expect(toggle).toHaveText('Left-handed')
  const invalid = { ...canonical, version: 10 }
  await page.getByTestId('project-file').setInputFiles({
    name: 'invalid-left.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(invalid)),
  })
  await expect(page.getByRole('status')).toContainText('cannot declare left-handedness')
  await expect(toggle).toHaveText('Left-handed')
  const final = await save(page, folder + '/left-after-rejection.gtrfactory')
  expect(final).toEqual(canonical)
  expect(errors).toEqual([])
})

test('downloads right and left complete drawings and a left bass headstock in SVG DXF PDF', async ({
  page,
}, info) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  const folder = 'tmp/neck-direction/artifacts/' + info.project.name
  mkdirSync(folder, { recursive: true })
  const all: ExportPart[] = [
    'front',
    'back',
    'pocket',
    'headstock',
    'neck',
    'fretboard',
    'overview',
  ]
  for (const stem of ['right-all', 'left-all', 'left-bass'] as const) {
    await page.goto('/')
    const doc = fixture(stem, stem === 'left-bass')
    doc.handedness = stem === 'right-all' ? 'right' : 'left'
    const parts: ExportPart[] = stem === 'left-bass' ? ['headstock'] : all
    await load(page, doc)
    await page.screenshot({ path: folder + '/' + stem + '-editor.png', fullPage: true })
    await fileAction(page, 'Export / print')
    const modal = page.getByRole('dialog', { name: 'Export / print', exact: true })
    await expect(modal).toContainText(
      doc.handedness === 'left' ? 'Left-handed export' : 'Right-handed export',
    )
    for (const id of all)
      await modal.getByLabel(PART_NAMES[id], { exact: true }).setChecked(parts.includes(id))
    await modal.getByLabel('Dimension table', { exact: true }).check()
    await modal.getByLabel('Dimension unit').selectOption('mm')
    const options = { ...DEFAULT_EXPORT_OPTIONS, parts }
    writeFileSync(
      folder + '/' + stem + '.drawing.json',
      JSON.stringify(buildExportDrawing(doc, options), null, 2),
    )
    writeFileSync(folder + '/' + stem + '.gtrfactory', JSON.stringify(doc, null, 2))
    for (const format of ['SVG', 'DXF', 'PDF']) {
      await modal.getByRole('button', { name: format, exact: true }).click()
      for (const label of [
        'Centerlines',
        'Nut/bridge references',
        'Fret lines on the fretboard',
        'Part names',
        '100 mm calibration check',
        'Dimension table',
      ])
        await modal.getByLabel(label, { exact: true }).check()
      await modal.getByLabel('Dimension unit').selectOption('mm')
      if (format === 'PDF') await modal.getByLabel('Paper').selectOption('custom')
      const pending = page.waitForEvent('download')
      await modal.getByRole('button', { name: 'Save ' + format, exact: true }).click()
      await (await pending).saveAs(folder + '/' + stem + '.' + format.toLowerCase())
    }
    await page.screenshot({ path: folder + '/' + stem + '-export.png', fullPage: true })
    await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
  }
  expect(errors).toEqual([])
})
