import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { useAppStore } from '../../src/store'
import { activateView, fileAction, settle } from './uiHelpers'

async function download(page: Page, filename: string) {
  const pending = page.waitForEvent('download')
  await fileAction(page, 'Download project file')
  await (await pending).saveAs(filename)
  return JSON.parse(await readFile(filename, 'utf8'))
}
const namedDefault = (name: string) => {
  useAppStore.getState().newProject()
  const document = structuredClone(useAppStore.getState().document)
  document.name = name
  return document
}
test('rear cavity handles resize in visible directions and a save notice never cancels a pointer drag', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.getByTestId('project-file').setInputFiles({
    name: 'named-cavity-fixture.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(namedDefault('Rear cavity fixture'))),
  })
  await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue(
    'Rear cavity fixture',
  )
  await activateView(page, 'back')
  const outer = page.locator('.large path.electronics-cavity.outer')
  await outer.focus()
  await outer.press('Enter')
  const before = await outer.getAttribute('d')
  const doc = await download(page, info.outputPath('initial.gtrfactory'))
  const c = doc.body.rearElectronicsCavity
  for (const [side, key, dimension] of [
    ['left', 'ArrowLeft', 'horizontalMm'],
    ['right', 'ArrowRight', 'horizontalMm'],
    ['top', 'ArrowUp', 'verticalMm'],
    ['bottom', 'ArrowDown', 'verticalMm'],
  ]) {
    const handle = page.locator('.large [data-electronics-cavity-handle="' + side + '"]')
    await handle.focus()
    await handle.press(key)
    const resized = await download(page, info.outputPath(side + '.gtrfactory'))
    expect(resized.body.rearElectronicsCavity[dimension]).toBeCloseTo(c[dimension] + 1, 7)
    await page.keyboard.press('Control+z')
    await settle(page)
    expect(await outer.getAttribute('d')).toBe(before)
  }
  const handle = page.locator('.large [data-electronics-cavity-handle="left"]'),
    box = (await handle.boundingBox())!
  const height = await page
    .locator('.large .svg-wrap')
    .evaluate((e) => e.getBoundingClientRect().height)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 - 3, box.y + box.height / 2, { steps: 3 })
  await page.mouse.up()
  await settle(page)
  expect(
    await page.locator('.large .svg-wrap').evaluate((e) => e.getBoundingClientRect().height),
  ).toBe(height)
  expect(await outer.getAttribute('d')).not.toBe(before)
  await page.keyboard.press('Control+z')
  await settle(page)
  expect(await outer.getAttribute('d')).toBe(before)
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
  expect(errors).toEqual([])
})

test('rear cavity cancel, view selection cleanup and v9 roundtrip preserve the outline', async ({
  page,
}, info) => {
  await page.goto('/')
  await activateView(page, 'back')
  const outer = page.locator('.large path.electronics-cavity.outer')
  await outer.focus()
  await outer.press('Enter')
  const original = await outer.getAttribute('d'),
    box = (await outer.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 4, box.y + box.height / 2, { steps: 3 })
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await settle(page)
  expect(await outer.getAttribute('d')).toBe(original)
  const doc = await download(page, info.outputPath('cavity.gtrfactory'))
  expect(doc.version).toBe(11)
  await activateView(page, 'front')
  expect(await page.locator('.large [data-electronics-cavity]').count()).toBe(0)
  await activateView(page, 'back')
  expect(await page.locator('.large [data-electronics-cavity-handle]').count()).toBe(0)
  await page.getByTestId('project-file').setInputFiles({
    name: 'cavity.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(doc)),
  })
  await expect(page.getByRole('status')).toContainText('Project file opened.')
  await activateView(page, 'back')
  expect(await outer.getAttribute('d')).toBe(original)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
