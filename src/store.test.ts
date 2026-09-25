import { beforeEach, describe, expect, it } from 'vitest'
import { createStarterDocument } from './model/project'
import { parseProject, serializeProject } from './file/projectFile'
import { useAppStore } from './store'
import { segmentPoint } from './editor/segmentSelection'
import {
  firstPickupPosition,
  pickupDefaults,
  pickupPlacementError,
  pickupProfile,
} from './pickup/profiles'
describe('editor store transactions', () => {
  beforeEach(() => useAppStore.getState().replace(createStarterDocument()))
  it('commits a free-node drag and restores dirty after undo', () => {
    const st = useAppStore.getState(),
      id = st.document.body.outline.nodes[2].id
    st.select(id)
    st.beginDrag('nodes')
    st.previewMove(8, 0)
    st.cancel()
    expect(useAppStore.getState().document.body.outline.nodes[2].x).toBe(
      st.document.body.outline.nodes[2].x,
    )
    useAppStore.getState().beginDrag('nodes')
    useAppStore.getState().previewMove(8, 0)
    useAppStore.getState().commit()
    expect(useAppStore.getState().history).toHaveLength(1)
    expect(useAppStore.getState().dirty).toBe(true)
    useAppStore.getState().undo()
    expect(useAppStore.getState().dirty).toBe(false)
    useAppStore.getState().redo()
    expect(useAppStore.getState().dirty).toBe(true)
  })
  it('keeps protected anchors and their boundary handles unchanged while moving free selection', () => {
    const st = useAppStore.getState(),
      d = st.document,
      locked = d.body.neckJointBoundary!.anchorIds,
      free = d.body.outline.nodes[2].id,
      before = structuredClone(d)
    st.setSelection(new Set([...locked, free]))
    st.moveSelected(8, 4)
    const after = useAppStore.getState().document
    for (const id of locked)
      expect(after.body.outline.nodes.find((n) => n.id === id)).toEqual(
        before.body.outline.nodes.find((n) => n.id === id),
      )
    expect(after.body.outline.nodes.find((n) => n.id === free)!.x).toBe(
      before.body.outline.nodes.find((n) => n.id === free)!.x + 8,
    )
    st.select(locked[0])
    st.beginDrag('handle')
    st.previewHandle(locked[0], 'outHandle', 5, 5)
    st.commit()
    expect(
      useAppStore.getState().document.body.outline.nodes.find((n) => n.id === locked[0]),
    ).toEqual(after.body.outline.nodes.find((n) => n.id === locked[0]))
  })
  it('does not dirty history for view and unit state', () => {
    const st = useAppStore.getState()
    st.setView('back')
    st.setUnit('in')
    st.setCamera('back', { zoom: 2 })
    expect(useAppStore.getState().dirty).toBe(false)
    expect(useAppStore.getState().history).toHaveLength(0)
  })
  it('creates an automatic neck pocket atomically while preserving the fixed centre and free handles', () => {
    const st = useAppStore.getState(),
      datum = st.document.body.neckJointBoundary!.anchorIds[1],
      before = structuredClone(st.document.body.outline.nodes.find((n) => n.id === datum)!)
    st.createNeck()
    const after = useAppStore.getState().document
    expect(after.version).toBe(14)
    expect(after.neck?.end.radiusMm, useAppStore.getState().message ?? 'ei virhettä').toBe(6)
    expect(after.body.outline.nodes.find((n) => n.id === datum)?.x).toBe(before.x)
    expect(parseProject(serializeProject(after))).toEqual(after)
    const bad = structuredClone(after)
    bad.body.outline.nodes.find((n) => n.id === datum)!.x += 1
    expect(() => parseProject(serializeProject(bad))).toThrow('joint')
    useAppStore.getState().undo()
    expect(useAppStore.getState().document.neck).toBeNull()
  })
  it('preserves the free left body segment when a tasku radius changes', () => {
    const st = useAppStore.getState(),
      left = st.document.body.neckJointBoundary!.anchorIds[2]
    st.selectSegment(left)
    st.setSegmentCubic(false)
    expect(
      useAppStore.getState().document.body.outline.nodes.find((n) => n.id === left)?.outgoing,
    ).toBe('line')
    st.configureNeckPocket({
      mouthWidthMm: 56,
      heelWidthMm: 56,
      lengthMm: 76,
      fitAllowanceMm: 0,
      radiusMm: 6,
    })
    st.configureNeckPocket({
      mouthWidthMm: 56,
      heelWidthMm: 56,
      lengthMm: 76,
      fitAllowanceMm: 0,
      radiusMm: 8,
    })
    const after = useAppStore.getState().document
    expect(after.body.outline.nodes.find((n) => n.id === left)?.outgoing).toBe('line')
    expect(parseProject(serializeProject(after))).toEqual(after)
  })
})
it('does not mix node and handle transactions or edit an unselected handle', () => {
  const st = useAppStore.getState()
  st.replace(createStarterDocument())
  const original = useAppStore.getState().document,
    ids = original.body.outline.nodes.map((n) => n.id)
  st.setSelection(new Set([ids[2]]))
  st.beginDrag('nodes')
  st.previewHandle(ids[3], 'outHandle', 12, 13)
  st.commit()
  expect(useAppStore.getState().document).toEqual(original)
  st.beginDrag('handle')
  st.previewMove(10, 10)
  st.previewHandle(ids[3], 'outHandle', 12, 13)
  st.commit()
  expect(useAppStore.getState().document).toEqual(original)
})

