import { expect, test } from '@playwright/test'
import { createStarterDocument } from '../../src/model/project'
import { fileAction, openNeckDock } from './uiHelpers'

const namedSave = async (page: import('@playwright/test').Page, name: string) => {
  await fileAction(page, 'Save')
  const dialog = page.locator('.save-name-dialog')
  if (await dialog.isVisible()) {
    await dialog.getByRole('textbox', { name: 'Project name', exact: true }).fill(name)
    await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  }
  await expect(page.getByTestId('save-state')).toHaveText('Saved')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.canvas-card')).toHaveCount(3)
})

test('Save asks for a name, keeps cancel non-destructive, and reuses a matching native handle', async ({
  page,
}) => {
  await page.evaluate(() => {
    ;(window as any).__savePickCount = 0
    ;(window as any).__writes = []
    ;(window as any).showSaveFilePicker = async () => {
      const id = ++(window as any).__savePickCount
      return {
        createWritable: async () => ({
          write: async (text: string) => (window as any).__writes.push([id, text]),
          close: async () => {},
        }),
      }
    }
  })
  await fileAction(page, 'Save')
  const dialog = page.locator('.save-name-dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue('')
  expect(await page.evaluate(() => (window as any).__savePickCount)).toBe(0)
  await namedSave(page, 'First guitar')
  expect(await page.evaluate(() => (window as any).__savePickCount)).toBe(1)
  await page.locator('.large [data-node-id="starter-03"]').click()
  await page.keyboard.press('ArrowRight')
  await namedSave(page, 'First guitar')
  expect(await page.evaluate(() => (window as any).__savePickCount)).toBe(1)
  await expect.poll(() => page.evaluate(() => (window as any).__writes.length)).toBe(2)
  const headerName = page.getByRole('textbox', { name: 'Project name', exact: true })
  await headerName.fill('Second guitar')
  await headerName.press('Tab')
  await namedSave(page, 'Second guitar')
  expect(await page.evaluate(() => (window as any).__savePickCount)).toBe(2)
  await headerName.fill('First guitar')
  await headerName.press('Tab')
  await namedSave(page, 'First guitar')
  expect(await page.evaluate(() => (window as any).__savePickCount)).toBe(3)
})

test('native Open binds only after a successful replace and New clears the binding', async ({
  page,
}) => {
  const incoming = { ...createStarterDocument(), name: 'Opened project' }
  await page.evaluate(async (json) => {
    ;(window as any).__openedWrites = 0
    ;(window as any).showOpenFilePicker = async () => [
      {
        getFile: async () => new File([json], 'opened.gtrfactory', { type: 'application/json' }),
        createWritable: async () => ({
          write: async () => ((window as any).__openedWrites += 1),
          close: async () => {},
        }),
      },
    ]
    ;(window as any).__newWrites = 0
    ;(window as any).showSaveFilePicker = async () => ({
      createWritable: async () => ({
        write: async () => ((window as any).__newWrites += 1),
        close: async () => {},
      }),
    })
  }, JSON.stringify(incoming))
  await fileAction(page, 'Open')
  await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue(
    'Opened project',
  )
  await namedSave(page, 'Opened project')
  expect(await page.evaluate(() => (window as any).__openedWrites)).toBe(1)
  await page.evaluate(() => {
    ;(window as any).showOpenFilePicker = () =>
      Promise.reject(new DOMException('cancelled', 'AbortError'))
  })
  await fileAction(page, 'Open')
  await expect(page.getByRole('status')).toHaveText('Open cancelled.')
  await namedSave(page, 'Opened project')
  expect(await page.evaluate(() => (window as any).__openedWrites)).toBe(2)
  await fileAction(page, 'New')
  await namedSave(page, 'New project')
  expect(await page.evaluate(() => (window as any).__openedWrites)).toBe(2)
  expect(await page.evaluate(() => (window as any).__newWrites)).toBe(1)
})

test('the download fallback is explicit when the native picker API is unavailable', async ({
  page,
}) => {
  await page.evaluate(() => {
    ;(window as any).showSaveFilePicker = undefined
  })
  const download = page.waitForEvent('download')
  await namedSave(page, 'Fallback file')
  await expect(page.getByRole('status')).toContainText('new copy was created')
  expect((await download).suggestedFilename()).toBe('Fallback file.gtrfactory')
})

test('a stale picker never writes into a project replaced before its handle returns', async ({
  page,
}) => {
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Old project')
  await page.getByRole('textbox', { name: 'Project name', exact: true }).press('Tab')
  await page.evaluate(() => {
    ;(window as any).__staleWrites = 0
    ;(window as any).showSaveFilePicker = () =>
      new Promise((resolve) => {
        ;(window as any).__resolveStalePicker = () =>
          resolve({
            createWritable: async () => ({
              write: async () => ((window as any).__staleWrites += 1),
              close: async () => {},
            }),
          })
      })
  })
  await fileAction(page, 'Save')
  await fileAction(page, 'New')
  await page.getByRole('dialog').getByRole('button', { name: 'Continue', exact: true }).click()
  await page.evaluate(() => (window as any).__resolveStalePicker())
  await expect.poll(() => page.evaluate(() => (window as any).__staleWrites)).toBe(0)
  await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue('')
})

test('an in-flight write cannot mark a changed project as saved', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Writing project')
  await page.getByRole('textbox', { name: 'Project name', exact: true }).press('Tab')
  await page.evaluate(() => {
    ;(window as any).__writeStarted = false
    ;(window as any).showSaveFilePicker = async () => ({
      createWritable: async () => ({
        write: () =>
          new Promise<void>((resolve) => {
            ;(window as any).__writeStarted = true
            ;(window as any).__finishWrite = resolve
          }),
        close: async () => {},
      }),
    })
  })
  await fileAction(page, 'Save')
  await expect.poll(() => page.evaluate(() => (window as any).__writeStarted)).toBe(true)
  await page.locator('.large [data-node-id="starter-03"]').click()
  await page.keyboard.press('ArrowRight')
  await page.evaluate(() => (window as any).__finishWrite())
  await expect(page.getByTestId('save-state')).toHaveText('Modified')
})

test('an unnamed clean neck draft is cancelled before Save names the document', async ({
  page,
}) => {
  await page.evaluate(() => {
    ;(window as any).__neckSave = ''
    ;(window as any).showSaveFilePicker = async () => ({
      createWritable: async () => ({
        write: async (text: string) => ((window as any).__neckSave = text),
        close: async () => {},
      }),
    })
  })
  await openNeckDock(page)
  await expect(page.locator('.neck-dock')).toBeVisible()
  await namedSave(page, 'Neck draft project')
  await expect(page.locator('.neck-dock')).toHaveCount(0)
  expect(JSON.parse(await page.evaluate(() => (window as any).__neckSave)).name).toBe(
    'Neck draft project',
  )
})

test('a named clean neck draft remains open while Save writes its snapshot', async ({ page }) => {
  await page.evaluate(() => {
    ;(window as any).__namedNeckSave = ''
    ;(window as any).showSaveFilePicker = async () => ({
      createWritable: async () => ({
        write: async (text: string) => ((window as any).__namedNeckSave = text),
        close: async () => {},
      }),
    })
  })
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Named neck project')
  await page.getByRole('textbox', { name: 'Project name', exact: true }).press('Tab')
  await openNeckDock(page)
  await namedSave(page, 'Named neck project')
  await expect(page.locator('.neck-dock')).toBeVisible()
  expect(JSON.parse(await page.evaluate(() => (window as any).__namedNeckSave)).name).toBe(
    'Named neck project',
  )
})
