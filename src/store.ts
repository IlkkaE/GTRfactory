import { create } from 'zustand'
import { rearElectronicsCavityGeometry, movedCavity, resizedCavity } from './electronicsCavity'
import { canSplitSegmentAt } from './editor/segmentSelection'
import { asCubic, deleteNodes, moveNodes, splitSegment } from './geometry/outline'
import { deriveNeckPocket, type NeckSideLine } from './geometry/neckPocket'
import { parseProject, serializeProject } from './file/projectFile'
import {
  cancelDocumentTransition,
  cleanDocumentSelection,
  commitDocumentTransition,
  documentsEqual,
  redoDocumentTransition,
  undoDocumentTransition,
} from './store/documentTransactions'
import {
  cloneDocument,
  createStarterDocument,
  starterBodyOutline,
  MAX_NODES,
  MAX_PICKUP_CAVITIES,
  validNumber,
  type NeckDocument,
  type NeckParams,
  type NeckPocketParams,
  type PickupCavity,
  type ProjectDocument,
  type Unit,
} from './model/project'
import { DEFAULT_NECK, validateNeckParams } from './neck/fretfactoryGeometry'
import { bassParams, bassPreset, isBassTemplate } from './headstock/bass'
import { DEFAULT_NECK_END, deriveNeckDocument, type NeckChange } from './neck/neckDocument'
import {
  firstPickupPosition,
  pickupDefaults,
  pickupPlacementError,
  pickupProfile,
} from './pickup/profiles'
import {
  activeHeadstockNodes,
  canSplitHeadstockSegment,
  splitHeadstockNodes,
  deleteHeadstockNodes,
  HEADSTOCK_TEMPLATE_IDS,
  type HeadstockTemplateId,
  canonicalHeadstockPoint,
  createHeadstock,
  canonicalHeadstockDelta,
  headstockWorldNodes,
  isProtectedHeadstockHandle,
  isProtectedHeadstockNode,
  supportsHeadstock,
  validateHeadstock,
  isHeadless,
} from './headstock/template'

export type ViewId = 'front' | 'back' | 'pocket'
export type Camera = { zoom: number; panX: number; panY: number }
type DragKind =
  | 'nodes'
  | 'handle'
  | 'pickup'
  | 'electronicsCavity'
  | 'electronicsResize'
  | 'headstockNodes'
  | 'headstockHandle'
type Drag = {
  before: ProjectDocument
  kind: DragKind
  ids: Set<string>
  pickupId?: string
  pickupCenterY?: number
  cavitySide?: 'left' | 'right' | 'top' | 'bottom'
} | null
export type NeckDraft = {
  document: ProjectDocument
  change: NeckChange
  creation: boolean
  pending: boolean
  revision: number
  error: string | null
}
const cameras = (): Record<ViewId, Camera> => ({
  front: { zoom: 1, panX: 0, panY: 0 },
  back: { zoom: 1, panX: 0, panY: 0 },
  pocket: { zoom: 1, panX: 0, panY: 0 },
})
export const isProtectedAnchor = (d: ProjectDocument, id: string) =>
  d.body.neckJointBoundary?.anchorIds.includes(id) ?? false
export const isProtectedSegment = (d: ProjectDocument, id: string) =>
  d.body.neckJointBoundary?.segmentStartIds.includes(id) ?? false
export const isProtectedHandle = (
  d: ProjectDocument,
  id: string,
  side: 'inHandle' | 'outHandle',
) => {
  if (side === 'outHandle') return isProtectedSegment(d, id)
  const nodes = d.body.outline.nodes,
    index = nodes.findIndex((n) => n.id === id)
  return index >= 0 && isProtectedSegment(d, nodes[(index - 1 + nodes.length) % nodes.length].id)
}
const protectedSelection = (d: ProjectDocument, ids: Iterable<string>) =>
  [...ids].some((id) => isProtectedAnchor(d, id))