describe('neck draft transaction', () => {
  beforeEach(() => useAppStore.getState().newProject())
  it('keeps a valid preview out of history until one apply, then undo restores it', () => {
    const st = useAppStore.getState(),
      original = structuredClone(st.document)
    expect(original.neck?.params.scaleTreble).toBe(647.7)
    expect(original.neck?.params.frets).toBe(22)
    st.startNeckDraft()
    const draft = useAppStore.getState().neckDraft!
    const change = { ...draft.change, params: { ...draft.change.params, scaleBass: 660.4 } }
    st.previewWholeNeck(change)
    expect(useAppStore.getState().document).toEqual(original)
    expect(useAppStore.getState().history).toHaveLength(0)
    expect(useAppStore.getState().preview?.neck?.params.scaleBass).toBe(660.4)
    st.applyNeckDraft()
    expect(useAppStore.getState().history).toHaveLength(1)
    expect(useAppStore.getState().document.neck?.params.scaleBass).toBe(660.4)
    useAppStore.getState().undo()
    expect(useAppStore.getState().document).toEqual(original)
  })
  it('preserves last valid draft preview on an invalid change and blocks body drag', () => {
    const st = useAppStore.getState()
    st.startNeckDraft()
    const draft = useAppStore.getState().neckDraft!
    st.previewWholeNeck({ ...draft.change, params: { ...draft.change.params, scaleBass: 660.4 } })
    const valid = useAppStore.getState().preview
    st.previewWholeNeck({ ...draft.change, params: { ...draft.change.params, frets: 0 } })
    expect(useAppStore.getState().preview).toEqual(valid)
    expect(useAppStore.getState().neckDraft?.error).toContain('number of strings or frets')
    st.beginDrag('nodes')
    expect(useAppStore.getState().drag).toBeNull()
    st.cancelNeckDraft()
    expect(useAppStore.getState().preview).toBeNull()
  })
})
describe('unified editor draft boundaries', () => {
  beforeEach(() => useAppStore.getState().newProject())
  it('starts clean with 25.5 inch and 22 frets; clean accept adds no history and revisions never rewind', () => {
    const st = useAppStore.getState()
    expect(st.document.neck?.params).toMatchObject({
      scaleTreble: 647.7,
      scaleBass: 647.7,
      frets: 22,
    })
    expect(st.document).toEqual(st.baseline)
    expect(st.dirty).toBe(false)
    const a = st.neckDraftRevision
    st.startNeckDraft()
    expect(useAppStore.getState().neckDraft?.pending).toBe(false)
    const b = useAppStore.getState().neckDraftRevision
    expect(b).toBeGreaterThan(a)
    st.cancelNeckDraft()
    st.startNeckDraft()
    expect(useAppStore.getState().neckDraftRevision).toBeGreaterThan(b)
    st.applyNeckDraft()
    expect(useAppStore.getState().neckDraft).toBeNull()
    expect(useAppStore.getState().history).toHaveLength(0)
  })
  it('blocks all body mutation and undo during a draft, preserves it across cancel and view changes, rejects invalid accept', () => {
    const st = useAppStore.getState(),
      before = structuredClone(st.document),
      rev = st.revision
    st.startNeckDraft()
    const change = useAppStore.getState().neckDraft!.change
    st.previewWholeNeck({ ...change, params: { ...change.params, scaleBass: 660.4 } })
    const valid = structuredClone(useAppStore.getState().preview)
    st.select(before.body.outline.nodes[3].id)
    st.moveSelected(4, 4)
    st.setCoordinate('x', 42)
    st.deleteSelected()
    st.setKind('smooth')
    st.rename('must not change')
    st.undo()
    st.redo()
    st.cancel()
    st.setView('pocket')
    expect(useAppStore.getState().document).toEqual(before)
    expect(useAppStore.getState().preview).toEqual(valid)
    expect(useAppStore.getState().revision).toBe(rev)
    expect(useAppStore.getState().history).toHaveLength(0)
    expect(useAppStore.getState().dirty).toBe(false)
    st.invalidateNeckDraft('empty field')
    st.applyNeckDraft()
    expect(useAppStore.getState().document).toEqual(before)
    expect(useAppStore.getState().neckDraft?.error).toBe('empty field')
    st.cancelNeckDraft()
    expect(useAppStore.getState().preview).toBeNull()
  })
  it('recomputes each preview from the accepted document and closes a clean pane on view selection', () => {
    const st = useAppStore.getState()
    st.startNeckDraft()
    const original = useAppStore.getState().neckDraft!.change
    st.previewWholeNeck({ ...original, params: { ...original.params, scaleBass: 660.4 } })
    const once = structuredClone(useAppStore.getState().preview)
    st.previewWholeNeck({ ...original, params: { ...original.params, scaleBass: 670 } })
    st.previewWholeNeck({ ...original, params: { ...original.params, scaleBass: 660.4 } })
    expect(useAppStore.getState().preview).toEqual(once)
    st.previewWholeNeck(original)
    expect(useAppStore.getState().neckDraft?.pending).toBe(false)
    st.setView('front')
    expect(useAppStore.getState().neckDraft).toBeNull()
    expect(useAppStore.getState().preview).toBeNull()
  })
})

