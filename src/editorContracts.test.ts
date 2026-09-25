import { beforeEach, describe, expect, it } from 'vitest'
import {
  asCubic,
  bounds,
  cubicAt,
  deleteNodes,
  pathD,
  segmentPoints,
  splitSegment,
} from './geometry/outline'
import { createStarterDocument, MAX_BYTES, type OutlineNode } from './model/project'
import { parseProject, saveWithDialog, serializeProject } from './file/projectFile'
import { useAppStore } from './store'
const starter = () => createStarterDocument(),
  roundTrip = () =>
    expect(parseProject(serializeProject(useAppStore.getState().document))).toEqual(
      useAppStore.getState().document,
    )
describe('geometry and document contracts', () => {
  it('has a single all-cubic bodytemplate path and true cubic extrema', () => {
    const d = starter(),
      n = d.body.outline.nodes
    expect(n).toHaveLength(21)
    expect(n.every((v) => v.kind === 'corner' && v.outgoing === 'cubicBezier')).toBe(true)
    expect(pathD(n).match(/M /g) ?? []).toHaveLength(1)
    expect(pathD(n).endsWith(' Z')).toBe(true)
    expect(parseProject(serializeProject(d))).toEqual(d)
    const curve: OutlineNode[] = [
      {
        id: 'a',
        x: 0,
        y: 0,
        kind: 'corner',
        outgoing: 'cubicBezier',
        inHandle: null,
        outHandle: { dx: 0, dy: 100 },
      },
      {
        id: 'b',
        x: 100,
        y: 0,
        kind: 'corner',
        outgoing: 'line',
        inHandle: { dx: 0, dy: 100 },
        outHandle: null,
      },
      { id: 'c', x: 50, y: -10, kind: 'corner', outgoing: 'line', inHandle: null, outHandle: null },
    ]
    expect(bounds(curve).maxY).toBeCloseTo(75, 10)
  })
  it.each([1, 5, 20])(
    'de Casteljau preserves samples on segment %i including wraparound',
    (index) => {
      const n = starter().body.outline.nodes,
        s = segmentPoints(n, index),
        cut = 0.37,
        split = splitSegment(n, index, cut),
        left = segmentPoints(split, index),
        right = segmentPoints(split, index + 1)
      for (let k = 0; k <= 100; k++) {
        const t = k / 100,
          before = cubicAt(s.p0, s.p1, s.p2, s.p3, t),
          seg = t <= cut ? left : right,
          u = t <= cut ? t / cut : (t - cut) / (1 - cut),
          after = cubicAt(seg.p0, seg.p1, seg.p2, seg.p3, u)
        expect(after.x).toBeCloseTo(before.x, 8)
        expect(after.y).toBeCloseTo(before.y, 8)
      }
    },
  )
  it('line conversions create a valid cubic and reopen', () => {
    const n: OutlineNode[] = [
      { id: 'a', x: 0, y: 0, kind: 'corner', outgoing: 'line', inHandle: null, outHandle: null },
      {
        id: 'b',
        x: 100,
        y: 0,
        kind: 'corner',
        outgoing: 'cubicBezier',
        inHandle: { dx: -10, dy: 0 },
        outHandle: { dx: 10, dy: 0 },
      },
      {
        id: 'c',
        x: 0,
        y: 10,
        kind: 'corner',
        outgoing: 'cubicBezier',
        inHandle: { dx: 0, dy: 0 },
        outHandle: { dx: 0, dy: 0 },
      },
    ]
    const changed = asCubic(n, 0, true)
    expect(changed[0].outgoing).toBe('cubicBezier')
    expect(asCubic(changed, 0, false)[0].outgoing).toBe('line')
  })
  it('deleting free endpoints leaves valid connected geometry', () => {
    for (const i of [2, 3, 10]) {
      const d = starter(),
        original = d.body.outline.nodes
      d.body.outline.nodes = deleteNodes(original, new Set([original[i].id]))
      expect(d.body.outline.nodes).toHaveLength(20)
      expect(parseProject(serializeProject(d))).toEqual(d)
    }
  })
  it.each(['null', '[]', '{}', '{"format":"wrong"}'])('rejects malformed project %s', (json) =>
    expect(() => parseProject(json)).toThrow(),
  )
  it('rejects unsupported v1 and validates protected chains', () => {
    const legacy: any = structuredClone(starter())
    legacy.version = 1
    legacy.starter.version = 1
    delete legacy.body.neckJointBoundary
    expect(() => parseProject(JSON.stringify(legacy))).toThrow(
      'supported versions are 10, 11, 12, 13 and 14',
    )
    for (const mutate of [
      (d: any) => delete d.body.neckJointBoundary,
      (d: any) => (d.body.neckJointBoundary.anchorIds = ['starter-21', 'starter-03']),
      (d: any) => (d.body.neckJointBoundary.anchorIds = ['starter-21', 'starter-01', 'starter-01']),
      (d: any) => {
        d.body.neckJointBoundary.anchorIds = ['starter-21', 'starter-01', 'starter-02']
        d.body.outline.nodes[0].kind = 'smooth'
      },
    ]) {
      const d: any = starter()
      mutate(d)
      expect(() => parseProject(serializeProject(d))).toThrow()
    }
  })
  it('rejects structural errors and measures the UTF-8 byte limit', () => {
    const mutate = [
      (d: any) => (d.body.outline.closed = false),
      (d: any) => (d.version = 99),
      (d: any) => (d.units = 'in'),
      (d: any) => (d.starter.id = 'unknown'),
      (d: any) => (d.body.outline.nodes[1].kind = 'smooth'),
      (d: any) => (d.body.outline.nodes[0].x = 1e6 + 1),
      (d: any) => (d.body.outline.nodes[2].inHandle = null),
      (d: any) => (d.body.outline.nodes[1].id = d.body.outline.nodes[0].id),
    ]
    for (const fn of mutate) {
      const d = starter()
      fn(d)
      expect(() => parseProject(serializeProject(d))).toThrow()
    }
    const d = starter()
    d.name = 'ä'.repeat(MAX_BYTES / 2)
    expect(serializeProject(d).length).toBeLessThan(MAX_BYTES)
    expect(() => parseProject(serializeProject(d))).toThrow('2 MiB')
  })
})
describe('transaction and saving contracts', () => {
  beforeEach(() => useAppStore.getState().replace(starter()))
  it('ignores no-op drags, rejects nonfinite edits and preserves undo data', () => {
    let s = useAppStore.getState(),
      original = structuredClone(s.document),
      id = s.document.body.outline.nodes[2].id
    s.select(id)
    s.beginDrag('nodes')
    s.previewMove(0, 0)
    s.commit()
    expect(useAppStore.getState().history).toHaveLength(0)
    s = useAppStore.getState()
    s.beginDrag('nodes')
    s.previewMove(2e6, 0)
    s.commit()
    expect(useAppStore.getState().document).toEqual(original)
    s.beginDrag('handle')
    s.previewHandle(id, 'outHandle', NaN, 0)
    s.commit()
    roundTrip()
    s.beginDrag('handle')
    s.previewHandle(id, 'outHandle', 0, 0)
    s.commit()
    roundTrip()
    useAppStore.getState().undo()
    expect(useAppStore.getState().document).toEqual(original)
    useAppStore.getState().redo()
    roundTrip()
  })
  it('group drag skips protected anchors; view switch cancels and deletion cleans selection', () => {
    const s = useAppStore.getState(),
      nodes = s.document.body.outline.nodes,
      locked = s.document.body.neckJointBoundary!.anchorIds[0],
      ids = new Set([locked, nodes[3].id])
    s.setSelection(ids)
    s.beginDrag('nodes')
    s.previewMove(15, 8)
    s.commit()
    let state = useAppStore.getState()
    expect(state.document.body.outline.nodes.find((n) => n.id === locked)).toEqual(
      nodes.find((n) => n.id === locked),
    )
    expect(state.document.body.outline.nodes[3].x).toBe(nodes[3].x + 15)
    state.beginDrag('nodes')
    state.previewMove(100, 0)
    state.setView('back')
    expect(useAppStore.getState().preview).toBeNull()
    state.select(nodes[3].id)
    useAppStore.getState().deleteSelected()
    expect(useAppStore.getState().selected.size).toBe(0)
    roundTrip()
  })
  it('saved snapshot is baseline and cannot cross project generations', () => {
    const s = useAppStore.getState()
    s.select(s.document.body.outline.nodes[3].id)
    s.moveSelected(1, 0)
    const saved = structuredClone(useAppStore.getState().document),
      generation = useAppStore.getState().generation
    s.moveSelected(2, 0)
    useAppStore.getState().markSaved(saved, generation)
    expect(useAppStore.getState().dirty).toBe(true)
    useAppStore.getState().undo()
    expect(useAppStore.getState().dirty).toBe(false)
    useAppStore.getState().newProject()
    const fresh = useAppStore.getState().baseline
    useAppStore.getState().markSaved(saved, generation)
    expect(useAppStore.getState().baseline).toEqual(fresh)
  })
  it('failed or cancelled dialog never closes writer', async () => {
    const abort = new DOMException('cancel', 'AbortError')
    await expect(
      saveWithDialog({ showSaveFilePicker: () => Promise.reject(abort) }, starter(), 'oma'),
    ).rejects.toBe(abort)
    let closed = false
    await expect(
      saveWithDialog(
        {
          async showSaveFilePicker() {
            return {
              async createWritable() {
                return {
                  async write() {
                    throw new Error('disk full')
                  },
                  async close() {
                    closed = true
                  },
                }
              },
            }
          },
        },
        starter(),
        'oma',
      ),
    ).rejects.toThrow('disk full')
    expect(closed).toBe(false)
  })
})
