import { expect, test, type Locator, type Page } from '@playwright/test'
import { activateView, openNeckDock, settle } from './uiHelpers'
import { createStarterDocument } from '../../src/model/project'
import { useAppStore } from '../../src/store'
const node = (page: Page, id = 'starter-03') => page.locator(`.large [data-node-id="${id}"]`)
const segment = (page: Page, id = 'starter-03') => page.locator(`.large [data-segment-id="${id}"]`)
const world = (page: Page) => page.locator('.large [data-transform="world"]')
const corner = (page: Page, side = 'left') => page.locator(`.large [data-pocket-corner="${side}"]`)
async function selectPoint(page: Page, locator: Locator, fraction: number, touch = false) {
  await page.locator('.large svg').scrollIntoViewIfNeeded()
  await settle(page)
  const p = await locator.evaluate((el, f) => {
    const path = el as SVGPathElement,
      p = path.getPointAtLength(path.getTotalLength() * f),
      q = new DOMPoint(p.x, p.y).matrixTransform(path.getScreenCTM()!)
    return { x: p.x, y: p.y, sx: q.x, sy: q.y }
  }, fraction)
  if (touch) await page.touchscreen.tap(p.sx, p.sy)
  else await page.mouse.click(p.sx, p.sy)
  await settle(page)
  return p
}
async function selectCorner(page: Page, side: string, touch = false) {
  const path = corner(page, side).locator('.corner-hit')
  if (await path.count()) return selectPoint(page, path, 0.5, touch)
  if (touch) await corner(page, side).locator('.corner-hit-point').tap()
  else await corner(page, side).locator('.corner-hit-point').click()
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
  await expect(node(page)).toBeVisible()
  await settle(page)
})
test.afterEach(async ({ page }) => {
  expect((page as any).__errors).toEqual([])
})

