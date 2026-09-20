import { expect, test, type Locator, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { activateView, fileAction, openNeckDock } from './uiHelpers'
import { parseProject } from '../../src/file/projectFile'
import { createStarterDocument } from '../../src/model/project'
const node = (page: Page, id = 'starter-03') => page.locator(`.large [data-node-id="${id}"]`)
const outline = (page: Page) => page.locator('.large .body-path')
async function center(locator: Locator) {
  const b = await locator.boundingBox()
  if (!b) throw new Error('Target has no box')
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}
async function drag(page: Page, target: Locator, dx: number, dy: number) {
  const p = await center(target)
  await page.mouse.move(p.x, p.y)
  await page.mouse.down()
  await page.mouse.move(p.x + dx, p.y + dy, { steps: 6 })
  await page.mouse.up()
}
async function selectSegment(page: Page, id = 'starter-03') {
  const point = await page.locator(`.large [data-segment-id="${id}"]`).evaluate((el) => {
    const path = el as SVGPathElement,
      p = path.getPointAtLength(path.getTotalLength() / 2),
      q = new DOMPoint(p.x, p.y).matrixTransform(path.getScreenCTM()!)
    return { x: q.x, y: q.y }
  })
  await page.mouse.click(point.x, point.y)
}
async function rulerCheck(page: Page) {
  const errors = await page.locator('.canvas-card').evaluateAll((cards) =>
    cards.flatMap((card) => {
      const transform = card.querySelector('[data-transform="world"]') as SVGGElement,
        svg = card.querySelector('svg')!
      const matrix = transform.getCTM()!,
        fail: string[] = []
      for (const tick of card.querySelectorAll('[data-axis]')) {
        const axis = tick.getAttribute('data-axis'),
          worldAxis = tick.getAttribute('data-world-axis'),
          mm = Number(tick.getAttribute('data-mm')),
          line = tick.querySelector('line')!
        const expected = new DOMPoint(
          worldAxis === 'x' ? mm : 0,
          worldAxis === 'y' ? mm : 0,
        ).matrixTransform(matrix)
        const actual = Number(line.getAttribute(axis === 'x' ? 'x1' : 'y1'))
        if (Math.abs(actual - (axis === 'x' ? expected.x : expected.y)) > 0.01)
          fail.push(`${card.getAttribute('data-view')} ${axis}/${worldAxis}: ${actual}`)
      }
      if (!svg.querySelector('[data-axis="x"]') || !svg.querySelector('[data-axis="y"]'))
        fail.push('missing ruler')
      return fail
    }),
  )
  expect(errors).toEqual([])
}
test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => {
    ;(window as any).__windowErrors = []
    window.addEventListener('error', (e) => (window as any).__windowErrors.push(e.message))
  })
  ;(page as any).__errors = errors
  await page.goto('/')
  await expect(page.locator('.canvas-card')).toHaveCount(3)
  await expect(node(page)).toBeVisible()
})
test.afterEach(async ({ page }) => {
  expect((page as any).__errors).toEqual([])
  expect(await page.evaluate(() => (window as any).__windowErrors)).toEqual([])
})
test('layout, six rulers, camera alignment and narrow viewport', async ({ page }, info) => {
  await rulerCheck(page)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  if (info.project.name === 'desktop-edge') {
    const a = await page.locator('.large .canvas-card').boundingBox(),
      b = await page.locator('.thumbnails').boundingBox()
    expect(Math.abs(a!.y - b!.y)).toBeLessThan(1)
    expect(Math.abs(a!.y + a!.height - b!.y - b!.height)).toBeLessThan(1)
  }
  const miniBefore = await page
    .locator('.small [data-transform="world"]')
    .first()
    .getAttribute('transform')
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  expect(
    await page.locator('.small [data-transform="world"]').first().getAttribute('transform'),
  ).toBe(miniBefore)
  await page.getByRole('button', { name: 'in', exact: true }).click()
  await rulerCheck(page)
  await activateView(page, 'back')
  await rulerCheck(page)
  await activateView(page, 'pocket')
  await expect(
    page.getByText('A closed pocket template is derived from the neck.', { exact: false }),
  ).toBeVisible()
  await rulerCheck(page)
  await page.screenshot({ path: info.outputPath('editor-pocket.png'), fullPage: true })
  await activateView(page, 'front')
  await page.getByRole('button', { name: 'mm', exact: true }).click()
  await page.getByRole('button', { name: 'Fit to view', exact: true }).click()
  await page.screenshot({ path: info.outputPath('editor-front.png'), fullPage: true })
})
test('neck-right orientation keeps canonical axes, dimensions and all arrow directions coherent', async ({
  page,
}) => {
  const point = async (x: number, y: number) =>
    page
      .locator(`.large [data-transform="world"]`)
      .evaluate(
        (el, { x, y }) => new DOMPoint(x, y).matrixTransform((el as SVGGElement).getScreenCTM()!),
        { x, y },
      )
  const frontNear = await point(0, -120),
    frontFar = await point(0, 120)
  expect(frontNear.x).toBeGreaterThan(frontFar.x)
  const frontTop = await point(-40, 0),
    frontBottom = await point(40, 0)
  expect(frontBottom.y).toBeGreaterThan(frontTop.y)
  await activateView(page, 'back')
  const backNear = await point(0, -120),
    backFar = await point(0, 120)
  expect(backNear.x).toBeGreaterThan(backFar.x)
  const backTop = await point(-40, 0),
    backBottom = await point(40, 0)
  expect(backBottom.y).toBeLessThan(backTop.y)
  await activateView(page, 'front')
  await node(page).click()
  const current = async () => ({
    x: Number(await node(page).getAttribute('cx')),
    y: Number(await node(page).getAttribute('cy')),
  })
  const a = await current()
  await page.keyboard.press('ArrowLeft')
  expect((await current()).y).toBe(a.y + 1)
  await page.keyboard.press('ArrowRight')
  expect((await current()).y).toBe(a.y)
  await page.keyboard.press('ArrowUp')
  expect((await current()).x).toBe(a.x - 1)
  await page.keyboard.press('ArrowDown')
  expect((await current()).x).toBe(a.x)
  await activateView(page, 'back')
  await node(page).click()
  const back = await current()
  await page.keyboard.press('ArrowLeft')
  expect((await current()).y).toBe(back.y + 1)
  await page.keyboard.press('ArrowRight')
  expect((await current()).y).toBe(back.y)
  await page.keyboard.press('ArrowUp')
  expect((await current()).x).toBe(back.x + 1)
  await page.keyboard.press('ArrowDown')
  expect((await current()).x).toBe(back.x)
  const width = page.locator('.large [data-dimension="width"] .dimension-line'),
    height = page.locator('.large [data-dimension="height"] .dimension-line')
  expect(Number(await width.getAttribute('x1'))).toBeCloseTo(
    Number(await width.getAttribute('x2')),
    6,
  )
  expect(Number(await height.getAttribute('y1'))).toBeCloseTo(
    Number(await height.getAttribute('y2')),
    6,
  )
})
test('large front and back show live cubic-extrema dimensions and a visible centerline', async ({
  page,
}) => {
  const dimensions = page.locator('.large [data-dimension]')
  await expect(dimensions).toHaveCount(2)
  const centerline = page.locator('.large .centerline')
  await expect(centerline).toHaveCount(1)
  const centerlineStyle = await centerline.evaluate((el) => ({
    d: el.getAttribute('d'),
    stroke: getComputedStyle(el).stroke,
    dash: getComputedStyle(el).strokeDasharray,
  }))
  expect(centerlineStyle.d).toMatch(/^M0 /)
  expect(centerlineStyle.stroke).not.toBe('none')
  expect(centerlineStyle.dash).not.toBe('none')
  const centerlineScreen = await centerline.evaluate((el) => {
    const path = el as SVGPathElement,
      m = path.getScreenCTM()!,
      a = path.getPointAtLength(0),
      b = path.getPointAtLength(path.getTotalLength())
    return {
      a: new DOMPoint(a.x, a.y).matrixTransform(m),
      b: new DOMPoint(b.x, b.y).matrixTransform(m),
    }
  })
  expect(centerlineScreen.a.y).toBeCloseTo(centerlineScreen.b.y, 6)
  expect(Math.abs(centerlineScreen.a.x - centerlineScreen.b.x)).toBeGreaterThan(10)
  await expect(page.locator('.small [data-dimension]')).toHaveCount(0)
  await expect(page.locator('[data-view="pocket"] [data-dimension]')).toHaveCount(0)
  const widthBefore = Number(
    await page.locator('.large [data-dimension="width"]').getAttribute('data-mm'),
  )
  await node(page, 'starter-10').click()
  await drag(page, node(page, 'starter-10'), 0, -28)
  expect(
    Number(await page.locator('.large [data-dimension="width"]').getAttribute('data-mm')),
  ).toBeGreaterThan(widthBefore)
  await page.getByRole('button', { name: 'in', exact: true }).click()
  await expect(page.locator('.large [data-dimension="width"] text')).toContainText('in')
  await activateView(page, 'back')
  await expect(page.locator('.large [data-dimension]')).toHaveCount(2)
  await expect(page.locator('.large .centerline')).toHaveCount(1)
})
test('node and group drag share a preview, keep camera fixed, cancel and undo exactly', async ({
  page,
}) => {
  const initial = await outline(page).getAttribute('d'),
    transform = await page.locator('.large [data-transform="world"]').getAttribute('transform')
  await node(page).click()
  const p = await center(node(page))
  await page.mouse.move(p.x, p.y)
  await page.mouse.down()
  await page.mouse.move(p.x + 19, p.y + 8, { steps: 5 })
  const paths = await page
    .locator('.body-path')
    .evaluateAll((es) => es.map((e) => e.getAttribute('d')))
  expect(new Set(paths).size).toBe(2)
  expect(paths[0]).not.toBe(initial)
  expect(await page.locator('[data-view="front"] .body-path').getAttribute('d')).toBe(
    await page.locator('[data-view="back"] .body-path').getAttribute('d'),
  )
  expect(await page.locator('.large [data-transform="world"]').getAttribute('transform')).toBe(
    transform,
  )
  await page.keyboard.press('Escape')
  await page.mouse.up()
  expect(await outline(page).getAttribute('d')).toBe(initial)
  await node(page, 'starter-04').click({ modifiers: ['Shift'] })
  await expect(page.locator('.large .node.selected')).toHaveCount(2)
  const x1 = Number(await node(page).getAttribute('cx')),
    x2 = Number(await node(page, 'starter-04').getAttribute('cx'))
  await drag(page, node(page), 20, 10)
  const d1 = Number(await node(page).getAttribute('cx')) - x1,
    d2 = Number(await node(page, 'starter-04').getAttribute('cx')) - x2
  expect(d1).toBeCloseTo(d2, 8)
  expect(d1).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  expect(await outline(page).getAttribute('d')).toBe(initial)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  expect(await outline(page).getAttribute('d')).not.toBe(initial)
})
test('selected corner handles are independent', async ({ page }) => {
  // Zoom resolves physically overlapping handles in the full-guitar fit.
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await expect(page.locator('.large .handle')).toHaveCount(0)
  await node(page).click()
  const handle = (side: string) =>
    page.locator(`.large [data-handle-id="starter-03"][data-side="${side}"]`)
  await expect(page.locator('.large .handle')).toHaveCount(2)
  const incoming = await handle('inHandle').getAttribute('cx')
  await drag(page, handle('outHandle'), 12, 13)
  expect(await handle('inHandle').getAttribute('cx')).toBe(incoming)
  await drag(page, handle('outHandle'), -10, 9)
  expect(await handle('inHandle').getAttribute('cx')).toBe(incoming)
})
test('real segment selection supports exact split, conversion and local deletion', async ({
  page,
}) => {
  const initial = await outline(page).getAttribute('d'),
    dimensions = await page.getByTestId('body-dimensions').textContent()
  await selectSegment(page)
  await page.getByRole('button', { name: 'Straight', exact: true }).click()
  await expect(outline(page)).not.toHaveAttribute('d', initial!)
  await page.getByRole('button', { name: 'Curve', exact: true }).click()
  await expect(page.locator('.large .selected-segment')).toHaveAttribute('d', / C /)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(outline(page)).toHaveAttribute('d', initial!)
  await selectSegment(page, 'starter-03')
  await page.getByRole('button', { name: 'Add point', exact: true }).click()
  await expect(page.locator('.large .node')).toHaveCount(22)
  expect(await page.getByTestId('body-dimensions').textContent()).toBe(dimensions)
  await page.getByRole('button', { name: 'Delete point', exact: true }).click()
  await expect(page.locator('.large .node')).toHaveCount(21)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.locator('.large .node')).toHaveCount(22)
})
test('numeric drafts do not round untouched inches, blank or Escape; keyboard stays out of fields', async ({
  page,
}) => {
  await node(page).click()
  const original = await outline(page).getAttribute('d'),
    x = page.getByRole('textbox', { name: 'Node X' })
  await x.fill('999')
  await x.press('Escape')
  expect(await outline(page).getAttribute('d')).toBe(original)
  await x.fill('')
  await x.press('Tab')
  expect(await outline(page).getAttribute('d')).toBe(original)
  await page.getByRole('button', { name: 'in', exact: true }).click()
  await x.focus()
  await x.press('Tab')
  expect(await outline(page).getAttribute('d')).toBe(original)
  await x.fill('2.5')
  await x.press('Enter')
  expect(Number(await node(page).getAttribute('cx'))).toBeCloseTo(63.5, 8)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  expect(await outline(page).getAttribute('d')).toBe(original)
  await x.focus()
  await x.press('3')
  await expect(page.locator('.large .canvas-card')).toHaveAttribute('data-view', 'front')
  await x.press('Escape')
})
test('automatic neck pocket preserves its fixed centre and a free body segment through current-format reopen', async ({
  page,
}, info) => {
  const centreBefore = await node(page, 'starter-01').getAttribute('cx')
  await openNeckDock(page)
  await page.getByRole('tab', { name: 'Fit', exact: true }).click()
  const radius = page.getByRole('textbox', { name: 'Corner radius', exact: true })
  await radius.fill('8')
  await radius.press('Enter')
  expect(await node(page, 'starter-01').getAttribute('cx')).toBe(centreBefore)
  await selectSegment(page, 'starter-02')
  await page.getByRole('button', { name: 'Straight', exact: true }).click()
  await activateView(page, 'pocket')
  expect((await outline(page).getAttribute('d'))!.match(/ A /g)).toHaveLength(2)
  const pending = page.waitForEvent('download')
  await fileAction(page, 'Download project file')
  const destination = info.outputPath('neck-v4.gtrfactory')
  await (await pending).saveAs(destination)
  const saved = parseProject(await readFile(destination, 'utf8'))
  expect(saved.version).toBe(12)
  expect(saved.neck?.end.radiusMm).toBe(8)
  expect(saved.body.outline.nodes.find((n) => n.id === 'starter-02')?.outgoing).toBe('line')
  await fileAction(page, 'New')
  await page.getByTestId('project-file').setInputFiles(destination)
  await activateView(page, 'front')
  await openNeckDock(page)
  await page.getByRole('tab', { name: 'Fit', exact: true }).click()
  await expect(radius).toHaveValue('8')
})
test('mirrored pan, marquee, keyboard and pocket editing use the same world model', async ({
  page,
}) => {
  await activateView(page, 'back')
  // Keep the mirror-specific pan path in view: mobile layout can place the large canvas below the fold.
  const largeSvg = page.locator('.large svg')
  await largeSvg.scrollIntoViewIfNeeded()
  await largeSvg.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
  const before = await center(node(page))
  await largeSvg.focus()
  await page.keyboard.down('Space')
  await drag(page, node(page), 25, 10)
  await page.keyboard.up('Space')
  const after = await center(node(page))
  expect(after.x - before.x).toBeCloseTo(25, 0)
  expect(after.y - before.y).toBeCloseTo(10, 0)
  await rulerCheck(page)
  await node(page).click()
  const y = Number(await node(page).getAttribute('cy'))
  await page.keyboard.press('ArrowRight')
  expect(Number(await node(page).getAttribute('cy'))).toBe(y - 1)
  await page.getByRole('button', { name: 'Fit to view', exact: true }).click()
  await page.locator('.large svg').scrollIntoViewIfNeeded()
  const r = await page.locator('.large svg').boundingBox()
  // Reverse-direction marquee over the full fitted body, using blank corners.
  await page.mouse.move(r!.x + r!.width - 3, r!.y + r!.height - 3)
  await page.mouse.down()
  await page.mouse.move(r!.x + 45, r!.y + 45, { steps: 5 })
  await page.mouse.up()
  await expect(page.locator('.large .node.selected')).toHaveCount(21)
  const outlineBefore = await outline(page).getAttribute('d')
  await page.keyboard.press('Delete')
  expect(await outline(page).getAttribute('d')).toBe(outlineBefore)
  await expect(page.getByRole('status')).toContainText('locked neck joint')
  await activateView(page, 'pocket')
  await node(page, 'starter-21').click()
  const pocketX = Number(await node(page, 'starter-21').getAttribute('cx'))
  await drag(page, node(page, 'starter-21'), 8, 5)
  expect(Number(await node(page, 'starter-21').getAttribute('cx'))).toBe(pocketX)
  await activateView(page, 'front')
  expect(Number(await node(page, 'starter-21').getAttribute('cx'))).toBe(pocketX)
})
test('named real project download, validation and reopen preserve work', async ({ page }, info) => {
  await node(page).click()
  await drag(page, node(page), 11, 6)
  const original = await outline(page).getAttribute('d')
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Oma hybridi')
  await page.getByRole('textbox', { name: 'Project name', exact: true }).press('Tab')
  const pending = page.waitForEvent('download')
  await fileAction(page, 'Download project file')
  const download = await pending
  expect(download.suggestedFilename()).toBe('Oma hybridi.gtrfactory')
  const destination = info.outputPath('Oma hybridi.gtrfactory')
  await download.saveAs(destination)
  const project = parseProject(await readFile(destination, 'utf8'))
  expect(project.name).toBe('Oma hybridi')
  expect(project.units).toBe('mm')
  expect(project.body.outline.nodes).toHaveLength(21)
  await expect(page.getByTestId('save-state')).toHaveText('Saved')
  await fileAction(page, 'New')
  await page.getByTestId('project-file').setInputFiles(destination)
  await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue(
    'Oma hybridi',
  )
  expect(await outline(page).getAttribute('d')).toBe(original)
  await node(page).click()
  await page.keyboard.press('ArrowRight')
  const edited = await outline(page).getAttribute('d')
  await fileAction(page, 'New')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await outline(page).getAttribute('d')).toBe(edited)
  await page.getByTestId('project-file').setInputFiles({
    name: 'bad.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from('null'),
  })
  await expect(page.getByRole('status')).toContainText('Open failed')
  expect(await outline(page).getAttribute('d')).toBe(edited)
})

