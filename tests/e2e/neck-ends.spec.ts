import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { useAppStore } from '../../src/store'
import { fileAction, openNeckDock, settle } from './uiHelpers'

const field = (page: Page, name: string) => page.getByRole('textbox', { name, exact: true })
const front = (page: Page) => page.locator('[data-view="front"] .neck-outline')
const heel = (page: Page) => page.locator('[data-view="front"] .neck-heel')
const pocket = (page: Page) => page.locator('[data-view="pocket"] .body-path')
const apply = (page: Page) => page.getByRole('button', { name: 'Accept', exact: true })
const namedDefault = (name: string) => {
  useAppStore.getState().newProject()
  const document = structuredClone(useAppStore.getState().document)
  document.name = name
  return document
}
async function download(page: Page, path: string) {
  const pending = page.waitForEvent('download')
  await fileAction(page, 'Download project file')
  await (await pending).saveAs(path)
  return JSON.parse(await readFile(path, 'utf8'))
}

test('separate end margins preview independently, reject unsupported frets and preserve unit precision with one undo', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await page.getByTestId('project-file').setInputFiles({
    name: 'named-ends-fixture.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(namedDefault('End margins fixture'))),
  })
  await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue(
    'End margins fixture',
  )
  await settle(page)
  const original = await download(page, info.outputPath('original.gtrfactory'))
  const before = {
    board: await front(page).getAttribute('d'),
    heel: await heel(page).getAttribute('d'),
    pocket: await pocket(page).getAttribute('d'),
    nut: await page.locator('.nut-line').getAttribute('d'),
    bridge: await page.locator('.bridge-line').getAttribute('d'),
  }
  await openNeckDock(page)
  await page.getByRole('tab', { name: 'Fit', exact: true }).click()
  await field(page, 'Fretboard end allowance').fill('22.25')
  await expect(front(page)).not.toHaveAttribute('d', before.board!)
  await expect(heel(page)).toHaveAttribute('d', before.heel!)
  await expect(pocket(page)).toHaveAttribute('d', before.pocket!)
  const boardOnly = await front(page).getAttribute('d')
  await field(page, 'Neck end allowance').fill('12.125')
  await expect(pocket(page)).not.toHaveAttribute('d', before.pocket!)
  await expect(front(page)).toHaveAttribute('d', boardOnly!)
  await expect(page.locator('.nut-line')).toHaveAttribute('d', before.nut!)
  await expect(page.locator('.bridge-line')).toHaveAttribute('d', before.bridge!)
  const validPocket = await pocket(page).getAttribute('d')
  await field(page, 'Neck end allowance').fill('0')
  await expect(apply(page)).toBeDisabled()
  await expect(page.locator('.field-error')).toContainText('final fret')
  await expect(pocket(page)).toHaveAttribute('d', validPocket!)
  await expect(front(page)).toHaveAttribute('d', boardOnly!)
  await field(page, 'Neck end allowance').fill('12.125')
  await expect(apply(page)).toBeEnabled()
  await field(page, 'Fretboard end allowance').fill('12.125')
  await expect(apply(page)).toBeDisabled()
  await expect(page.locator('.field-error')).toContainText('greater than neck')
  await expect(front(page)).toHaveAttribute('d', boardOnly!)
  await field(page, 'Fretboard end allowance').fill('10')
  await expect(apply(page)).toBeDisabled()
  await expect(page.locator('.field-error')).toContainText('greater than neck')
  await field(page, 'Fretboard end allowance').fill('22.25')
  await expect(apply(page)).toBeEnabled()
  await page.getByRole('button', { name: 'in', exact: true }).click()
  expect(Number(await field(page, 'Neck end allowance').inputValue())).toBeCloseTo(12.125 / 25.4, 6)
  expect(Number(await field(page, 'Fretboard end allowance').inputValue())).toBeCloseTo(
    22.25 / 25.4,
    6,
  )
  await field(page, 'Fretboard end allowance').fill('1')
  await expect(apply(page)).toBeEnabled()
  await page.getByRole('button', { name: 'mm', exact: true }).click()
  await expect(field(page, 'Neck end allowance')).toHaveValue('12.125')
  await expect(field(page, 'Fretboard end allowance')).toHaveValue('25.4')
  await expect(
    page.locator('.field-hint').filter({ hasText: 'Fretboard overhang:' }),
  ).toContainText('13.275 mm')
  await apply(page).click()
  const saved = await download(page, info.outputPath('separate-ends.gtrfactory'))
  expect(saved.version).toBe(13)
  expect(saved.neck.end.endMarginMm).toBeCloseTo(12.125, 9)
  expect(saved.neck.end.fretboardEndMarginMm).toBeCloseTo(25.4, 9)
  expect(saved.neck.placement).toEqual(original.neck.placement)
  expect(saved.pickupCavities).toEqual(original.pickupCavities)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  expect(await download(page, info.outputPath('undone.gtrfactory'))).toEqual(original)
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
  await page.getByTestId('project-file').setInputFiles({
    name: 'separate-ends.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(saved)),
  })
  await expect(page.locator('.notice')).toContainText('Project file opened.')
  await settle(page)
  expect(await download(page, info.outputPath('reopened.gtrfactory'))).toEqual(saved)
  const equal = structuredClone(saved)
  equal.neck.end.fretboardEndMarginMm = equal.neck.end.endMarginMm
  await page.getByTestId('project-file').setInputFiles({
    name: 'equal-v6.gtrfactory',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(equal)),
  })
  await expect(page.locator('.notice')).toContainText(
    'Open failed: The neck placement or end is outside the permitted area.',
  )
  expect(await download(page, info.outputPath('equal-rejected.gtrfactory'))).toEqual(saved)
  await openNeckDock(page)
  await page.getByRole('tab', { name: 'Fit', exact: true }).click()
  await expect(field(page, 'Neck end allowance')).toHaveValue('12.125')
  await expect(field(page, 'Fretboard end allowance')).toHaveValue('25.4')
  await field(page, 'Fretboard end allowance').fill('28')
  await page.getByRole('button', { name: 'Cancel changes', exact: true }).click()
  expect(await download(page, info.outputPath('cancelled.gtrfactory'))).toEqual(saved)
  expect(errors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
