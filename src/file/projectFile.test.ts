import { describe, expect, it } from 'vitest'
import {
  forceDownload,
  parseProject,
  saveWithDialog,
  serializeProject,
  writeProject,
} from './projectFile'
import { createStarterDocument } from '../model/project'
import { useAppStore } from '../store'
describe('project file', () => {
  it('round-trips valid data and rejects duplicate ids', () => {
    const d = createStarterDocument()
    expect(parseProject(serializeProject(d))).toEqual(d)
    d.body.outline.nodes[1].id = d.body.outline.nodes[0].id
    expect(() => parseProject(serializeProject(d))).toThrow('identifier')
  })
  it('accepts only strict v9, rejects unsupported files and preserves the open document atomically', () => {
    const current = createStarterDocument()
    const unsupported = structuredClone(current) as any
    unsupported.version = 5
    expect(() => parseProject(JSON.stringify(unsupported))).toThrow(
      'supported versions are 10, 11, 12 and 13',
    )
    const equal = structuredClone(current)
    equal.neck = null
    const withNeck = structuredClone(createStarterDocument())
    expect(() => parseProject(JSON.stringify(equal))).not.toThrow()
    const state = parseProject(serializeProject(withNeck))
    expect(state.version).toBe(13)
  })
  it('accepts and removes an inactive legacy bass-5 variant, but rejects active or foreign variants', () => {
    const current = createStarterDocument()
    const withNeck = structuredClone(current) as any
    useAppStore.getState().newProject()
    useAppStore.getState().setView('front')
    useAppStore.getState().setEditingTarget('headstock')
    useAppStore.getState().switchHeadstockTemplate('bass-4-inline')
    const bass4 = JSON.parse(serializeProject(useAppStore.getState().document))
    const legacy = structuredClone(bass4)
    legacy.neck.headstock.variants['bass-5-inline'] = structuredClone(
      legacy.neck.headstock.variants['bass-4-inline'],
    )
    legacy.version = 10
    delete legacy.handedness
    for (const cavity of legacy.pickupCavities) {
      delete cavity.angleDeg
      delete cavity.widthMm
      delete cavity.lengthMm
    }
    const loaded = parseProject(JSON.stringify(legacy))
    expect(Object.keys(loaded.neck!.headstock.variants)).toEqual([
      'inline',
      'three-three-2',
      'three-three-3',
      'bass-4-inline',
      'headless',
    ])
    expect(JSON.parse(serializeProject(loaded)).neck.headstock.variants).not.toHaveProperty(
      'bass-5-inline',
    )
    const v11Legacy = structuredClone(legacy)
    v11Legacy.version = 11
    v11Legacy.handedness = 'right'
    expect(() => parseProject(JSON.stringify(v11Legacy))).toThrow('headstock structure')
    const before = serializeProject(useAppStore.getState().document)
    const activeLegacy = structuredClone(legacy)
    activeLegacy.neck.headstock.activeTemplateId = 'bass-5-inline'
    expect(() => parseProject(JSON.stringify(activeLegacy))).toThrow(
      'Five-string bass headstocks are no longer supported',
    )
    expect(serializeProject(useAppStore.getState().document)).toBe(before)
    const foreign = structuredClone(bass4)
    foreign.neck.headstock.variants.foreign = structuredClone(
      foreign.neck.headstock.variants['bass-4-inline'],
    )
    expect(() => parseProject(JSON.stringify(foreign))).toThrow('headstock structure')
    delete withNeck.neck
  })
  it('accepts cross-runtime neck rounding only within the snapshot tolerance', () => {
    useAppStore.getState().newProject()
    useAppStore.getState().setView('front')
    useAppStore.getState().setEditingTarget('headstock')
    useAppStore.getState().switchHeadstockTemplate('bass-4-inline')
    const bass = JSON.parse(serializeProject(useAppStore.getState().document))
    bass.neck.snapshot.nut[0].y += 5e-11
    expect(parseProject(JSON.stringify(bass)).neck!.snapshot.nut[0].y).not.toBe(
      bass.neck.snapshot.nut[0].y,
    )
    bass.neck.snapshot.nut[0].y += 1e-8
    expect(() => parseProject(JSON.stringify(bass))).toThrow('neck geometry snapshot')
  })
  it('rejects changed neck snapshot structure even when numeric values are valid', () => {
    useAppStore.getState().newProject()
    useAppStore.getState().setView('front')
    useAppStore.getState().setEditingTarget('headstock')
    useAppStore.getState().switchHeadstockTemplate('bass-4-inline')
    const bass = JSON.parse(serializeProject(useAppStore.getState().document))
    const mutations = [
      (value: any) => delete value.neck.snapshot.nut[0].y,
      (value: any) => (value.neck.snapshot.nut[0].unexpected = 0),
      (value: any) => (value.neck.snapshot.nut[0].y = null),
      (value: any) => (value.neck.snapshot.nut[0].y = '0'),
      (value: any) => (value.neck.snapshot.nut = {}),
    ]
    for (const mutate of mutations) {
      const invalid = structuredClone(bass)
      mutate(invalid)
      expect(() => parseProject(JSON.stringify(invalid))).toThrow('neck geometry snapshot')
    }
  })
  it('writes named dialog and forced download through adapters', async () => {
    const writes: string[] = []
    await saveWithDialog(
      {
        async showSaveFilePicker() {
          return {
            async createWritable() {
              return {
                async write(v: string) {
                  writes.push(v)
                },
                async close() {},
              }
            },
          }
        },
      },
      createStarterDocument(),
      'oma',
    )
    expect(writes[0]).toContain('gtrfactory-project')
    let downloaded = ''
    forceDownload(
      {
        download(name) {
          downloaded = name
        },
      },
      createStarterDocument(),
      'oma',
    )
    expect(downloaded).toBe('oma.gtrfactory')
  })
  it('aborts a failed native write without hiding its original error', async () => {
    let closed = false,
      aborted = false
    await expect(
      writeProject(
        {
          async createWritable() {
            return {
              async write() {
                throw new Error('disk full')
              },
              async close() {
                closed = true
              },
              async abort() {
                aborted = true
              },
            }
          },
        },
        createStarterDocument(),
      ),
    ).rejects.toThrow('disk full')
    expect(aborted).toBe(true)
    expect(closed).toBe(false)
  })
  it('also aborts after a close failure', async () => {
    let aborted = false
    await expect(
      writeProject(
        {
          async createWritable() {
            return {
              async write() {},
              async close() {
                throw new Error('close failed')
              },
              async abort() {
                aborted = true
              },
            }
          },
        },
        createStarterDocument(),
      ),
    ).rejects.toThrow('close failed')
    expect(aborted).toBe(true)
  })
})

