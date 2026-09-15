import { it, expect } from 'vitest'
import { useAppStore } from '../store'
import { deriveNeckDocument } from '../neck/neckDocument'
import { buildExportDrawing } from './geometry'
import { DEFAULT_EXPORT_OPTIONS, type ExportPart } from './model'
import { at } from './math'
const ids: ExportPart[] = ['front', 'back', 'pocket', 'headstock', 'neck', 'fretboard', 'overview']
for (const kind of ['inline', 'three-three-2', 'bass-4-inline', 'multiscale'] as const) {
  it(`preserves actual curve samples under handedness reflection: ${kind}`, () => {
    const state = useAppStore.getState()
    state.newProject()
    if (kind === 'three-three-2' || kind === 'bass-4-inline') {
      state.setView('front')
      state.setEditingTarget('headstock')
      state.switchHeadstockTemplate(kind)
      expect(useAppStore.getState().message).toBeNull()
    }
    let document = structuredClone(useAppStore.getState().document)
    if (kind === 'multiscale')
      document = deriveNeckDocument(document, {
        kind: 'params',
        params: { ...document.neck!.params, scaleBass: 650 },
      })!
    expect(document).not.toBeNull()
    const options = { ...DEFAULT_EXPORT_OPTIONS, parts: ids }
    const right = buildExportDrawing(document, options)
    const left = buildExportDrawing({ ...document, handedness: 'left' }, options)
    expect(right.parts).toHaveLength(7)
    let arcCount = 0,
      sampled = 0
    for (let i = 0; i < right.parts.length; i++) {
      const r = right.parts[i],
        l = left.parts[i]
      expect(l.id).toBe(r.id)
      expect(l.bounds.width).toBeCloseTo(r.bounds.width, 7)
      expect(l.bounds.height).toBeCloseTo(r.bounds.height, 7)
      expect(l.paths).toHaveLength(r.paths.length)
      const mirrored = (a: { x: number; y: number }, b: { x: number; y: number }) => {
        expect(a.x - r.bounds.minX + b.x - l.bounds.minX).toBeCloseTo(r.bounds.width, 7)
        expect(a.y - r.bounds.minY).toBeCloseTo(b.y - l.bounds.minY, 7)
      }
      for (let j = 0; j < r.paths.length; j++) {
        expect(l.paths[j].role).toBe(r.paths[j].role)
        expect(l.paths[j].segments).toHaveLength(r.paths[j].segments.length)
        for (let k = 0; k < r.paths[j].segments.length; k++) {
          const a = r.paths[j].segments[k],
            b = l.paths[j].segments[k]
          expect(b.type).toBe(a.type)
          for (const t of [0, 0.19, 0.5, 0.83, 1]) {
            mirrored(at(a, t), at(b, t))
            sampled++
          }
          if (a.type === 'circularArc') arcCount++
        }
      }
      expect(l.circles).toHaveLength(r.circles.length)
      for (let j = 0; j < r.circles.length; j++) {
        mirrored(r.circles[j].center, l.circles[j].center)
        expect(l.circles[j].radiusMm).toBe(r.circles[j].radiusMm)
      }
    }
    expect(sampled).toBeGreaterThan(500)
    expect(arcCount).toBeGreaterThan(0)
    expect(left.table!.texts.some((t) => t.text === 'Left-handed')).toBe(true)
    const numeric = (d: typeof left) => d.measurements.filter((m) => m.label !== 'Handedness')
    expect(numeric(left)).toEqual(numeric(right))
    expect(document.handedness).toBe('right')
  })
}