export interface EditorState {
  document: ProjectDocument
  baseline: ProjectDocument
  preview: ProjectDocument | null
  neckDraft: NeckDraft | null
  history: ProjectDocument[]
  future: ProjectDocument[]
  selected: Set<string>
  selectedHeadstock: Set<string>
  editingTarget: 'body' | 'headstock'
  selectedPickupId: string | null
  selectedRearElectronicsCavity: boolean
  selectedSegment: string | null
  selectedSegmentT: number | null
  unit: Unit
  activeView: ViewId
  cameras: Record<ViewId, Camera>
  drag: Drag
  dirty: boolean
  message: string | null
  revision: number
  generation: number
  neckDraftRevision: number
  beginDrag: (kind: DragKind, ids?: Set<string>) => void
  beginPickupDrag: (id: string) => void
  beginRearElectronicsCavityDrag: (side?: 'left' | 'right' | 'top' | 'bottom') => void
  previewRearElectronicsCavity: (dx: number, dy: number) => void
  selectRearElectronicsCavity: (selected: boolean) => void
  previewPickup: (centerYmm: number) => void
  selectPickup: (id: string | null) => void
  addPickup: (profileId: string, profileVersion: number) => void
  changePickupProfile: (id: string, profileId: string, profileVersion: number) => void
  deletePickup: (id: string) => void
  setPickupCenter: (id: string, centerYmm: number) => void
  setPickupTransform: (
    id: string,
    change: Partial<Pick<PickupCavity, 'angleDeg' | 'widthMm' | 'lengthMm'>>,
  ) => void
  previewMove: (dx: number, dy: number) => void
  previewHandle: (id: string, side: 'inHandle' | 'outHandle', dx: number, dy: number) => void
  previewHeadstockMove: (dx: number, dy: number) => void
  previewHeadstockHandle: (
    id: string,
    side: 'inHandle' | 'outHandle',
    dx: number,
    dy: number,
  ) => void
  commit: () => void
  cancel: () => void
  select: (id: string, additive?: boolean) => void
  selectHeadstock: (id: string, additive?: boolean) => void
  setEditingTarget: (target: 'body' | 'headstock') => void
  setSelection: (ids: Set<string>) => void
  selectSegment: (id: string, t?: number) => void
  selectHeadstockSegment: (id: string, t?: number) => void
  addHeadstockPoint: () => void
  deleteHeadstockSelected: () => void
  switchHeadstockTemplate: (id: HeadstockTemplateId) => void
  addPoint: (t?: number) => void
  deleteSelected: () => void
  moveSelected: (dx: number, dy: number) => void
  setKind: (kind: 'smooth' | 'corner') => void
  setSegmentCubic: (cubic: boolean) => void
  setCoordinate: (axis: 'x' | 'y', value: number) => void
  resetBodyOutline: () => void
  setBodyColor: (color: string) => void
  setHeadstockCoordinate: (axis: 'x' | 'y', value: number) => void
  undo: () => void
  redo: () => void
  setView: (view: ViewId) => void
  setUnit: (unit: Unit) => void
  setHandedness: (handedness: ProjectDocument['handedness']) => void
  setCamera: (view: ViewId, patch: Partial<Camera>) => void
  resetCamera: (view: ViewId) => void
  replace: (document: ProjectDocument) => void
  rename: (name: string) => void
  configureNeckPocket: (
    params: Pick<
      NeckPocketParams,
      'mouthWidthMm' | 'heelWidthMm' | 'lengthMm' | 'fitAllowanceMm' | 'radiusMm'
    >,
  ) => void
  removeNeckPocket: () => void
  createNeck: () => void
  configureNeck: (patch: Partial<NeckParams>) => void
  importNeck: (params: NeckParams) => void
  configureNeckPlacement: (patch: Partial<NeckDocument['placement']>) => void
  configureNeckEnd: (patch: Partial<NeckDocument['end']>) => void
  configureWholeNeck: (change: {
    params: NeckParams
    placement: NeckDocument['placement']
    end: NeckDocument['end']
  }) => void
  startNeckDraft: () => void
  previewWholeNeck: (change: {
    params: NeckParams
    placement: NeckDocument['placement']
    end: NeckDocument['end']
  }) => void
  applyNeckDraft: () => void
  cancelNeckDraft: () => void
  invalidateNeckDraft: (message: string) => void
  markSaved: (snapshot: ProjectDocument, generation?: number) => void
  setMessage: (message: string | null) => void
  newProject: () => void
}
function changeNodes(
  s: EditorState,
  fn: (d: ProjectDocument) => ProjectDocument | void,
): Partial<EditorState> {
  if (s.neckDraft) return { message: 'Accept or cancel the neck settings before editing the body.' }
  try {
    const d = cloneDocument(s.document)
    const next = fn(d) ?? d
    return commitDocumentTransition(s, next)
  } catch (e) {
    return { message: (e as Error).message }
  }
}
function pocketLines(
  d: ProjectDocument,
  params: Pick<NeckPocketParams, 'mouthWidthMm' | 'heelWidthMm' | 'lengthMm'>,
): { leftSide: NeckSideLine; rightSide: NeckSideLine; endY: number } {
  const datum = d.body.neckPocket
    ? d.body.outline.nodes.find((n) => n.id === d.body.neckPocket!.datumNodeId)
    : d.body.neckJointBoundary &&
      d.body.outline.nodes.find((n) => n.id === d.body.neckJointBoundary!.anchorIds[1])
  if (!datum) throw new Error('The neck pocket requires a locked three-node neck joint.')
  const a = (params.heelWidthMm - params.mouthWidthMm) / (2 * params.lengthMm)
  return {
    leftSide: { a: -a, b: datum.x - params.mouthWidthMm / 2 + a * datum.y },
    rightSide: { a, b: datum.x + params.mouthWidthMm / 2 - a * datum.y },
    endY: datum.y + params.lengthMm,
  }
}
function applyPocket(
  d: ProjectDocument,
  params: Pick<
    NeckPocketParams,
    'mouthWidthMm' | 'heelWidthMm' | 'lengthMm' | 'fitAllowanceMm' | 'radiusMm'
  >,
) {
  const boundary = d.body.neckJointBoundary
  if (!boundary || boundary.anchorIds.length !== 3 || boundary.segmentStartIds.length !== 2)
    throw new Error('The neck pocket requires a three-node locked neck joint.')
  const [rightId, centerId, leftId] = boundary.anchorIds
  const current = (id: string) => d.body.outline.nodes.find((n) => n.id === id)
  const right = current(rightId),
    center = current(centerId),
    left = current(leftId)
  if (!left || !center || !right)
    throw new Error('The neck-pocket joint is missing from the outline.')
  const reference = d.body.neckPocket?.referenceBoundaryNodes ?? {
    left: structuredClone(left),
    center: structuredClone(center),
    right: structuredClone(right),
  }
  const lines = pocketLines(d, params)
  const geometry = deriveNeckPocket({
    mouth: reference,
    mouthWinding: 'right-to-left',
    ...lines,
    fitAllowanceMm: params.fitAllowanceMm,
    radiusMm: params.radiusMm,
  })
  const byId = new Map([
    [
      leftId,
      {
        ...geometry.mouth.left,
        outgoing: left.outgoing,
        outHandle: structuredClone(left.outHandle),
      },
    ],
    [centerId, geometry.mouth.center],
    [rightId, { ...geometry.mouth.right, inHandle: structuredClone(right.inHandle) }],
  ])
  d.body.outline.nodes = d.body.outline.nodes.map((n) => byId.get(n.id) ?? n)
  d.body.neckPocket = {
    datumNodeId: centerId,
    referenceBoundaryNodes: structuredClone(reference),
    mouthWinding: 'right-to-left',
    ...params,
  }
}
function defaultNeck(d: ProjectDocument) {
  const next = deriveNeckDocument(d, { kind: 'fresh' })
  if (!next) throw new Error('Creating a neck requires a locked three-node neck joint.')
  return next
}
function defaultProject() {
  const d = defaultNeck(createStarterDocument())
  const y = firstPickupPosition(d, 'sh12-humbucker', 1, 50)
  if (y !== null)
    d.pickupCavities = [
      {
        id: 'pickup-' + crypto.randomUUID(),
        profileId: 'sh12-humbucker',
        profileVersion: 1,
        centerYmm: y,
        ...pickupDefaults(pickupProfile('sh12-humbucker', 1)!),
      },
    ]
  return d
}
function neckChange(d: ProjectDocument) {
  const n = d.neck
  if (!n) throw new Error('A neck cannot be edited without a neck joint.')
  return { params: structuredClone(n.params), placement: { ...n.placement }, end: { ...n.end } }
}

export function neckTemplate(document: ProjectDocument): ProjectDocument | null {
  if (document.neck || !document.body.neckJointBoundary) return null
  try {
    return defaultNeck(document)
  } catch {
    return null
  }
}

