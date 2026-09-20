import { cubicAt, segmentPoints } from '../geometry/outline'
import { parseProject, serializeProject } from '../file/projectFile'
import { describe, expect, it } from 'vitest'
import { useAppStore } from '../store'
import {
  headstockGeometry,
  headstockFit,
  headstockWorldNodes,
  canonicalHeadstockPoint,
  splitHeadstockNodes,
} from './template'
import { DEFAULT_NECK } from '../neck/fretfactoryGeometry'
import { DEFAULT_NECK_END } from '../neck/neckDocument'
import { bassParams } from './bass'

const state = () => useAppStore.getState()

describe('bass headstock presets', () => {
  it('switches atomically to four strings while preserving tangent string paths', () => {
    state().setView('front')
    state().setEditingTarget('headstock')
    state().switchHeadstockTemplate('bass-4-inline')
    expect(state().message).toBeNull()
    let d = state().document,
      g = headstockGeometry(d)
    expect(d.version).toBe(12)
    expect(d.neck!.params.strings).toBe(4)
    expect(d.neck!.params.frets).toBe(21)
    expect(d.neck!.physicalProfile).toEqual({ nutWidthMm: 44.5, widthAt12thMm: 57.6 })
    expect(g!.strings.every((s) => s.angleDeg < 0.00001)).toBe(true)
    expect(g!.holes).toHaveLength(4)
    expect(headstockFit(d).supported).toBe(true)
  })
})
for (const [id, width, referenceWidth] of [
  ['bass-4-inline', 42, 57.6],
  ['bass-4-inline', 43.25, 57.6],
  ['bass-4-inline', 44.5, 57.6],
] as const) {
  it(id + ' exact tangents, physical widths and affine editing at nut ' + width, () => {
    state().newProject()
    state().setView('front')
    state().setEditingTarget('headstock')
    state().switchHeadstockTemplate(id)
    expect(state().message).toBeNull()
    state().configureNeck({ stringSpanNut: width - 6 })
    expect(state().message).toBeNull()
    const d = state().document,
      g = headstockGeometry(d)!,
      snap = d.neck!.snapshot
    expect(headstockFit(d).errors).toEqual([])
    expect(snap.nut.at(-1)!.x - snap.nut[0].x).toBeCloseTo(width, 9)
    const fret12 = snap.frets.find((f) => f.n === 12)!.points
    expect(fret12.at(-1)!.x - fret12[0].x).toBeCloseTo(referenceWidth, 9)
    expect(
      snap.rightSide.a * fret12[0].y +
        snap.rightSide.b -
        (snap.leftSide.a * fret12[0].y + snap.leftSide.b),
    ).toBeCloseTo(referenceWidth, 9)
    for (const s of g.strings) {
      const u = { x: s.S.x - s.B.x, y: s.S.y - s.B.y },
        v = { x: s.T!.x - s.S.x, y: s.T!.y - s.S.y }
      expect(
        Math.abs(u.x * v.y - u.y * v.x) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y)),
      ).toBeLessThan(1e-12)
      expect(u.x * v.x + u.y * v.y).toBeGreaterThan(0)
      expect(Math.hypot(s.C.x - s.T!.x, s.C.y - s.T!.y)).toBeCloseTo(7, 9)
    }
    g.holes
      .slice(1)
      .forEach((h, i) =>
        expect(Math.hypot(h.x - g.holes[i].x, h.y - g.holes[i].y)).toBeGreaterThanOrEqual(
          47.60075 - 1e-7,
        ),
      )
    const world = headstockWorldNodes(d),
      canonical = d.neck!.headstock.variants[id].nodes
    expect(canonical.filter((n) => n.outgoing === 'cubicBezier')).toHaveLength(6)
    for (let i = 1; i < world.length - 1; i++) {
      const p = canonicalHeadstockPoint(d, world[i])
      expect(p.x).toBeCloseTo(canonical[i].x, 9)
      expect(p.y).toBeCloseTo(canonical[i].y, 9)
    }
    const before = segmentPoints(world, 3),
      t = 0.37
    const changed = structuredClone(d)
    changed.neck!.headstock.variants[id].nodes = splitHeadstockNodes(d, canonical[3].id, t)
    const after = headstockWorldNodes(changed)
    for (let i = 0; i <= 20; i++) {
      const u = i / 20,
        p = cubicAt(before.p0, before.p1, before.p2, before.p3, u)
      const segment = segmentPoints(after, u <= t ? 3 : 4),
        local = u <= t ? u / t : (u - t) / (1 - t)
      const q = cubicAt(segment.p0, segment.p1, segment.p2, segment.p3, local)
      expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeLessThan(1e-7)
    }
    expect(parseProject(serializeProject(changed))).toEqual(changed)
    const saved = serializeProject(state().document)
    state().configureNeck({ strings: 5 })
    expect(state().message).toBeTruthy()
    expect(serializeProject(state().document)).toBe(saved)
  })
}

describe('bass template transitions and persistence policy', () => {
  it('resets bass presets atomically, keeps a same-template selection inert, and restores guitar defaults', () => {
    state().newProject()
    state().setView('front')
    state().setEditingTarget('headstock')
    state().switchHeadstockTemplate('bass-4-inline')
    state().configureNeck({ stringSpanNut: 37 })
    expect(state().message).toBeNull()
    const editedBass4 = structuredClone(state().document)
    const historyBeforeNoop = state().history.length
    state().switchHeadstockTemplate('bass-4-inline')
    expect(state().document).toEqual(editedBass4)
    expect(state().history).toHaveLength(historyBeforeNoop)
    state().switchHeadstockTemplate('inline')
    expect(state().document.neck!.params).toEqual(DEFAULT_NECK)
    expect(state().document.neck!.placement).toEqual({ joinFret: 17, offsetMm: 0 })
    expect(state().document.neck!.end).toEqual(DEFAULT_NECK_END)
    expect(state().document.neck!.physicalProfile).toBeNull()
    expect(() => bassParams('bass-5-inline' as never)).toThrow('Unknown bass headstock design')
  })

  it('rejects locked bass geometry and a missing or mismatched physical profile without changing the document', () => {
    state().newProject()
    state().setView('front')
    state().setEditingTarget('headstock')
    state().switchHeadstockTemplate('bass-4-inline')
    const saved = serializeProject(state().document)
    state().configureNeck({ strings: 5 })
    expect(state().message).toContain('locks string count')
    expect(serializeProject(state().document)).toBe(saved)
    const missingProfile = JSON.parse(saved)
    delete missingProfile.neck.physicalProfile
    expect(() => parseProject(JSON.stringify(missingProfile))).toThrow(
      'physical neck profile is required',
    )
    const wrongProfile = JSON.parse(saved)
    wrongProfile.neck.physicalProfile.widthAt12thMm += 1
    expect(() => parseProject(JSON.stringify(wrongProfile))).toThrow()
    const guitarWithBassProfile = JSON.parse(serializeProject(state().document))
    guitarWithBassProfile.neck.headstock.activeTemplateId = 'inline'
    expect(() => parseProject(JSON.stringify(guitarWithBassProfile))).toThrow()
  })
})