test('native save adapter cancellation and write failure preserve dirty work, successful close marks the snapshot', async ({
  page,
}) => {
  await node(page).click()
  await page.keyboard.press('ArrowRight')
  const before = await outline(page).getAttribute('d')
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Native save')
  await page.getByRole('textbox', { name: 'Project name', exact: true }).press('Tab')
  const downloads: string[] = []
  page.on('download', (d) => downloads.push(d.suggestedFilename()))
  await page.evaluate(() => {
    ;(window as any).showSaveFilePicker = () =>
      Promise.reject(new DOMException('Peruttu', 'AbortError'))
  })
  await fileAction(page, 'Save')
  await expect(page.getByRole('status')).toHaveText('Save cancelled.')
  await expect(page.getByTestId('save-state')).toHaveText('Modified')
  expect(downloads).toEqual([])
  expect(await outline(page).getAttribute('d')).toBe(before)
  await page.evaluate(() => {
    ;(window as any).showSaveFilePicker = async () => ({
      createWritable: async () => ({
        write: async () => {
          throw new Error('write failed')
        },
        close: async () => {
          throw new Error('must not close')
        },
      }),
    })
  })
  await fileAction(page, 'Save')
  await expect(page.getByRole('status')).toContainText('write failed')
  await expect(page.getByTestId('save-state')).toHaveText('Modified')
  await page.evaluate(() => {
    ;(window as any).__savedText = ''
    ;(window as any).__closed = false
    ;(window as any).showSaveFilePicker = async () => ({
      createWritable: async () => ({
        write: async (text: string) => {
          ;(window as any).__savedText = text
        },
        close: async () => {
          ;(window as any).__closed = true
        },
      }),
    })
  })
  await fileAction(page, 'Save')
  await expect(page.getByTestId('save-state')).toHaveText('Saved')
  expect(await page.evaluate(() => (window as any).__closed)).toBe(true)
  expect(
    parseProject(await page.evaluate(() => (window as any).__savedText)).body.outline.nodes,
  ).toHaveLength(21)
})
test('dirty Open confirmation can cancel; an older asynchronous read cannot replace edited work', async ({
  page,
}) => {
  await node(page).click()
  await page.keyboard.press('ArrowRight')
  const before = await outline(page).getAttribute('d')
  await fileAction(page, 'Open')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await outline(page).getAttribute('d')).toBe(before)
  const incoming = { ...createStarterDocument(), name: 'Vanha luku' }
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
  await page.evaluate(() => {
    ;(window as any).showOpenFilePicker = undefined
  })
  await fileAction(page, 'Open')
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  const chooser = await chooserPromise
  await chooser.setFiles({
    name: 'older.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(incoming)),
  })
  await expect.poll(() => page.evaluate(() => typeof (window as any).__finishRead)).toBe('function')
  await node(page).click()
  await page.keyboard.press('ArrowRight')
  const edited = await outline(page).getAttribute('d')
  await page.evaluate(() => (window as any).__finishRead())
  await expect(page.getByRole('status')).toContainText('open operation was not used')
  expect(await outline(page).getAttribute('d')).toBe(edited)
  await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue('')
})