function changedNeck(document: ProjectDocument, change: NeckChange) {
  let d = cloneDocument(document)
  if (!d.neck) d = defaultNeck(d)
  validateNeckParams(change.params)
  if (
    !Number.isInteger(change.placement.joinFret) ||
    change.placement.joinFret < 1 ||
    change.placement.joinFret > change.params.frets ||
    !Number.isFinite(change.placement.offsetMm) ||
    !Object.values(change.end).every(Number.isFinite) ||
    change.end.endMarginMm < 0 ||
    change.end.fretboardEndMarginMm <= change.end.endMarginMm ||
    change.end.radiusMm < 0
  )
    throw new Error('Fretboard end clearance must be greater than neck end clearance.')
  const next = deriveNeckDocument(d, { kind: 'whole', change })
  if (!next) throw new Error('Creating a neck requires a locked three-node neck joint.')
  d = next
  parseProject(serializeProject(d))
  return d
}

function resetBodyOutline(document: ProjectDocument): ProjectDocument {
  const starter = createStarterDocument()
  let next = cloneDocument(document)
  const boundary = structuredClone(next.body.neckJointBoundary)
  if (
    boundary &&
    !boundary.anchorIds
      .concat(boundary.segmentStartIds)
      .every((id) => starter.body.outline.nodes.some((node) => node.id === id))
  )
    throw new Error('The original body outline is incompatible with this neck-joint reference.')
  next.body.outline = { closed: true, nodes: starterBodyOutline() }
  next.body.neckJointBoundary = boundary
  if (next.neck) {
    const derived = deriveNeckDocument(next, { kind: 'placement', placement: next.neck.placement })
    if (!derived) throw new Error('The current neck cannot be fitted to the original body outline.')
    next = derived
  } else if (next.body.neckPocket) {
    const params = next.body.neckPocket
    applyPocket(next, params)
  }
  for (const pickup of next.pickupCavities) {
    const error = pickupPlacementError(next, pickup, pickup.id)
    if (error) throw new Error(`The body reset would invalidate a pickup cavity: ${error}`)
  }
  parseProject(serializeProject(next))
  return next
}