test('context row follows node, group, protected and segment selections without changing the canvas', async ({
  page,
  isMobile,
}) => {
  // Fit includes the headstock; zoom into short body segments before testing touch selection.
  if (isMobile) {
    for (let i = 0; i < 4; i++)
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
    await settle(page)
  }
  const ui = page.getByRole('region', { name: 'Selection tools' }),
    size = await page.locator('.large svg').boundingBox(),
    matrix = await world(page).getAttribute('transform')
  await expect(ui).toHaveAttribute('data-context', 'empty')
  await expect(page.locator('.toolbar .body-tools')).toHaveCount(0)
  if (isMobile) await node(page).tap()
  else await node(page).click()
  await expect(ui).toHaveAttribute('data-context', 'node')
  await expect(ui.getByRole('button', { name: 'Smooth', exact: true })).toBeVisible()
  await expect(ui.getByRole('textbox', { name: 'Node X' })).toBeVisible()
  await expect(ui.getByRole('button', { name: 'Add point' })).toHaveCount(0)
  await node(page, 'starter-04').click({ modifiers: ['Shift'] })
  await expect(ui).toHaveAttribute('data-context', 'multiple')
  await expect(ui).toContainText('2 nodes selected')
  await node(page, 'starter-01').click()
  await expect(ui).toHaveAttribute('data-context', 'protected')
  await expect(ui.getByRole('button', { name: 'Delete point' })).toBeDisabled()
  await expect(ui.getByRole('button', { name: 'Neck fit' })).toBeVisible()
  await selectPoint(page, segment(page), 0.4, isMobile)
  await expect(ui).toHaveAttribute('data-context', 'segment')
  await expect(ui.getByRole('button', { name: 'Straight', exact: true })).toBeVisible()
  await expect(ui.getByRole('button', { name: 'Smooth' })).toHaveCount(0)
  await page.locator('.large svg').click({ position: { x: 48, y: 48 } })
  await settle(page)
  await expect(ui).toHaveAttribute('data-context', 'empty')
  const after = await page.locator('.large svg').boundingBox()
  expect(after!.width).toBe(size!.width)
  expect(after!.height).toBe(size!.height)
  expect(await world(page).getAttribute('transform')).toBe(matrix)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('curve click marker and split agree away from midpoint; a mirrored line uses linear placement', async ({
  page,
  isMobile,
}) => {
  for (const kind of ['curve', 'line'] as const) {
    if (kind === 'line') {
      await activateView(page, 'back')
      await selectPoint(page, segment(page), 0.4, isMobile)
      await page.getByRole('button', { name: 'Straight', exact: true }).click()
    }
    const before = await page.locator('.large .body-path').getAttribute('d'),
      count = await page.locator('.large .node').count()
    if (isMobile && kind === 'curve') {
      await selectPoint(page, segment(page), 0.26, true)
      await expect(node(page)).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('.context-tools')).toHaveAttribute('data-context', 'node')
      await page.locator('.large svg').click({ position: { x: 48, y: 48 } })
      await settle(page)
      await expect(page.locator('.context-tools')).toHaveAttribute('data-context', 'empty')
      for (let i = 0; i < 4; i++)
        await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
      await settle(page)
    }
    const target = await selectPoint(page, segment(page), isMobile ? 0.36 : 0.26, isMobile)
    const marker = page.locator('.large .segment-preview-marker')
    await expect(marker).toBeVisible()
    const p = {
      x: Number(await marker.getAttribute('cx')),
      y: Number(await marker.getAttribute('cy')),
    }
    // A touch coordinate is rounded to a screen pixel; projection stays on the exact canonical curve.
    const tolerance = isMobile ? 5 : 0.03
    expect(Math.hypot(p.x - target.x, p.y - target.y)).toBeLessThan(tolerance)
    expect(Number(await marker.getAttribute('data-segment-preview-t'))).not.toBeCloseTo(0.5, 2)
    await page.getByRole('button', { name: 'Add point', exact: true }).click()
    const added = page.locator('.large .node.selected')
    await expect(added).toHaveCount(1)
    expect(Number(await added.getAttribute('cx'))).toBeCloseTo(p.x, 8)
    expect(Number(await added.getAttribute('cy'))).toBeCloseTo(p.y, 8)
    await expect(page.locator('.large .node')).toHaveCount(count + 1)
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await expect(page.locator('.large .body-path')).toHaveAttribute('d', before!)
    await expect(marker).toHaveCount(0)
    await page.getByRole('button', { name: 'Redo', exact: true }).click()
    await expect(page.locator('.large .node')).toHaveCount(count + 1)
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
  }
})

test('keyboard selects nodes and segments and protected context opens the existing fit controls', async ({
  page,
}) => {
  await segment(page).focus()
  await segment(page).press('Enter')
  await expect(page.locator('.context-tools')).toHaveAttribute('data-context', 'segment')
  await expect(page.locator('.large .segment-preview-marker')).toHaveAttribute(
    'data-segment-preview-t',
    '0.5',
  )
  await node(page).focus()
  await node(page).press('Space')
  await expect(page.locator('.context-tools')).toHaveAttribute('data-context', 'node')
  const y = Number(await node(page).getAttribute('cy'))
  await node(page).press('ArrowRight')
  expect(Number(await node(page).getAttribute('cy'))).toBe(y - 1)
  await node(page, 'starter-01').focus()
  await node(page, 'starter-01').press('Enter')
  await page.getByRole('button', { name: 'Neck fit' }).click()
  await expect(page.getByRole('tab', { name: 'Fit', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('both pocket corners target the shared radius, update both profiles and support zero radius', async ({
  page,
  isMobile,
}) => {
  await activateView(page, 'pocket')
  const before = await page.locator('.large .body-path').getAttribute('d'),
    neckBefore = await page.locator('[data-view="front"] .neck-outline').getAttribute('d')
  await selectCorner(page, 'left', isMobile)
  const radius = page.getByRole('textbox', { name: 'Corner radius', exact: true })
  await expect(radius).toBeFocused()
  await expect(radius).toHaveValue('6')
  await expect(page.locator('.large .radius-active')).toHaveCount(2)
  await radius.fill('8')
  expect(await page.locator('[data-view="front"] .neck-outline').getAttribute('d')).not.toBe(
    neckBefore,
  )
  await selectCorner(page, 'right', isMobile)
  await expect(radius).toHaveValue('8')
  await expect(radius).toBeFocused()
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.locator('.large .body-path')).toHaveAttribute('d', before!)
  await expect(page.locator('[data-view="front"] .neck-outline')).toHaveAttribute('d', neckBefore!)
  await corner(page, 'right').focus()
  await corner(page, 'right').press('Enter')
  await expect(radius).toBeFocused()
  await radius.fill('0')
  await radius.press('Enter')
  await expect(page.locator('.large .corner-hit-point')).toHaveCount(2)
  await selectCorner(page, 'left', isMobile)
  await expect(radius).toHaveValue('0')
  await page.getByRole('button', { name: 'Cancel changes', exact: true }).click()
  await corner(page, 'right').focus()
  await corner(page, 'right').press('Space')
  await expect(radius).toBeFocused()
  await expect(radius).toHaveValue('0')
})

test('radius selection preserves invalid and hidden pending fields without remounting the draft', async ({
  page,
  isMobile,
}) => {
  await openNeckDock(page)
  await page.getByRole('textbox', { name: 'Bass scale length', exact: true }).fill('660.412345678')
  await page.getByRole('tab', { name: 'Fit', exact: true }).click()
  const radius = page.getByRole('textbox', { name: 'Corner radius', exact: true })
  await radius.fill('')
  const lastGood = await page.locator('[data-view="pocket"] .body-path').getAttribute('d')
  await activateView(page, 'pocket')
  await selectCorner(page, 'right', isMobile)
  await expect(radius).toHaveValue('')
  await expect(radius).toBeFocused()
  await expect(page.getByRole('button', { name: 'Accept', exact: true })).toBeDisabled()
  await expect(page.locator('.large .body-path')).toHaveAttribute('d', lastGood!)
  await page.getByRole('tab', { name: 'Basic dimensions', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Bass scale length', exact: true })).toHaveValue(
    '660.412345678',
  )
  await selectCorner(page, 'left', isMobile)
  await expect(radius).toHaveValue('')
  await expect(radius).toBeFocused()
  await page.getByRole('button', { name: 'Cancel changes', exact: true }).click()
  await expect(page.getByTestId('save-state')).toHaveText('Saved')
})

test('legacy corner selection explains the boundary without creating a neck or changing the task', async ({
  page,
  isMobile,
}) => {
  const st = useAppStore.getState()
  st.replace(createStarterDocument())
  st.configureNeckPocket({
    mouthWidthMm: 56,
    heelWidthMm: 56,
    lengthMm: 76,
    fitAllowanceMm: 0,
    radiusMm: 6,
  })
  const legacy = structuredClone(useAppStore.getState().document)
  await page.getByTestId('project-file').setInputFiles({
    name: 'legacy.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  })
  await activateView(page, 'pocket')
  const before = await page.locator('.large .body-path').getAttribute('d')
  await selectCorner(page, 'left', isMobile)
  await expect(page.locator('.neck-dock')).toHaveCount(0)
  await expect(page.locator('.notice')).toContainText('existing pocket remains unchanged')
  await expect(page.getByTestId('save-state')).toHaveText('Saved')
  await expect(page.locator('.large .body-path')).toHaveAttribute('d', before!)
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
})
