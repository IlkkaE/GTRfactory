import { expect, test, type Locator, type Page } from '@playwright/test'
import { activateView, openNeckDock, settle } from './uiHelpers'

const headstock = (page: Page) => page.locator('.large .headstock-outline')
const bodyPath = (page: Page) => page.locator('.large .body-path')
const node = (page: Page) => page.locator('.large [data-node-id="starter-04"]')

async function drag(page: Page, target: Locator, dx: number, dy: number) {
  const box = await target.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width / 2 + dx, box!.y + box!.height / 2 + dy, {
    steps: 4,
  })
  await page.mouse.up()
  await settle(page)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(headstock(page)).toBeVisible()
  await settle(page)
})

test('headstock entry resolves clean, pending and invalid neck drafts without double commits', async ({
  page,
}) => {
  await openNeckDock(page)
  await headstock(page).click()
  await expect(page.locator('.neck-dock')).toHaveCount(0)
  await expect(page.locator('.large [data-headstock-node-id]')).not.toHaveCount(0)
  await expect(page.getByTestId('save-state')).toHaveText('Saved')

  await page.reload()
  await openNeckDock(page)
  await page.getByRole('textbox', { name: 'Bass scale length', exact: true }).fill('660.4')
  await headstock(page).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.locator('.neck-dock')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await headstock(page).click()
  await page.getByRole('button', { name: 'Apply and continue', exact: true }).click()
  await expect(page.locator('.neck-dock')).toHaveCount(0)
  await expect(page.locator('.large [data-headstock-node-id]')).not.toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeEnabled()

  await page.reload()
  await openNeckDock(page)
  await page.getByRole('textbox', { name: 'Bass scale length', exact: true }).fill('')
  await headstock(page).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.neck-dock')).toBeVisible()
})

test('original-body visibility, grid session controls and reset are transient or undoable as appropriate', async ({
  page,
}) => {
  await expect(page.locator('.large [data-original-body-ghost="true"]')).toHaveCount(1)
  await page.getByLabel('Show original body').uncheck()
  await expect(page.locator('[data-original-body-ghost="true"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Grid: Off', exact: true }).click()
  await expect(page.locator('.large [data-grid-mm="10"]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Grid: 10 mm', exact: true }).click()
  await page.getByRole('button', { name: 'Grid: 5 mm', exact: true }).click()
  await page.getByRole('button', { name: 'Grid: 1 mm', exact: true }).click()
  await expect(page.locator('.large [data-grid-mm]')).toHaveCount(0)

  const original = await bodyPath(page).getAttribute('d')
  await drag(page, node(page), 18, 12)
  const changed = await bodyPath(page).getAttribute('d')
  expect(changed).not.toBe(original)
  await page.getByRole('button', { name: 'Reset body', exact: true }).click()
  await expect(bodyPath(page)).toHaveAttribute('d', original!)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(bodyPath(page)).toHaveAttribute('d', changed!)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(bodyPath(page)).toHaveAttribute('d', original!)
})

test('Grid snaps body pointer nodes and handles in front and mirrored back views', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Grid: Off', exact: true }).click()
  const first = page.locator('.large [data-node-id="starter-09"]'),
    second = page.locator('.large [data-node-id="starter-10"]'),
    beforeFirst = await first.getAttribute('cx'),
    beforeSecond = await second.getAttribute('cx')
  await first.click()
  await second.click({ modifiers: ['Shift'], force: true })
  await drag(page, first, 13, 9)
  const afterFirst = Number(await first.getAttribute('cx')),
    afterSecond = Number(await second.getAttribute('cx'))
  expect(afterFirst % 10).toBeCloseTo(0, 7)
  expect(afterFirst - Number(beforeFirst)).toBeCloseTo(afterSecond - Number(beforeSecond), 7)

  await first.click()
  const handle = page.locator('.large [data-handle-id="starter-09"][data-side="outHandle"]')
  await expect(handle).toBeVisible()
  await drag(page, handle, 11, 7)
  expect(Number(await handle.getAttribute('cx')) % 10).toBeCloseTo(0, 7)
  expect(Number(await handle.getAttribute('cy')) % 10).toBeCloseTo(0, 7)

  await activateView(page, 'back')
  const back = page.locator('.large [data-node-id="starter-09"]')
  await drag(page, back, 12, 8)
  expect(Number(await back.getAttribute('cx')) % 10).toBeCloseTo(0, 7)
  expect(Number(await back.getAttribute('cy')) % 10).toBeCloseTo(0, 7)
})