it('reads v10 as right-handed, requires v11 handedness, and rejects v10 left', () => {
  const current = createStarterDocument()
  const v10 = JSON.parse(serializeProject(current))
  v10.version = 10
  delete v10.handedness
  for (const cavity of v10.pickupCavities) {
    delete cavity.angleDeg
    delete cavity.widthMm
    delete cavity.lengthMm
  }
  expect(parseProject(JSON.stringify(v10))).toMatchObject({ version: 13, handedness: 'right' })
  v10.handedness = 'left'
  expect(() => parseProject(JSON.stringify(v10))).toThrow('cannot declare left-handedness')
  const v11 = JSON.parse(serializeProject(current))
  delete v11.handedness
  expect(() => parseProject(JSON.stringify(v11))).toThrow('require handedness')
})

it('migrates v10/v11 pickup defaults and rejects transform fields in old versions atomically', () => {
  useAppStore.getState().newProject()
  const current = JSON.parse(serializeProject(useAppStore.getState().document))
  const old = structuredClone(current)
  old.version = 11
  for (const cavity of old.pickupCavities) {
    delete cavity.angleDeg
    delete cavity.widthMm
    delete cavity.lengthMm
  }
  const migrated = parseProject(JSON.stringify(old))
  expect(migrated.version).toBe(13)
  expect(migrated.pickupCavities[0]).toMatchObject({ angleDeg: 0 })
  const invalid = structuredClone(old)
  invalid.pickupCavities[0].widthMm = 45
  expect(() => parseProject(JSON.stringify(invalid))).toThrow('Older project versions')
  const v12 = structuredClone(current)
  delete v12.pickupCavities[0].angleDeg
  expect(() => parseProject(JSON.stringify(v12))).toThrow('require angle and dimensions')
})
