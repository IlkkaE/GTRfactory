import { parseProject, serializeProject } from '../file/projectFile'
import { cloneDocument, type ProjectDocument } from '../model/project'
import { activeHeadstockNodes, supportsHeadstock } from '../headstock/template'
import type { EditorState } from '../store'

export type TransactionState = Pick<
  EditorState,
  | 'document'
  | 'baseline'
  | 'neckDraft'
  | 'history'
  | 'future'
  | 'selected'
  | 'selectedHeadstock'
  | 'editingTarget'
  | 'selectedPickupId'
  | 'selectedRearElectronicsCavity'
  | 'selectedSegment'
  | 'selectedSegmentT'
  | 'activeView'
  | 'drag'
  | 'revision'
>

export const documentsEqual = (a: ProjectDocument, b: ProjectDocument) =>
  JSON.stringify(a) === JSON.stringify(b)

export const cleanDocumentSelection = (document: ProjectDocument, selected: Set<string>) =>
  new Set([...selected].filter((id) => document.body.outline.nodes.some((node) => node.id === id)))

function headstockSelection(
  state: TransactionState,
  document: ProjectDocument,
): Pick<EditorState, 'selectedHeadstock' | 'editingTarget'> {
  const supported = state.activeView === 'front' && supportsHeadstock(document)
  return {
    selectedHeadstock: new Set(
      supported &&
        state.document.neck?.headstock.activeTemplateId ===
          document.neck?.headstock.activeTemplateId
        ? [...state.selectedHeadstock].filter((id) =>
            activeHeadstockNodes(document).some((node) => node.id === id),
          )
        : [],
    ),
    editingTarget: supported ? state.editingTarget : 'body',
  }
}

export function commitDocumentTransition(
  state: TransactionState,
  next: ProjectDocument,
): Partial<EditorState> {
  if (documentsEqual(state.document, next)) return { preview: null, drag: null, message: null }
  try {
    parseProject(serializeProject(next))
  } catch (error) {
    return { preview: null, drag: null, message: (error as Error).message }
  }
  return {
    document: next,
    preview: null,
    drag: null,
    history: [...state.history.slice(-99), cloneDocument(state.document)],
    future: [],
    dirty: !documentsEqual(next, state.baseline),
    revision: state.revision + 1,
    message: null,
    selected: cleanDocumentSelection(next, state.selected),
    ...headstockSelection(state, next),
    selectedRearElectronicsCavity:
      !!next.body.rearElectronicsCavity &&
      state.activeView === 'back' &&
      state.selectedRearElectronicsCavity,
    selectedPickupId: next.pickupCavities.some((pickup) => pickup.id === state.selectedPickupId)
      ? state.selectedPickupId
      : null,
    selectedSegment: next.body.outline.nodes.some((node) => node.id === state.selectedSegment)
      ? state.selectedSegment
      : null,
    selectedSegmentT: next.body.outline.nodes.some((node) => node.id === state.selectedSegment)
      ? state.selectedSegmentT
      : null,
  }
}

export function cancelDocumentTransition(
  state: Pick<EditorState, 'neckDraft'>,
): Partial<EditorState> {
  return { preview: state.neckDraft?.document ?? null, drag: null }
}

export function undoDocumentTransition(state: TransactionState): Partial<EditorState> {
  if (state.neckDraft) return { message: 'Accept or cancel the neck settings before undoing.' }
  if (state.drag) return { preview: null, drag: null }
  const document = state.history.at(-1)
  if (!document) return {}
  return {
    document: cloneDocument(document),
    history: state.history.slice(0, -1),
    future: [cloneDocument(state.document), ...state.future],
    selected: cleanDocumentSelection(document, state.selected),
    ...headstockSelection(state, document),
    selectedRearElectronicsCavity:
      !!document.body.rearElectronicsCavity &&
      state.activeView === 'back' &&
      state.selectedRearElectronicsCavity,
    selectedPickupId: document.pickupCavities.some((pickup) => pickup.id === state.selectedPickupId)
      ? state.selectedPickupId
      : null,
    selectedSegment: null,
    selectedSegmentT: null,
    dirty: !documentsEqual(document, state.baseline),
    revision: state.revision + 1,
  }
}

export function redoDocumentTransition(state: TransactionState): Partial<EditorState> {
  if (state.neckDraft) return { message: 'Accept or cancel the neck settings before undoing.' }
  if (state.drag) return { preview: null, drag: null }
  const document = state.future[0]
  if (!document) return {}
  return {
    document: cloneDocument(document),
    history: [...state.history, cloneDocument(state.document)].slice(-100),
    future: state.future.slice(1),
    selected: cleanDocumentSelection(document, state.selected),
    ...headstockSelection(state, document),
    selectedRearElectronicsCavity:
      !!document.body.rearElectronicsCavity &&
      state.activeView === 'back' &&
      state.selectedRearElectronicsCavity,
    selectedPickupId: document.pickupCavities.some((pickup) => pickup.id === state.selectedPickupId)
      ? state.selectedPickupId
      : null,
    selectedSegment: null,
    selectedSegmentT: null,
    dirty: !documentsEqual(document, state.baseline),
    revision: state.revision + 1,
  }
}
