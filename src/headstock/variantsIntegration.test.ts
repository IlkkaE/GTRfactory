import { beforeEach, it, expect } from 'vitest'
import { useAppStore } from '../store'
import {
  activeHeadstockNodes,
  headstockWorldNodes,
  isProtectedHeadstockNode,
  canSplitHeadstockSegment,
  splitHeadstockNodes,
  headstockFit,
  headstockGeometry,
  validateHeadstock,
  type HeadstockTemplateId,
} from './template'
import { segmentPoint } from '../editor/segmentSelection'
import { parseProject, serializeProject } from '../file/projectFile'
const state = () => useAppStore.getState()
const model = (id: HeadstockTemplateId) => {
  state().setEditingTarget('headstock')
  state().switchHeadstockTemplate(id)
  expect(state().message).toBeNull()
  expect(state().document.neck!.headstock.activeTemplateId).toBe(id)
}
beforeEach(() => state().newProject())
it.each(['inline', 'three-three-2', 'three-three-3'] as const)(
  'inserts on every free %s segment without moving the rendered curve',
  (id) => {
    model(id)
    const source = structuredClone(state().document),
      before = headstockWorldNodes(source)
    for (const n of activeHeadstockNodes(source).filter((n) =>
      canSplitHeadstockSegment(source, n.id),
    )) {
      const d = structuredClone(source),
        i = before.findIndex((v) => v.id === n.id),
        h = d.neck!.headstock,
        t = 0.37
      h.variants[h.activeTemplateId].nodes = splitHeadstockNodes(d, n.id, t)
      expect(() => validateHeadstock(d, h), n.id).not.toThrow()
      const after = headstockWorldNodes(d)
      for (let j = 0; j <= 40; j++) {
        const u = j / 40,
          expected = segmentPoint(before, i, u),
          actual =
            u <= t ? segmentPoint(after, i, u / t) : segmentPoint(after, i + 1, (u - t) / (1 - t))
        expect(actual.x, `${n.id} x ${u}`).toBeCloseTo(expected.x, 8)
        expect(actual.y, `${n.id} y ${u}`).toBeCloseTo(expected.y, 8)
      }
    }
  },
)
it.each(['inline', 'three-three-2', 'three-three-3'] as const)(
  '%s add/delete/history and reopen preserve all model data',
  (id) => {
    model(id)
    const original = structuredClone(state().document),
      history = state().history.length
    const segment = activeHeadstockNodes(original).find((n) =>
      canSplitHeadstockSegment(original, n.id),
    )!
    state().selectHeadstockSegment(segment.id, 0.5)
    state().addHeadstockPoint()
    expect(state().message).toBeNull()
    expect(activeHeadstockNodes(state().document)).toHaveLength(10)
    expect(state().history).toHaveLength(history + 1)
    const added = structuredClone(state().document)
    state().undo()
    expect(state().document).toEqual(original)
    expect(state().selectedHeadstock.size).toBe(0)
    state().redo()
    expect(state().document).toEqual(added)
    const newId = activeHeadstockNodes(added).find(
      (n) => !activeHeadstockNodes(original).some((v) => v.id === n.id),
    )!.id
    state().selectHeadstock(newId)
    state().deleteHeadstockSelected()
    expect(state().message).toBeNull()
    expect(activeHeadstockNodes(state().document)).toHaveLength(9)
    expect(parseProject(serializeProject(state().document))).toEqual(state().document)
    state().undo()
    expect(state().document).toEqual(added)
  },
)
it('keeps each model edit when switching and restores selection safely through history', () => {
  model('three-three-2')
  const id = 'three-three-2-node-4'
  state().selectHeadstock(id)
  const world = headstockWorldNodes(state().document).find((n) => n.id === id)!
  state().setHeadstockCoordinate('y', world.y - 0.5)
  expect(state().message).toBeNull()
  const edited = structuredClone(state().document.neck!.headstock.variants['three-three-2'])
  model('three-three-3')
  expect(state().selectedHeadstock.size).toBe(0)
  model('inline')
  model('three-three-2')
  expect(state().document.neck!.headstock.variants['three-three-2']).toEqual(edited)
  state().undo()
  expect(state().document.neck!.headstock.activeTemplateId).toBe('inline')
  state().redo()
  expect(state().document.neck!.headstock.variants['three-three-2']).toEqual(edited)
})
it.each([7, 8])(
  'a %i-string neck draft falls back atomically and preserves six-string variants',
  (strings) => {
    model('three-three-3')
    const before = structuredClone(state().document),
      neck = before.neck!,
      change = {
        params: {
          ...neck.params,
          strings,
          stringSpanNut: (strings - 1) * 7,
          stringSpanBridge: (strings - 1) * 10.5,
        },
        end: neck.end,
        placement: neck.placement,
      }
    state().startNeckDraft()
    state().previewWholeNeck(change)
    expect(state().neckDraft!.error).toBeNull()
    expect(state().preview!.neck!.headstock.activeTemplateId).toBe('inline')
    expect(state().document).toEqual(before)
    state().cancelNeckDraft()
    expect(state().document).toEqual(before)
    state().startNeckDraft()
    state().previewWholeNeck(change)
    state().applyNeckDraft()
    expect(state().message).toBeNull()
    expect(state().document.neck!.headstock.activeTemplateId).toBe('inline')
    expect(state().document.neck!.headstock.variants).toEqual(neck.headstock.variants)
    state().undo()
    expect(state().document).toEqual(before)
    state().redo()
    state().configureWholeNeck({ params: neck.params, end: neck.end, placement: neck.placement })
    expect(state().document.neck!.headstock.activeTemplateId).toBe('inline')
    model('three-three-3')
    expect(state().document.neck!.headstock).toEqual(neck.headstock)
  },
)
it('rejects protected, all-free and invalid-position operations without a history step', () => {
  model('three-three-2')
  const before = structuredClone(state().document),
    history = state().history.length
  state().selectHeadstock('three-three-2-node-2')
  state().deleteHeadstockSelected()
  expect(state().message).toBeTruthy()
  expect(state().document).toEqual(before)
  state().selectHeadstockSegment('headstock-seam-left')
  state().addHeadstockPoint()
  expect(state().document).toEqual(before)
  const ids = activeHeadstockNodes(before)
    .filter((n) => !isProtectedHeadstockNode(n.id, before.neck!.headstock))
    .map((n) => n.id)
  ids.forEach((id, i) => state().selectHeadstock(id, i > 0))
  state().deleteHeadstockSelected()
  expect(state().message).toBeTruthy()
  expect(state().document).toEqual(before)
  state().selectHeadstockSegment('three-three-2-node-3', 0)
  state().addHeadstockPoint()
  expect(state().document).toEqual(before)
  expect(state().history).toHaveLength(history)
})
it('validates inactive model protection and rejects unsupported versions before replacing current work', () => {
  const before = structuredClone(state().document)
  for (const mutate of [
    (d: any) => {
      d.version = 7
    },
    (d: any) => {
      d.neck.headstock.activeTemplateId = 'unknown'
    },
    (d: any) => {
      d.neck.headstock.variants.extra = d.neck.headstock.variants.inline
    },
    (d: any) => {
      delete d.neck.headstock.variants['three-three-3']
    },
    (d: any) => {
      d.neck.headstock.variants['three-three-2'].nodes[1].x += 1
    },
    (d: any) => {
      const n = d.neck.headstock.variants['three-three-2'].nodes
      ;[n[0], n[1]] = [n[1], n[0]]
    },
    (d: any) => {
      const n = d.neck.headstock.variants['three-three-2'].nodes
      n[3].id = n[4].id
    },
    (d: any) => {
      d.neck.headstock.variants['three-three-3'].nodes[2].inHandle.dx += 1
    },
    (d: any) => {
      d.neck.headstock.variants['three-three-3'].nodes = d.neck.headstock.variants[
        'three-three-3'
      ].nodes.filter((n: any, i: number) => i < 3 || i > 5)
    },
  ]) {
    const d = structuredClone(before)
    mutate(d)
    expect(() => state().replace(d)).toThrow()
    expect(state().document).toEqual(before)
  }
})
it.each([
  ['three-three-2', 5.2289179772113155],
  ['three-three-3', 6.945417391377877],
] as const)('retains measured nominal fit and tangent branches for %s', (id, angle) => {
  model(id)
  const g = headstockGeometry(state().document)!,
    f = headstockFit(state().document)
  expect(f.valid).toBe(true)
  expect(g.maxAngleDeg).toBeCloseTo(angle, 6)
  expect(g.holes).toHaveLength(6)
  expect(g.units.map((u) => u.branch)).toEqual([1, 1, 1, -1, -1, -1])
  expect(g.strings.map((v) => v.stringIndex)).toEqual([0, 1, 2, 3, 4, 5])
})
it('3+3 boundary positions stay fixed while the free-side handle and added smooth handles remain editable', () => {
  model('three-three-2')
  const id = 'three-three-2-node-2',
    before = structuredClone(state().document),
    start = headstockWorldNodes(before).find((n) => n.id === id)!
  state().selectHeadstock(id)
  state().beginDrag('headstockHandle')
  state().previewHeadstockHandle(id, 'outHandle', 0.1, 0)
  state().commit()
  expect(state().message).toBeNull()
  const after = headstockWorldNodes(state().document).find((n) => n.id === id)!
  expect(after.x).toBe(start.x)
  expect(after.y).toBe(start.y)
  expect(after.inHandle).toEqual(start.inHandle)
  expect(after.outHandle!.dx).toBeCloseTo(start.outHandle!.dx + 0.1, 9)
  state().selectHeadstockSegment(id, 0.5)
  state().addHeadstockPoint()
  expect(state().message).toBeNull()
  const added = [...state().selectedHeadstock][0],
    old = headstockWorldNodes(state().document).find((n) => n.id === added)!
  state().beginDrag('headstockHandle')
  state().previewHeadstockHandle(added, 'outHandle', 0.1, 0)
  state().commit()
  expect(state().message).toBeNull()
  const changed = headstockWorldNodes(state().document).find((n) => n.id === added)!
  expect(changed.outHandle!.dx).toBeCloseTo(old.outHandle!.dx + 0.1, 9)
  expect(changed.kind).toBe('smooth')
  expect(parseProject(serializeProject(state().document))).toEqual(state().document)
})
