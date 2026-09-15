import { beforeEach, describe, expect, it } from 'vitest'
import { createStarterDocument, type ProjectDocument } from '../model/project'
import { deriveNeckDocument } from '../neck/neckDocument'
import type { EditorState } from '../store'
import {
  cancelDocumentTransition,
  commitDocumentTransition,
  documentsEqual,
  redoDocumentTransition,
  undoDocumentTransition,
  type TransactionState,
} from './documentTransactions'

const transactionState = (document: ProjectDocument): TransactionState => ({
  document,
  baseline: structuredClone(document),
  neckDraft: null,
  history: [],
  future: [],
  selected: new Set(),
  selectedHeadstock: new Set(),
  editingTarget: 'body',
  selectedPickupId: null,
  selectedRearElectronicsCavity: false,
  selectedSegment: null,
  selectedSegmentT: null,
  activeView: 'front',
  drag: null,
  revision: 4,
})

describe('document transactions', () => {
  let initial: ProjectDocument

  beforeEach(() => {
    initial = createStarterDocument()
  })

  it('makes no-op and invalid acceptance patches without advancing history', () => {
    const state = transactionState(initial)
    expect(documentsEqual(initial, structuredClone(initial))).toBe(true)
    expect(commitDocumentTransition(state, structuredClone(initial))).toEqual({
      preview: null,
      drag: null,
      message: null,
    })

    const invalid = structuredClone(initial)
    invalid.body.outline.nodes[0].x = Number.NaN
    const patch = commitDocumentTransition(state, invalid)
    expect(patch).toMatchObject({ preview: null, drag: null })
    expect(patch.message).toBeTruthy()
    expect(Object.keys(patch).sort()).toEqual(['drag', 'message', 'preview'])
  })

  it('commits cloned history and clears stale selections', () => {
    const state = transactionState(initial)
    const retained = initial.body.outline.nodes[0].id
    state.selected = new Set([retained, 'missing'])
    state.selectedSegment = 'missing'
    state.selectedSegmentT = 0.23
    const next = structuredClone(initial)
    next.name = 'Uusi nimi'

    const patch = commitDocumentTransition(state, next)
    expect(patch.document).toBe(next)
    expect(patch.history).toHaveLength(1)
    expect(patch.history![0]).toEqual(initial)
    expect(patch.history![0]).not.toBe(initial)
    expect(patch.future).toEqual([])
    expect(patch.selected).toEqual(new Set([retained]))
    expect(patch.selectedSegment).toBeNull()
    expect(patch.selectedSegmentT).toBeNull()
    expect(patch.dirty).toBe(true)
    expect(patch.revision).toBe(5)
  })

  it('keeps draft guard ahead of drag and restores a draft preview on cancel', () => {
    const state = transactionState(initial)
    state.drag = {
      before: structuredClone(initial),
      kind: 'nodes',
      ids: new Set(),
    }
    const draft = { document: structuredClone(initial) } as NonNullable<EditorState['neckDraft']>
    state.neckDraft = draft

    expect(undoDocumentTransition(state)).toEqual({
      message: 'Accept or cancel the neck settings before undoing.',
    })
    expect(cancelDocumentTransition(state)).toEqual({
      preview: draft.document,
      drag: null,
    })
  })

  it('cancels an active drag before undo and transfers clone identities through undo and redo', () => {
    const before = transactionState(initial)
    const next = structuredClone(initial)
    next.name = 'Muutos'
    const committed = { ...before, ...commitDocumentTransition(before, next) } as TransactionState

    committed.drag = {
      before: structuredClone(next),
      kind: 'nodes',
      ids: new Set(),
    }
    expect(undoDocumentTransition(committed)).toEqual({ preview: null, drag: null })
    committed.drag = null

    const undone = undoDocumentTransition(committed)
    expect(undone.document).toEqual(initial)
    expect(undone.document).not.toBe(committed.history[0])
    expect(undone.future![0]).toEqual(next)
    expect(undone.future![0]).not.toBe(committed.document)

    const afterUndo = { ...committed, ...undone } as TransactionState
    const redone = redoDocumentTransition(afterUndo)
    expect(redone.document).toEqual(next)
    expect(redone.document).not.toBe(afterUndo.future[0])
    expect(redone.history).toHaveLength(1)
  })

  it('uses empty, draft, and 100-entry history guards without changing their patches', () => {
    const empty = transactionState(initial)
    expect(undoDocumentTransition(empty)).toEqual({})
    expect(redoDocumentTransition(empty)).toEqual({})

    const guarded = transactionState(initial)
    guarded.drag = { before: structuredClone(initial), kind: 'nodes', ids: new Set() }
    guarded.neckDraft = { document: structuredClone(initial) } as NonNullable<
      EditorState['neckDraft']
    >
    expect(redoDocumentTransition(guarded)).toEqual({
      message: 'Accept or cancel the neck settings before undoing.',
    })

    const capped = transactionState(initial)
    capped.history = Array.from({ length: 100 }, () => structuredClone(initial))
    const changed = structuredClone(initial)
    changed.name = 'Cap'
    const commit = commitDocumentTransition(capped, changed)
    expect(commit.history).toHaveLength(100)
    expect(commit.history![99]).toEqual(initial)
    expect(commit.history![99]).not.toBe(capped.history[99])

    const redoState = { ...capped, future: [changed] }
    const redo = redoDocumentTransition(redoState)
    expect(redo.history).toHaveLength(100)
    expect(redo.future).toEqual([])
  })

  it('preserves matching headstock selection, clears changed templates and back-view editing', () => {
    const withNeck = deriveNeckDocument(initial, { kind: 'fresh' })!
    const state = transactionState(withNeck)
    state.editingTarget = 'headstock'
    state.selectedHeadstock = new Set(['headstock-free-6'])

    const matching = structuredClone(withNeck)
    matching.name = 'Same template'
    const matchingPatch = commitDocumentTransition(state, matching)
    expect(matchingPatch.selectedHeadstock).toEqual(new Set(['headstock-free-6']))
    expect(matchingPatch.editingTarget).toBe('headstock')

    const switched = structuredClone(withNeck)
    switched.name = 'Other template'
    switched.neck!.headstock.activeTemplateId = 'three-three-2'
    const switchedPatch = commitDocumentTransition(state, switched)
    expect(switchedPatch.selectedHeadstock).toEqual(new Set())
    expect(switchedPatch.editingTarget).toBe('headstock')

    state.activeView = 'back'
    const backPatch = commitDocumentTransition(state, matching)
    expect(backPatch.selectedHeadstock).toEqual(new Set())
    expect(backPatch.editingTarget).toBe('body')
  })

  it('retains a valid segment t on commit, clears it on history traversal, and isolates clone inputs', () => {
    const state = transactionState(initial)
    const segment = initial.body.outline.nodes[0].id
    state.selectedSegment = segment
    state.selectedSegmentT = 0.23
    const next = structuredClone(initial)
    next.name = 'Segment'

    const commit = commitDocumentTransition(state, next)
    expect(commit.selectedSegment).toBe(segment)
    expect(commit.selectedSegmentT).toBe(0.23)
    expect(state.history).toEqual([])
    expect(state.document).toBe(initial)
    commit.history![0].body.outline.nodes[0].x += 10
    expect(initial.body.outline.nodes[0].x).not.toBe(commit.history![0].body.outline.nodes[0].x)

    const committed = { ...state, ...commit } as TransactionState
    const undone = undoDocumentTransition(committed)
    expect(undone.selectedSegment).toBeNull()
    expect(undone.selectedSegmentT).toBeNull()
    undone.future![0].body.outline.nodes[0].x += 10
    expect(next.body.outline.nodes[0].x).not.toBe(undone.future![0].body.outline.nodes[0].x)
  })
})