describe('context selection lifecycle', () => {
  beforeEach(() => useAppStore.getState().newProject())
  it('uses the selected t once and undoes and redoes the exact split', () => {
    const s = useAppStore.getState(),
      before = structuredClone(s.document),
      nodes = before.body.outline.nodes,
      id = nodes[2].id
    s.selectSegment(id, 0.23)
    expect(useAppStore.getState().dirty).toBe(false)
    s.addPoint()
    const after = useAppStore.getState(),
      added = after.document.body.outline.nodes[3]
    expect(after.document.body.outline.nodes).toHaveLength(nodes.length + 1)
    expect(after.selected.has(added.id)).toBe(true)
    expect({ x: added.x, y: added.y }).toEqual(segmentPoint(nodes, 2, 0.23))
    expect(after.selectedSegmentT).toBeNull()
    expect(after.history).toHaveLength(1)
    const result = structuredClone(after.document)
    s.undo()
    expect(useAppStore.getState().document).toEqual(before)
    expect(useAppStore.getState().selectedSegmentT).toBeNull()
    s.redo()
    expect(useAppStore.getState().document).toEqual(result)
    expect(useAppStore.getState().selectedSegmentT).toBeNull()
  })
  it('keeps t coherent across conversion, selection clearing, neck opening and project replacement', () => {
    const s = useAppStore.getState(),
      id = s.document.body.outline.nodes[2].id
    s.selectSegment(id, 0.2)
    s.setSegmentCubic(false)
    expect(useAppStore.getState().selectedSegmentT).toBe(0.2)
    s.select(id)
    expect(useAppStore.getState().selectedSegmentT).toBeNull()
    s.selectSegment(id, 0.7)
    s.setSelection(new Set())
    expect(useAppStore.getState().selectedSegmentT).toBeNull()
    s.selectSegment(id, 0.3)
    s.startNeckDraft()
    expect(useAppStore.getState().selectedSegmentT).toBeNull()
    s.cancelNeckDraft()
    s.selectSegment(id, 0.3)
    s.replace(createStarterDocument())
    expect(useAppStore.getState().selectedSegmentT).toBeNull()
  })
  it('rejects endpoint insertion without changing the document or history', () => {
    const s = useAppStore.getState(),
      original = structuredClone(s.document),
      id = s.document.body.outline.nodes[2].id
    for (const t of [0, 1]) {
      s.selectSegment(id, t)
      s.addPoint()
      expect(useAppStore.getState().document).toEqual(original)
      expect(useAppStore.getState().history).toHaveLength(0)
    }
  })
})

