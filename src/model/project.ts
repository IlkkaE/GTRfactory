import starterNodes from './starter.json' with { type: 'json' }
import type { HeadstockDocument } from '../headstock/template'
export type Unit = 'mm' | 'in'
export type Handedness = 'right' | 'left'
export type NodeKind = 'smooth' | 'corner'
export type Outgoing = 'line' | 'cubicBezier'
export interface Vec {
  dx: number
  dy: number
}
export interface OutlineNode {
  id: string
  x: number
  y: number
  kind: NodeKind
  inHandle: Vec | null
  outHandle: Vec | null
  outgoing: Outgoing
}
export interface ProjectDocument {
  format: 'gtrfactory-project'
  version: 11
  handedness: Handedness
  units: 'mm'
  name: string
  coordinateSystem: 'centerline-neck-joint-mouth-down'
  starter: { id: 'gtr-strat-v1'; version: 1 | 2 }
  body: {
    outline: { closed: true; nodes: OutlineNode[] }
    neckJointBoundary: NeckJointBoundary | null
    neckPocket: NeckPocketParams | null
    rearElectronicsCavity: RearElectronicsCavity | null
  }
  /** v4 owns one calculated neck. A v3 pocket remains a clearly labelled legacy draft. */
  neck: NeckDocument | null
  pickupCavities: PickupCavity[]
}
export interface RearElectronicsCavity {
  profileId: 'potero-v1'
  profileVersion: 1
  centerXmm: number
  centerYmm: number
  horizontalMm: number
  verticalMm: number
}
export interface PickupCavity {
  id: string
  profileId: string
  profileVersion: number
  centerYmm: number
}
export interface NeckJointBoundary {
  anchorIds: string[]
  segmentStartIds: string[]
}
export interface NeckPocketParams {
  datumNodeId: string
  referenceBoundaryNodes: { left: OutlineNode; center: OutlineNode; right: OutlineNode }
  mouthWinding: 'right-to-left'
  mouthWidthMm: number
  heelWidthMm: number
  lengthMm: number
  fitAllowanceMm: number
  radiusMm: number
}
export interface NeckParams {
  strings: number
  frets: number
  scaleTreble: number
  scaleBass: number
  anchorFret: number
  stringSpanNut: number
  stringSpanBridge: number
  overhang: number
  curvedExponent: number
}
export interface NeckPlacement {
  joinFret: number
  offsetMm: number
}
export interface NeckEnd {
  endMarginMm: number
  fretboardEndMarginMm: number
  radiusMm: number
  fitAllowanceMm: number
}
export interface NeckPoint {
  x: number
  y: number
}
export interface NeckSnapshot {
  leftSide: { a: number; b: number }
  rightSide: { a: number; b: number }
  nut: NeckPoint[]
  bridge: NeckPoint[]
  frets: Array<{ n: number; points: NeckPoint[] }>
  lastFretMaxY: number
  heelEndY: number
  fretboardEndY: number
}
export interface NeckDocument {
  calculationVersion: 'fretfactory-89f94c0e'
  params: NeckParams
  placement: NeckPlacement
  end: NeckEnd
  snapshot: NeckSnapshot
  headstock: HeadstockDocument
  /** Bass presets keep the wood outline independent from string-line geometry. */
  physicalProfile: { nutWidthMm: number; widthAt12thMm: number } | null
  /** Immutable mouth reference prevents repeated automatic fitting from accumulating. */
  referenceBoundaryNodes: { left: OutlineNode; center: OutlineNode; right: OutlineNode }
}
export const MAX_COORD = 1_000_000
export const MAX_NODES = 2000
export const MAX_PICKUP_CAVITIES = 64
export const MAX_BYTES = 2 * 1024 * 1024
export const validNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= MAX_COORD
export const nodeId = () => `node-${crypto.randomUUID()}`
export const cloneDocument = (document: ProjectDocument): ProjectDocument =>
  structuredClone(document)
/** The immutable starter outline used by the body comparison/reset tools. */
export const starterBodyOutline = (): OutlineNode[] =>
  structuredClone(starterNodes) as OutlineNode[]
// User-supplied bodytemplate source, transformed to the editor's millimetre coordinates.
export function createStarterDocument(): ProjectDocument {
  return {
    format: 'gtrfactory-project',
    version: 11,
    handedness: 'right',
    units: 'mm',
    name: '',
    coordinateSystem: 'centerline-neck-joint-mouth-down',
    starter: { id: 'gtr-strat-v1', version: 2 },
    body: {
      outline: { closed: true, nodes: starterBodyOutline() },
      neckJointBoundary: {
        anchorIds: ['starter-21', 'starter-01', 'starter-02'],
        segmentStartIds: ['starter-21', 'starter-01'],
      },
      neckPocket: null,
      rearElectronicsCavity: {
        profileId: 'potero-v1',
        profileVersion: 1,
        centerXmm: 0,
        centerYmm: 210,
        horizontalMm: 176.06686788504933,
        verticalMm: 81.36283544639431,
      },
    },
    neck: null,
    pickupCavities: [],
  }
}
