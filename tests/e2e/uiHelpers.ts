import { expect, type Page } from '@playwright/test'
export async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
}
export async function activateView(page: Page, view: 'front' | 'back' | 'pocket') {
  if ((await page.locator('.large .canvas-card').getAttribute('data-view')) !== view)
    await page.locator(`.small[data-view="${view}"]`).click()
  await expect(page.locator('.large .canvas-card')).toHaveAttribute('data-view', view)
  await settle(page)
}
export async function openNeckDock(page: Page) {
  await activateView(page, 'front')
  await page.locator('.large .neck-outline').click()
  await expect(page.locator('.neck-dock')).toBeVisible()
  await settle(page)
}
export async function fileAction(page: Page, name: string) {
  if (!(await page.locator('.file-menu').evaluate((el) => el.hasAttribute('open'))))
    await page.locator('.file-menu summary').click()
  if (name === 'Download project file') {
    await page.evaluate(() => {
      ;(window as any).showSaveFilePicker = undefined
    })
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    const dialog = page.locator('.save-name-dialog')
    if (await dialog.isVisible()) {
      await dialog.getByRole('textbox', { name: 'Project name', exact: true }).fill('My guitar')
      await dialog.getByRole('button', { name: 'Save', exact: true }).click()
    }
    return
  }
  await page.getByRole('button', { name, exact: true }).click()
}