describe('body outline reset', () => {
  beforeEach(() => useAppStore.getState().newProject())
  it('restores only the outline, then undoes and redoes the exact transition', () => {
    const s = useAppStore.getState(),
      before = structuredClone(s.document),
      free = before.body.outline.nodes[4].id
    s.select(free)
    s.moveSelected(12, -8)
    const changed = structuredClone(useAppStore.getState().document)
    s.resetBodyOutline()
    const reset = structuredClone(useAppStore.getState().document)
    expect(reset.body.outline.nodes).toEqual(before.body.outline.nodes)
    expect(reset.name).toBe(changed.name)
    expect(reset.neck).toEqual(changed.neck)
    expect(reset.pickupCavities).toEqual(changed.pickupCavities)
    expect(reset.body.rearElectronicsCavity).toEqual(changed.body.rearElectronicsCavity)
    expect(useAppStore.getState().selected.size).toBe(0)
    s.undo()
    expect(useAppStore.getState().document).toEqual(changed)
    s.redo()
    expect(useAppStore.getState().document).toEqual(reset)
  })
  it('keeps a neckless project without a joint neckless after reset', () => {
    const s = useAppStore.getState(),
      project = structuredClone(s.document)
    project.neck = null
    project.body.neckJointBoundary = null
    project.body.neckPocket = null
    project.pickupCavities = []
    s.replace(project)
    s.select(project.body.outline.nodes[4].id)
    s.moveSelected(2, 2)
    s.resetBodyOutline()
    expect(useAppStore.getState().document.body.neckJointBoundary).toBeNull()
    expect(useAppStore.getState().document.neck).toBeNull()
  })
  it('does not create history for an already original outline', () => {
    const s = useAppStore.getState()
    s.resetBodyOutline()
    expect(useAppStore.getState().history).toHaveLength(0)
  })
  it('preserves a changed neck and headstock while restoring the starter outline', () => {
    const s = useAppStore.getState()
    s.startNeckDraft()
    const change = useAppStore.getState().neckDraft!.change
    s.previewWholeNeck({
      ...change,
      params: { ...change.params, scaleBass: 660.4 },
      placement: { ...change.placement, joinFret: 16 },
    })
    s.applyNeckDraft()
    s.setEditingTarget('headstock')
    s.switchHeadstockTemplate('three-three-2')
    const neck = structuredClone(useAppStore.getState().document.neck),
      expectedOutline = structuredClone(useAppStore.getState().document.body.outline.nodes),
      id = useAppStore.getState().document.body.outline.nodes[4].id
    s.setEditingTarget('body')
    s.select(id)
    s.moveSelected(7, 3)
    expect(useAppStore.getState().document.body.outline.nodes).not.toEqual(expectedOutline)
    const historyBeforeReset = useAppStore.getState().history.length
    s.resetBodyOutline()
    expect(useAppStore.getState().document.neck).toEqual(neck)
    expect(useAppStore.getState().document.body.outline.nodes).toEqual(expectedOutline)
    expect(useAppStore.getState().history).toHaveLength(historyBeforeReset + 1)
  })
  it('reapplies a neckless manual pocket to the original outline', () => {
    const s = useAppStore.getState(),
      neckless = structuredClone(s.document)
    neckless.neck = null
    neckless.pickupCavities = []
    s.replace(neckless)
    s.configureNeckPocket({
      mouthWidthMm: 57,
      heelWidthMm: 60,
      lengthMm: 90,
      fitAllowanceMm: 0.1,
      radiusMm: 4,
    })
    const pocket = structuredClone(useAppStore.getState().document.body.neckPocket)
    expect(pocket).not.toBeNull()
    const original = structuredClone(useAppStore.getState().document.body.outline.nodes)
    s.select(useAppStore.getState().document.body.outline.nodes[4].id)
    s.moveSelected(7, 3)
    s.resetBodyOutline()
    expect(useAppStore.getState().document.body.neckPocket).toEqual(pocket)
    expect(useAppStore.getState().document.body.outline.nodes).toEqual(original)
    expect(useAppStore.getState().message).toBeNull()
  })
  it('rejects a reset atomically when a valid expanded-body pickup would no longer fit', () => {
    const s = useAppStore.getState(),
      withoutPickup = structuredClone(s.document)
    withoutPickup.pickupCavities = []
    s.replace(withoutPickup)
    s.configureNeckPlacement({ offsetMm: 200 })
    const expanded = structuredClone(useAppStore.getState().document)
    expanded.body.outline.nodes = expanded.body.outline.nodes.map((node) =>
      node.y >= 158 ? { ...node, y: node.y + 200 } : node,
    )
    const centerYmm = firstPickupPosition(expanded, 'sh12-humbucker', 1, 50)
    expect(centerYmm).not.toBeNull()
    expanded.pickupCavities = [
      {
        id: 'expanded-body-pickup',
        profileId: 'sh12-humbucker',
        profileVersion: 1,
        centerYmm: centerYmm!,
        ...pickupDefaults(pickupProfile('sh12-humbucker', 1)!),
      },
    ]
    expect(parseProject(serializeProject(expanded))).toEqual(expanded)
    expect(
      pickupPlacementError(expanded, expanded.pickupCavities[0], expanded.pickupCavities[0].id),
    ).toBeNull()
    s.replace(expanded)
    const invalid = structuredClone(useAppStore.getState().document)
    s.resetBodyOutline()
    expect(useAppStore.getState().document).toEqual(invalid)
    expect(useAppStore.getState().history).toHaveLength(0)
    expect(useAppStore.getState().message).toContain('pickup cavity')
  })
  it('does not disturb an active drag or neck draft', () => {
    const s = useAppStore.getState(),
      id = s.document.body.outline.nodes[4].id
    s.select(id)
    s.beginDrag('nodes')
    s.previewMove(4, 4)
    const preview = useAppStore.getState().preview
    s.resetBodyOutline()
    expect(useAppStore.getState().preview).toBe(preview)
    expect(useAppStore.getState().drag).not.toBeNull()
    s.cancel()
    s.startNeckDraft()
    const draft = useAppStore.getState().neckDraft
    s.resetBodyOutline()
    expect(useAppStore.getState().neckDraft).toBe(draft)
  })
})