test('wheel zoom after initial measurement prevents page scroll and Fit restores the camera', async ({
  page,
}) => {
  const svg = page.locator('.large svg'),
    world = page.locator('.large [data-transform="world"]')
  await svg.scrollIntoViewIfNeeded()
  const initial = await world.getAttribute('transform'),
    d = await outline(page).getAttribute('d')
  const mini = await page
    .locator('.small [data-transform="world"]')
    .first()
    .getAttribute('transform')
  const scroll = await page.evaluate(() => scrollY),
    p = await center(svg)
  await page.mouse.move(p.x, p.y)
  await page.mouse.wheel(0, -240)
  await expect(world).not.toHaveAttribute('transform', initial!)
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
  expect(await page.evaluate(() => scrollY)).toBe(scroll)
  expect(await outline(page).getAttribute('d')).toBe(d)
  expect(
    await page.locator('.small [data-transform="world"]').first().getAttribute('transform'),
  ).toBe(mini)
  await rulerCheck(page)
  await page.getByRole('button', { name: 'Fit to view', exact: true }).click()
  expect(await world.getAttribute('transform')).toBe(initial)
})

test('Space activates a focused toolbar button and still pans the canvas', async ({ page }) => {
  const world = page.locator('.large [data-transform="world"]'),
    initial = await world.getAttribute('transform')
  const zoomOut = page.getByRole('button', { name: 'Zoom out', exact: true })
  await zoomOut.focus()
  await zoomOut.press('Space')
  await expect(world).not.toHaveAttribute('transform', initial!)
  const pan = page.getByRole('button', { name: 'Pan view', exact: true })
  await pan.focus()
  await pan.press('Space')
  await expect(pan).toHaveAttribute('aria-pressed', 'true')
  const p = await center(node(page)),
    d = await outline(page).getAttribute('d')
  await drag(page, node(page), 9, 7)
  const q = await center(node(page))
  expect(q.x - p.x).toBeCloseTo(9, 1)
  expect(q.y - p.y).toBeCloseTo(7, 1)
  expect(await outline(page).getAttribute('d')).toBe(d)
})