export const useAppStore = create<EditorState>()((set) => {
  const initial = defaultProject()
  return {
    document: initial,
    baseline: cloneDocument(initial),
    preview: null,
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
    unit: 'mm',
    activeView: 'front',
    cameras: cameras(),
    drag: null,
    dirty: false,
    message: null,
    revision: 0,
    generation: 0,
    neckDraftRevision: 0,
    beginDrag: (kind, ids) =>
      set((s) =>
        (kind === 'headstockNodes' || kind === 'headstockHandle') &&
        (s.activeView !== 'front' || !supportsHeadstock(s.document))
          ? { message: 'Headstock support is available for a 6–8 string neck in front view.' }
          : s.neckDraft
            ? { message: 'Accept or cancel the unfinished neck change before editing the body.' }
            : {
                drag: {
                  before: cloneDocument(s.document),
                  kind,
                  ids: new Set(
                    ids ??
                      (kind === 'headstockNodes' || kind === 'headstockHandle'
                        ? s.selectedHeadstock
                        : s.selected),
                  ),
                },
                preview: cloneDocument(s.document),
                message: null,
              },
      ),
    beginRearElectronicsCavityDrag: (side) =>
      set((s) => {
        if (s.neckDraft)
          return {
            message: 'Accept or cancel the unfinished neck change before editing the cavity.',
          }
        if (!s.document.body.rearElectronicsCavity || s.activeView !== 'back' || s.drag) return {}
        return {
          drag: {
            before: cloneDocument(s.document),
            kind: side ? 'electronicsResize' : 'electronicsCavity',
            ids: new Set(),
            cavitySide: side,
          },
          preview: cloneDocument(s.document),
          selectedRearElectronicsCavity: true,
          editingTarget: 'body',
          selected: new Set(),
          selectedHeadstock: new Set(),
          selectedPickupId: null,
          selectedSegment: null,
          selectedSegmentT: null,
          message: null,
        }
      }),
    previewRearElectronicsCavity: (dx, dy) =>
      set((s) => {
        if (!s.drag || !['electronicsCavity', 'electronicsResize'].includes(s.drag.kind)) return {}
        const c = s.drag.before.body.rearElectronicsCavity
        if (!c) return {}
        const n =
          s.drag.kind === 'electronicsCavity'
            ? movedCavity(c, dx, dy)
            : resizedCavity(
                c,
                s.drag.cavitySide!,
                s.drag.cavitySide === 'left' || s.drag.cavitySide === 'right' ? dy : dx,
              )
        if (
          ![n.horizontalMm, n.verticalMm, n.centerXmm, n.centerYmm].every(Number.isFinite) ||
          n.horizontalMm <= 0 ||
          n.verticalMm <= 0
        )
          return {
            message:
              'The cavity dimensions and location must be valid, and its dimensions positive.',
          }
        const d = cloneDocument(s.drag.before)
        d.body.rearElectronicsCavity = n
        const e = rearElectronicsCavityGeometry(d)?.diagnostic
        return e
          ? { preview: cloneDocument(s.preview ?? s.drag.before), message: e.message }
          : { preview: d, message: null }
      }),
    selectRearElectronicsCavity: (selected) =>
      set((s) => ({
        selectedRearElectronicsCavity:
          selected &&
          s.activeView === 'back' &&
          !s.neckDraft &&
          !!s.document.body.rearElectronicsCavity,
        selectedHeadstock: new Set(),
        editingTarget: 'body',
        selected: new Set(),
        selectedPickupId: null,
        selectedSegment: null,
        selectedSegmentT: null,
        message: null,
      })),
    beginPickupDrag: (id) =>
      set((s) => {
        const pickup = s.document.pickupCavities.find((p) => p.id === id)
        if (!pickup || s.neckDraft)
          return s.neckDraft
            ? {
                message:
                  'Accept or cancel the unfinished neck change before editing the pickup cavity.',
              }
            : {}
        return {
          drag: {
            before: cloneDocument(s.document),
            kind: 'pickup',
            ids: new Set(),
            pickupId: id,
            pickupCenterY: pickup.centerYmm,
          },
          preview: cloneDocument(s.document),
          editingTarget: 'body',
          selected: new Set(),
          selectedHeadstock: new Set(),
          selectedPickupId: id,
          selectedSegment: null,
          selectedSegmentT: null,
          message: null,
        }
      }),
    previewPickup: (centerYmm) =>
      set((s) => {
        if (!s.drag || s.drag.kind !== 'pickup' || !s.drag.pickupId || !Number.isFinite(centerYmm))
          return {}
        const d = cloneDocument(s.drag.before),
          c = d.pickupCavities.find((p) => p.id === s.drag!.pickupId)
        if (!c) return {}
        c.centerYmm = centerYmm
        const error = pickupPlacementError(d, c, c.id)
        return error ? { message: error } : { preview: d, message: null }
      }),
    selectPickup: (id) =>
      set((s) =>
        id === null || s.document.pickupCavities.some((p) => p.id === id)
          ? {
              editingTarget: 'body',
              selected: new Set(),
              selectedHeadstock: new Set(),
              selectedPickupId: id,
              selectedSegment: null,
              selectedSegmentT: null,
              message: null,
            }
          : {},
      ),
    addPickup: (profileId, profileVersion) =>
      set((s) => {
        if (s.drag || s.neckDraft)
          return {
            message: 'Accept or cancel the unfinished change before adding a pickup cavity.',
          }
        if (s.document.pickupCavities.length >= MAX_PICKUP_CAVITIES)
          return { message: 'The technical limit is 64 pickup cavities.' }
        const id = 'pickup-' + crypto.randomUUID(),
          result = changeNodes(s, (d) => {
            if (!pickupProfile(profileId, profileVersion))
              throw new Error('The pickup-cavity profile or version is unknown.')
            const y = firstPickupPosition(d, profileId, profileVersion)
            if (y === null)
              throw new Error('No valid location for the pickup cavity can be found in the body.')
            const profile = pickupProfile(profileId, profileVersion)!
            d.pickupCavities.push({
              id,
              profileId,
              profileVersion,
              centerYmm: y,
              ...pickupDefaults(profile),
            })
          })
        return result.document
          ? {
              ...result,
              editingTarget: 'body',
              selected: new Set(),
              selectedHeadstock: new Set(),
              selectedPickupId: id,
              selectedSegment: null,
              selectedSegmentT: null,
              activeView: 'front',
            }
          : result
      }),
    changePickupProfile: (id, profileId, profileVersion) =>
      set((s) => {
        if (s.drag || s.neckDraft)
          return { message: 'Accept or cancel the unfinished change before changing the model.' }
        return changeNodes(s, (d) => {
          const c = d.pickupCavities.find((p) => p.id === id)
          if (!c) throw new Error('The selected pickup cavity cannot be found.')
          if (!pickupProfile(profileId, profileVersion))
            throw new Error('The pickup-cavity profile or version is unknown.')
          const old = { ...c }
          c.profileId = profileId
          c.profileVersion = profileVersion
          Object.assign(c, pickupDefaults(pickupProfile(profileId, profileVersion)!))
          const error = pickupPlacementError(d, c, c.id)
          if (error) {
            Object.assign(c, old)
            throw new Error(error)
          }
        })
      }),
    deletePickup: (id) =>
      set((s) =>
        s.drag || s.neckDraft
          ? { message: 'Accept or cancel the unfinished change before deleting.' }
          : changeNodes(s, (d) => {
              d.pickupCavities = d.pickupCavities.filter((p) => p.id !== id)
            }),
      ),
    setPickupCenter: (id, centerYmm) =>
      set((s) =>
        s.drag || s.neckDraft
          ? { message: 'Accept or cancel the unfinished change before changing its location.' }
          : changeNodes(s, (d) => {
              const c = d.pickupCavities.find((p) => p.id === id)
              if (!c) throw new Error('The selected pickup cavity cannot be found.')
              c.centerYmm = centerYmm
              const error = pickupPlacementError(d, c, c.id)
              if (error) throw new Error(error)
            }),
      ),
    setPickupTransform: (id, change) =>
      set((s) =>
        s.drag || s.neckDraft
          ? { message: 'Accept or cancel the unfinished change before changing the pickup cavity.' }
          : changeNodes(s, (d) => {
              const c = d.pickupCavities.find((p) => p.id === id)
              if (!c) throw new Error('The selected pickup cavity cannot be found.')
              const old = { ...c }
              Object.assign(c, change)
              const error = pickupPlacementError(d, c, c.id)
              if (error) {
                Object.assign(c, old)
                throw new Error(error)
              }
            }),
      ),
    previewHeadstockMove: (dx, dy) =>
      set((s) => {
        if (!s.drag || s.drag.kind !== 'headstockNodes' || !s.document.neck) return {}
        const ids = [...s.drag.ids].filter(
          (id) => !isProtectedHeadstockNode(id, s.document.neck!.headstock),
        )
        if (!ids.length) return { message: 'The headstock joint and tuner edge are protected.' }
        try {
          const d = cloneDocument(s.drag.before),
            nodes = activeHeadstockNodes(d),
            delta = canonicalHeadstockDelta(s.drag.before, { x: dx, y: dy })
          for (const id of ids) {
            const n = nodes.find((v) => v.id === id)
            if (!n) continue
            n.x += delta.x
            n.y += delta.y
          }
          validateHeadstock(d, d.neck!.headstock)
          return { preview: d, message: null }
        } catch (e) {
          return { preview: cloneDocument(s.drag.before), message: (e as Error).message }
        }
      }),
    previewHeadstockHandle: (id, side, dx, dy) =>
      set((s) => {
        if (!s.drag || s.drag.kind !== 'headstockHandle' || !s.drag.ids.has(id) || !s.document.neck)
          return {}
        if (
          isProtectedHeadstockHandle(
            activeHeadstockNodes(s.drag.before),
            id,
            side,
            s.drag.before.neck!.headstock,
          )
        )
          return { message: 'The handles of the headstock joint and tuner edge are protected.' }
        try {
          const d = cloneDocument(s.drag.before),
            n = activeHeadstockNodes(d).find((v) => v.id === id),
            base = activeHeadstockNodes(s.drag.before).find((v) => v.id === id)
          if (!n || !base) return {}
          const delta = canonicalHeadstockDelta(s.drag.before, { x: dx, y: dy })
          n[side] = { dx: (base[side]?.dx ?? 0) + delta.x, dy: (base[side]?.dy ?? 0) + delta.y }
          if (n.kind === 'smooth') {
            const other = side === 'inHandle' ? 'outHandle' : 'inHandle',
              h = n[side]!,
              len = Math.hypot(h.dx, h.dy),
              oldLen = Math.hypot(n[other]?.dx ?? 0, n[other]?.dy ?? 0)
            if (len > 1e-10 && oldLen > 1e-10)
              n[other] = { dx: (-h.dx / len) * oldLen, dy: (-h.dy / len) * oldLen }
            else n.kind = 'corner'
          }
          validateHeadstock(d, d.neck!.headstock)
          return { preview: d, message: null }
        } catch (e) {
          return { preview: cloneDocument(s.drag.before), message: (e as Error).message }
        }
      }),
    previewMove: (dx, dy) =>
      set((s) => {
        if (!s.drag || s.drag.kind !== 'nodes') return {}
        const drag = s.drag,
          free = new Set([...drag.ids].filter((id) => !isProtectedAnchor(drag.before, id)))
        if (!free.size)
          return { message: 'The neck joint is protected. Edit its fit in the neck settings.' }
        try {
          const preview = cloneDocument(drag.before)
          preview.body.outline.nodes = moveNodes(preview.body.outline.nodes, free, dx, dy)
          return { preview, message: null }
        } catch (e) {
          return { message: (e as Error).message }
        }
      }),
    previewHandle: (id, side, dx, dy) =>
      set((s) => {
        if (
          !s.drag ||
          s.drag.kind !== 'handle' ||
          !s.drag.ids.has(id) ||
          !validNumber(dx) ||
          !validNumber(dy)
        )
          return {}
        if (isProtectedHandle(s.drag.before, id, side))
          return { message: 'The neck-joint handle is protected for the neck fit.' }
        const d = cloneDocument(s.drag.before),
          n = d.body.outline.nodes.find((v) => v.id === id)
        if (!n) return {}
        n[side] = { dx, dy }
        if (n.kind === 'smooth') {
          const other = side === 'inHandle' ? 'outHandle' : 'inHandle'
          const length = Math.hypot(n[other]?.dx ?? 0, n[other]?.dy ?? 0),
            lengthNow = Math.hypot(dx, dy)
          if (lengthNow < 1e-10 || length < 1e-10) n.kind = 'corner'
          else {
            const v = { dx: (-dx / lengthNow) * length, dy: (-dy / lengthNow) * length }
            if (!validNumber(v.dx) || !validNumber(v.dy)) return {}
            n[other] = v
          }
        }
        return { preview: d }
      }),
    commit: () =>
      set((s) => {
        if (!s.drag || !s.preview) return {}
        if ((s.drag.kind === 'headstockNodes' || s.drag.kind === 'headstockHandle') && s.message)
          return { preview: null, drag: null }
        return commitDocumentTransition(s, s.preview)
      }),
    cancel: () => set((s) => cancelDocumentTransition(s)),
    setEditingTarget: (target) =>
      set((s) =>
        target === 'headstock' &&
        (s.neckDraft || s.activeView !== 'front' || !supportsHeadstock(s.document))
          ? {}
          : {
              editingTarget: target,
              selected: new Set(),
              selectedHeadstock: new Set(),
              selectedPickupId: null,
              selectedRearElectronicsCavity: false,
              selectedSegment: null,
              selectedSegmentT: null,
              message: null,
            },
      ),
    selectHeadstock: (id, additive = false) =>
      set((s) => {
        if (
          s.neckDraft ||
          s.activeView !== 'front' ||
          !supportsHeadstock(s.document) ||
          !activeHeadstockNodes(s.document).some((n) => n.id === id)
        )
          return {}
        const selected = additive ? new Set(s.selectedHeadstock) : new Set<string>()
        if (additive && selected.has(id)) selected.delete(id)
        else selected.add(id)
        return {
          editingTarget: 'headstock',
          selectedHeadstock: selected,
          selected: new Set(),
          selectedPickupId: null,
          selectedRearElectronicsCavity: false,
          selectedSegment: null,
          selectedSegmentT: null,
          message: null,
        }
      }),
    selectHeadstockSegment: (id, t = 0.5) =>
      set((s) => {
        if (
          s.drag ||
          s.neckDraft ||
          s.activeView !== 'front' ||
          !supportsHeadstock(s.document) ||
          !activeHeadstockNodes(s.document)
            .slice(0, -1)
            .some((n) => n.id === id)
        )
          return {}
        return {
          editingTarget: 'headstock',
          selectedHeadstock: new Set(),
          selected: new Set(),
          selectedPickupId: null,
          selectedRearElectronicsCavity: false,
          selectedSegment: id,
          selectedSegmentT: Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0.5,
          message: null,
        }
      }),
    switchHeadstockTemplate: (id) =>
      set((s) => {
        if (
          s.drag ||
          s.neckDraft ||
          s.activeView !== 'front' ||
          s.editingTarget !== 'headstock' ||
          !supportsHeadstock(s.document)
        )
          return {}
        if (!HEADSTOCK_TEMPLATE_IDS.includes(id)) return { message: 'Unknown headstock template.' }
        const currentId = s.document.neck!.headstock.activeTemplateId
        if (id === currentId) return {}
        const currentBass = isBassTemplate(currentId),
          nextBass = isBassTemplate(id)
        if (!currentBass && !nextBass && id !== 'inline' && s.document.neck!.params.strings !== 6)
          return { message: 'A 3+3 headstock is available only for a six-string neck.' }
        const result = changeNodes(s, (d) => {
          if (nextBass) {
            const p = bassPreset(id)
            d.neck!.headstock = createHeadstock()
            d.neck!.headstock.activeTemplateId = id
            d.neck!.physicalProfile = { nutWidthMm: p.nutWidthMm, widthAt12thMm: p.widthAt12thMm }
            const derived = deriveNeckDocument(d, {
              kind: 'whole',
              change: {
                params: bassParams(id),
                placement: { joinFret: 17, offsetMm: 0 },
                end: DEFAULT_NECK_END,
              },
            })
            if (!derived?.neck) throw new Error('The bass neck cannot be fitted to this body.')
            return derived
          }
          if (currentBass || (isHeadless(currentId) && !isHeadless(id))) {
            d.neck!.headstock = createHeadstock()
            d.neck!.headstock.activeTemplateId = id
            d.neck!.physicalProfile = null
            const derived = deriveNeckDocument(d, {
              kind: 'whole',
              change: {
                params: structuredClone(DEFAULT_NECK),
                placement: { joinFret: 17, offsetMm: 0 },
                end: DEFAULT_NECK_END,
              },
            })
            if (!derived?.neck) throw new Error('The guitar neck cannot be fitted to this body.')
            return derived
          }
          d.neck!.headstock.activeTemplateId = id
        })
        return result.document
          ? {
              ...result,
              selectedHeadstock: new Set(),
              selectedSegment: null,
              selectedSegmentT: null,
            }
          : result
      }),
    addHeadstockPoint: () =>
      set((s) => {
        if (
          s.drag ||
          s.neckDraft ||
          s.editingTarget !== 'headstock' ||
          s.activeView !== 'front' ||
          !supportsHeadstock(s.document) ||
          !s.selectedSegment
        )
          return {}
        const nodes = headstockWorldNodes(s.document),
          index = nodes.findIndex((n) => n.id === s.selectedSegment),
          t = s.selectedSegmentT ?? 0.5
        if (
          !canSplitHeadstockSegment(s.document, s.selectedSegment) ||
          !canSplitSegmentAt(nodes, index, t)
        )
          return { message: "Select a point within the headstock's free outline." }
        const result = changeNodes(s, (d) => {
          const h = d.neck!.headstock
          h.variants[h.activeTemplateId].nodes = splitHeadstockNodes(d, s.selectedSegment!, t)
        })
        return result.document
          ? {
              ...result,
              selectedHeadstock: new Set([activeHeadstockNodes(result.document)[index + 1].id]),
              selectedSegment: null,
              selectedSegmentT: null,
            }
          : result
      }),
    deleteHeadstockSelected: () =>
      set((s) => {
        if (
          s.drag ||
          s.neckDraft ||
          s.editingTarget !== 'headstock' ||
          s.activeView !== 'front' ||
          !supportsHeadstock(s.document) ||
          !s.selectedHeadstock.size
        )
          return {}
        const result = changeNodes(s, (d) => {
          const h = d.neck!.headstock
          h.variants[h.activeTemplateId].nodes = deleteHeadstockNodes(d, s.selectedHeadstock)
        })
        return result.document
          ? {
              ...result,
              selectedHeadstock: new Set(),
              selectedSegment: null,
              selectedSegmentT: null,
            }
          : result
      }),
    select: (id, additive = false) =>
      set((s) => {
        const selected = additive ? new Set(s.selected) : new Set<string>()
        if (additive && selected.has(id)) selected.delete(id)
        else selected.add(id)
        return {
          editingTarget: 'body',
          selected: cleanDocumentSelection(s.document, selected),
          selectedHeadstock: new Set(),
          selectedPickupId: null,
          selectedRearElectronicsCavity: false,
          selectedSegment: null,
          selectedSegmentT: null,
        }
      }),
    setSelection: (ids) =>
      set((s) => ({
        editingTarget: 'body',
        selected: cleanDocumentSelection(s.document, ids),
        selectedHeadstock: new Set(),
        selectedPickupId: null,
        selectedRearElectronicsCavity: false,
        selectedSegment: null,
        selectedSegmentT: null,
      })),
    selectSegment: (id, t = 0.5) =>
      set((s) =>
        s.document.body.outline.nodes.some((n) => n.id === id)
          ? {
              editingTarget: 'body',
              selectedHeadstock: new Set(),
              selectedSegment: id,
              selectedSegmentT: Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0.5,
              selected: new Set(),
              selectedPickupId: null,
              selectedRearElectronicsCavity: false,
            }
          : {},
      ),
    addPoint: (t) =>
      set((s) => {
        const actual = t ?? s.selectedSegmentT ?? 0.5
        const i = s.document.body.outline.nodes.findIndex((n) => n.id === s.selectedSegment)
        if (i < 0) return {}
        if (isProtectedSegment(s.document, s.selectedSegment!))
          return { message: 'The neck-joint edge cannot be split.' }
        if (!canSplitSegmentAt(s.document.body.outline.nodes, i, actual))
          return {
            message: 'Select a point to add within the outline, away from the endpoints.',
          }
        if (s.document.body.outline.nodes.length >= MAX_NODES)
          return { message: 'The technical limit is 2,000 nodes.' }
        const result = changeNodes(s, (d) => {
          d.body.outline.nodes = splitSegment(d.body.outline.nodes, i, actual)
        })
        return result.document
          ? {
              ...result,
              selected: new Set([result.document.body.outline.nodes[i + 1].id]),
              selectedSegment: null,
              selectedSegmentT: null,
            }
          : result
      }),
    deleteSelected: () =>
      set((s) => {
        if (!s.selected.size) return {}
        if (protectedSelection(s.document, s.selected))
          return { message: 'The selection includes a locked neck joint; deletion was rejected.' }
        return changeNodes(s, (d) => {
          d.body.outline.nodes = deleteNodes(d.body.outline.nodes, s.selected)
        })
      }),
    moveSelected: (dx, dy) =>
      set((s) => {
        const free = new Set([...s.selected].filter((id) => !isProtectedAnchor(s.document, id)))
        if (!free.size)
          return { message: 'The neck joint is protected. Edit its fit in the neck settings.' }
        return changeNodes(s, (d) => {
          d.body.outline.nodes = moveNodes(d.body.outline.nodes, free, dx, dy)
        })
      }),
    setKind: (kind) =>
      set((s) =>
        changeNodes(s, (d) => {
          if (s.selected.size !== 1) return
          const n = d.body.outline.nodes.find((n) => s.selected.has(n.id))
          if (!n || n.kind === kind) return
          if (isProtectedAnchor(d, n.id))
            throw new Error('The neck joint is protected. Edit its fit in the neck settings.')
          n.kind = kind
          if (kind === 'smooth') {
            let direction = n.outHandle
            if (!direction || Math.hypot(direction.dx, direction.dy) < 1e-10)
              direction = n.inHandle ? { dx: -n.inHandle.dx, dy: -n.inHandle.dy } : null
            if (!direction || Math.hypot(direction.dx, direction.dy) < 1e-10)
              direction = { dx: 1, dy: 0 }
            const q = Math.hypot(direction.dx, direction.dy),
              il = Math.hypot(n.inHandle?.dx ?? 0, n.inHandle?.dy ?? 0) || 10,
              ol = Math.hypot(n.outHandle?.dx ?? 0, n.outHandle?.dy ?? 0) || 10
            n.inHandle = { dx: (-direction.dx / q) * il, dy: (-direction.dy / q) * il }
            n.outHandle = { dx: (direction.dx / q) * ol, dy: (direction.dy / q) * ol }
          }
        }),
      ),
    setSegmentCubic: (cubic) =>
      set((s) =>
        changeNodes(s, (d) => {
          const i = d.body.outline.nodes.findIndex((n) => n.id === s.selectedSegment)
          if (s.selectedSegment && isProtectedSegment(d, s.selectedSegment))
            throw new Error('The neck-joint edge cannot be modified.')
          if (i >= 0) d.body.outline.nodes = asCubic(d.body.outline.nodes, i, cubic)
        }),
      ),
    setHeadstockCoordinate: (axis, value) =>
      set((s) =>
        changeNodes(s, (d) => {
          if (
            !supportsHeadstock(d) ||
            s.activeView !== 'front' ||
            !d.neck ||
            !s.document.neck ||
            s.selectedHeadstock.size !== 1
          )
            throw new Error('Select one free headstock node.')
          const n = activeHeadstockNodes(d).find((v) => s.selectedHeadstock.has(v.id))
          if (!n || isProtectedHeadstockNode(n.id, d.neck.headstock))
            throw new Error('The headstock joint and tuner edge are protected.')
          const world = headstockWorldNodes(s.document).find((v) => v.id === n.id)!
          const point = canonicalHeadstockPoint(
            s.document,
            axis === 'x' ? { x: value, y: world.y } : { x: world.x, y: value },
          )
          n[axis] = point[axis]
          validateHeadstock(d, d.neck.headstock)
        }),
      ),
    setCoordinate: (axis, value) =>
      set((s) =>
        changeNodes(s, (d) => {
          if (!validNumber(value))
            throw new Error('The coordinate must be a number between ±1,000,000 mm.')
          if (s.selected.size !== 1) return
          const n = d.body.outline.nodes.find((n) => s.selected.has(n.id))
          if (n) {
            if (isProtectedAnchor(d, n.id))
              throw new Error('The neck joint is protected. Edit its fit in the neck settings.')
            n[axis] = value
          }
        }),
      ),
    resetBodyOutline: () =>
      set((s) => {
        if (s.drag || s.neckDraft) return {}
        try {
          const result = commitDocumentTransition(s, resetBodyOutline(s.document))
          return result.document
            ? {
                ...result,
                editingTarget: 'body',
                selected: new Set(),
                selectedHeadstock: new Set(),
                selectedPickupId: null,
                selectedRearElectronicsCavity: false,
                selectedSegment: null,
                selectedSegmentT: null,
              }
            : result
        } catch (e) {
          return { message: (e as Error).message }
        }
      }),
    setBodyColor: (color: string) =>
      set((s) => {
        if (s.drag || s.neckDraft) return {}
        if (s.document.body.color === color) return {}
        const next = cloneDocument(s.document)
        next.body.color = color
        return commitDocumentTransition(s, next)
      }),
    undo: () => set((s) => undoDocumentTransition(s)),
    redo: () => set((s) => redoDocumentTransition(s)),
    setView: (activeView) =>
      set((s) => ({
        activeView,
        preview: s.neckDraft?.pending ? s.neckDraft.document : null,
        neckDraft: s.neckDraft?.pending ? s.neckDraft : null,
        neckDraftRevision:
          s.neckDraft && !s.neckDraft.pending ? s.neckDraftRevision + 1 : s.neckDraftRevision,
        drag: null,
        editingTarget: activeView === 'front' ? s.editingTarget : 'body',
        selectedHeadstock: activeView === 'front' ? s.selectedHeadstock : new Set(),
        ...(activeView !== 'front' && s.editingTarget === 'headstock'
          ? { selectedSegment: null, selectedSegmentT: null }
          : {}),
        selectedPickupId: activeView === 'front' ? s.selectedPickupId : null,
        selectedRearElectronicsCavity:
          activeView === 'back' ? s.selectedRearElectronicsCavity : false,
      })),
    setUnit: (unit) => set({ unit }),
    setHandedness: (handedness) =>
      set((s) => {
        if (s.drag) return { message: 'Finish the current drag before changing handedness.' }
        if (s.neckDraft)
          return { message: 'Accept or cancel the neck settings before changing handedness.' }
        if (s.document.handedness === handedness) return {}
        const next = cloneDocument(s.document)
        next.handedness = handedness
        return commitDocumentTransition(s, next)
      }),
    setCamera: (view, patch) =>
      set((s) => {
        const c = { ...s.cameras[view], ...patch }
        if (![c.zoom, c.panX, c.panY].every(Number.isFinite)) return {}
        c.zoom = Math.max(0.2, Math.min(20, c.zoom))
        return { cameras: { ...s.cameras, [view]: c } }
      }),
    resetCamera: (view) =>
      set((s) => ({ cameras: { ...s.cameras, [view]: { zoom: 1, panX: 0, panY: 0 } } })),
    replace: (document) =>
      set((s) => {
        const valid = parseProject(serializeProject(document))
        return {
          document: valid,
          baseline: cloneDocument(valid),
          preview: null,
          neckDraft: null,
          history: [],
          future: [],
          selected: new Set(),
          selectedPickupId: null,
          selectedRearElectronicsCavity: false,
          selectedSegment: null,
          selectedSegmentT: null,
          selectedHeadstock: new Set(),
          editingTarget: 'body',
          dirty: false,
          drag: null,
          message: null,
          activeView: 'front',
          cameras: cameras(),
          revision: s.revision + 1,
          generation: s.generation + 1,
        }
      }),
    rename: (name) =>
      set((s) =>
        changeNodes(s, (d) => {
          const value = name.trim()
          if (value.length <= 160) d.name = value
        }),
      ),
    configureNeckPocket: (params) => set((s) => changeNodes(s, (d) => applyPocket(d, params))),
    removeNeckPocket: () =>
      set((s) =>
        changeNodes(s, (d) => {
          if (!d.body.neckPocket) return
          d.body.neckPocket = null
        }),
      ),
    createNeck: () =>
      set((s) =>
        changeNodes(s, (d) => {
          const datum =
            d.body.neckJointBoundary &&
            d.body.outline.nodes.find((n) => n.id === d.body.neckJointBoundary!.anchorIds[1])
          if (!datum) throw new Error('Creating a neck requires a locked three-node neck joint.')
          const next = deriveNeckDocument(d, { kind: 'fresh' })
          if (!next) throw new Error('Creating a neck requires a locked three-node neck joint.')
          return next
        }),
      ),
    importNeck: (params) =>
      set((s) =>
        changeNodes(s, (d) => {
          validateNeckParams(params)
          if (!d.body.neckJointBoundary)
            throw new Error('Importing a neck requires a locked three-node neck joint.')
          const next = deriveNeckDocument(d, { kind: 'import', params })
          if (!next) throw new Error('Importing a neck requires a locked three-node neck joint.')
          return next
        }),
      ),
    configureNeck: (patch) =>
      set((s) =>
        changeNodes(s, (d) => {
          if (!d.neck) throw new Error('Create a neck before editing it.')
          const params = { ...d.neck.params, ...patch }
          validateNeckParams(params)
          if (d.neck.placement.joinFret > params.frets)
            throw new Error('The joint fret does not fit the selected number of frets.')
          const next = deriveNeckDocument(d, { kind: 'params', params })
          if (!next) throw new Error('Create a neck before editing it.')
          return next
        }),
      ),
    configureNeckPlacement: (patch) =>
      set((s) =>
        changeNodes(s, (d) => {
          if (!d.neck) throw new Error('Create a neck before editing its placement.')
          const placement = { ...d.neck.placement, ...patch }
          if (
            !Number.isInteger(placement.joinFret) ||
            placement.joinFret < 1 ||
            placement.joinFret > d.neck.params.frets ||
            !Number.isFinite(placement.offsetMm)
          )
            throw new Error('The neck placement is invalid.')
          const next = deriveNeckDocument(d, { kind: 'placement', placement })
          if (!next) throw new Error('Create a neck before editing its placement.')
          return next
        }),
      ),
    configureNeckEnd: (patch) =>
      set((s) =>
        changeNodes(s, (d) => {
          if (!d.neck) throw new Error('Create a neck before editing its end.')
          const end = { ...d.neck.end, ...patch }
          if (
            !Object.values(end).every(Number.isFinite) ||
            end.endMarginMm < 0 ||
            end.fretboardEndMarginMm <= end.endMarginMm ||
            end.radiusMm < 0
          )
            throw new Error('Fretboard end clearance must be greater than neck end clearance.')
          const next = deriveNeckDocument(d, { kind: 'end', end })
          if (!next) throw new Error('Create a neck before editing its end.')
          return next
        }),
      ),
    configureWholeNeck: (change) =>
      set((s) => {
        if (s.neckDraft) return { message: 'Accept or cancel the neck draft first.' }
        try {
          return commitDocumentTransition(s, changedNeck(s.document, change))
        } catch (e) {
          return { message: (e as Error).message }
        }
      }),
    startNeckDraft: () =>
      set((s) => {
        if (s.neckDraft) return {}
        try {
          let d = cloneDocument(s.document)
          const creation = !d.neck
          if (!d.neck) d = defaultNeck(d)
          return {
            neckDraft: {
              document: d,
              change: neckChange(d),
              creation,
              pending: creation,
              revision: s.neckDraftRevision + 1,
              error: null,
            },
            neckDraftRevision: s.neckDraftRevision + 1,
            preview: d,
            drag: null,
            message: null,
            selected: new Set(),
            selectedHeadstock: new Set(),
            editingTarget: 'body',
            selectedPickupId: null,
            selectedRearElectronicsCavity: false,
            selectedSegment: null,
            selectedSegmentT: null,
          }
        } catch (e) {
          return { message: (e as Error).message }
        }
      }),
    previewWholeNeck: (change) =>
      set((s) => {
        if (!s.neckDraft) return {}
        try {
          const d = changedNeck(s.document, change)
          return {
            neckDraft: {
              ...s.neckDraft,
              document: d,
              change: structuredClone(change),
              pending: !documentsEqual(s.document, d),
              error: null,
              revision: s.neckDraftRevision + 1,
            },
            neckDraftRevision: s.neckDraftRevision + 1,
            preview: d,
            message: null,
          }
        } catch (e) {
          return {
            neckDraft: {
              ...s.neckDraft,
              pending: true,
              error: (e as Error).message,
              revision: s.neckDraftRevision + 1,
            },
            neckDraftRevision: s.neckDraftRevision + 1,
            preview: s.neckDraft.document,
            message: null,
          }
        }
      }),
    applyNeckDraft: () =>
      set((s) => {
        if (!s.neckDraft) return {}
        if (s.neckDraft.error) return { message: 'Correct the neck-draft error before accepting.' }
        try {
          const result = commitDocumentTransition(s, changedNeck(s.document, s.neckDraft.change))
          return result.message
            ? result
            : { ...result, neckDraft: null, neckDraftRevision: s.neckDraftRevision + 1 }
        } catch (e) {
          return {
            neckDraft: { ...s.neckDraft, error: (e as Error).message, pending: true },
            message: (e as Error).message,
          }
        }
      }),
    cancelNeckDraft: () =>
      set((s) => ({
        neckDraft: null,
        neckDraftRevision: s.neckDraftRevision + 1,
        preview: null,
        drag: null,
        message: null,
      })),
    invalidateNeckDraft: (message) =>
      set((s) =>
        s.neckDraft
          ? {
              neckDraft: {
                ...s.neckDraft,
                pending: true,
                error: message,
                revision: s.neckDraft.revision + 1,
              },
              neckDraftRevision: s.neckDraftRevision + 1,
              preview: s.neckDraft.document,
              message,
            }
          : {},
      ),
    markSaved: (snapshot, generation) =>
      set((s) => {
        if (generation !== undefined && generation !== s.generation) return {}
        return { baseline: cloneDocument(snapshot), dirty: !documentsEqual(snapshot, s.document) }
      }),
    setMessage: (message) => set({ message }),
    newProject: () =>
      set((s) => {
        const d = defaultProject()
        return {
          document: d,
          baseline: cloneDocument(d),
          preview: null,
          neckDraft: null,
          history: [],
          future: [],
          selected: new Set(),
          selectedPickupId: null,
          selectedRearElectronicsCavity: false,
          selectedSegment: null,
          selectedSegmentT: null,
          dirty: false,
          drag: null,
          message: null,
          selectedHeadstock: new Set(),
          editingTarget: 'body',
          activeView: 'front',
          cameras: cameras(),
          revision: s.revision + 1,
          generation: s.generation + 1,
        }
      }),
  }
})