it('changes handedness as one undoable canonical document transition', () => {
  useAppStore.getState().newProject()
  const before = structuredClone(useAppStore.getState().document)
  useAppStore.getState().setHandedness('left')
  expect(useAppStore.getState().document).toMatchObject({ handedness: 'left' })
  expect(useAppStore.getState().document.body.outline.nodes).toEqual(before.body.outline.nodes)
  useAppStore.getState().undo()
  expect(useAppStore.getState().document).toEqual(before)
})

it('guards handedness during draft and drag, and retains it through instrument changes', () => {
  const state = () => useAppStore.getState()
  state().newProject()
  state().setHandedness('left')
  const left = structuredClone(state().document)
  expect(state().history).toHaveLength(1)
  state().redo()
  expect(state().document).toEqual(left)
  state().startNeckDraft()
  const draft = state().neckDraft
  state().setHandedness('right')
  expect(state().neckDraft).toBe(draft)
  expect(state().document).toEqual(left)
  state().cancelNeckDraft()
  state().select(state().document.body.outline.nodes[4].id)
  state().beginDrag('nodes')
  state().previewMove(1, 0)
  const preview = state().preview
  state().setHandedness('right')
  expect(state().preview).toBe(preview)
  expect(state().document.handedness).toBe('left')
  state().cancel()
  state().setView('front')
  state().setEditingTarget('headstock')
  state().switchHeadstockTemplate('bass-4-inline')
  expect(state().message).toBeNull()
  expect(state().document.handedness).toBe('left')
  state().switchHeadstockTemplate('inline')
  expect(state().document.handedness).toBe('left')
  state().resetBodyOutline()
  expect(state().document.handedness).toBe('left')
  state().newProject()
  expect(state().document.handedness).toBe('right')
})