test('session-only ghost reference validates input, shares all previews and leaves the project untouched', async ({
  page,
}) => {
  const original = await outline(page).getAttribute('d'),
    dimensions = await page.getByTestId('body-dimensions').textContent()
  await page.getByRole('button', { name: /Reference overlay/ }).click()
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Load reference overlay', exact: true }).click()
  const chooser = await chooserPromise,
    idea = { ...createStarterDocument(), name: 'Idea' }
  await chooser.setFiles({
    name: 'idea.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(idea)),
  })
  await expect(page.getByText('Reference overlay loaded.', { exact: false })).toBeVisible()
  await expect(page.locator('[data-reference-kind="project"]')).toHaveCount(3)
  await expect(page.locator('.large .reference-layer')).toHaveAttribute('pointer-events', 'none')
  await expect(page.locator('.large .body-path')).toHaveClass(/with-reference/)
  expect(await outline(page).getAttribute('d')).toBe(original)
  expect(await page.getByTestId('body-dimensions').textContent()).toBe(dimensions)
  await expect(page.getByTestId('save-state')).toHaveText('Saved')
  const badChooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Load reference overlay', exact: true }).click()
  await (
    await badChooser
  ).setFiles({ name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('not a png') })
  await expect(page.getByRole('status')).toContainText('Reference-overlay load failed')
  await expect(page.locator('[data-reference-kind="project"]')).toHaveCount(3)
  await fileAction(page, 'New')
  await expect(page.locator('[data-reference-kind]')).toHaveCount(0)
  await expect(page.getByText('The reference overlay is not saved in the project.')).toBeVisible()
})
