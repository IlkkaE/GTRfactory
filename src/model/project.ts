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

export interface BodyColorOption {
  id: string
  name: string
  hex: string
}

export const BODY_COLOR_OPTIONS: BodyColorOption[] = [
  { id: 'classic-slate', name: 'Classic Slate', hex: '#254148' },
  { id: 'olympic-white', name: 'Olympic White', hex: '#f2f0e6' },
  { id: 'onyx-black', name: 'Onyx Black', hex: '#1b1e20' },
  { id: 'fiesta-red', name: 'Fiesta Red', hex: '#bd332a' },
  { id: 'candy-apple-red', name: 'Candy Apple Red', hex: '#7d181c' },
  { id: 'butterscotch-blonde', name: 'Butterscotch Blonde', hex: '#deb258' },
  { id: 'surf-green', name: 'Surf Green', hex: '#6da894' },
  { id: 'lake-placid-blue', name: 'Lake Placid Blue', hex: '#2d677e' },
  { id: 'sunburst-amber', name: 'Sunburst Amber', hex: '#a65922' },
  { id: 'sherwood-green', name: 'Sherwood Green', hex: '#204537' },
]

export interface BodyTextureOption {
  id: string
  name: string
  image: string
  previewColor: string
}

export const BODY_TEXTURE_OPTIONS: BodyTextureOption[] = [
  { id: 'walnut', name: 'Walnut', image: '/textures/walnut.jpg', previewColor: '#4a3324' },
  { id: 'swamp-ash', name: 'Swamp Ash', image: '/textures/swamp-ash.jpg', previewColor: '#d6b88d' },
  { id: 'maple', name: 'Maple', image: '/textures/maple.jpg', previewColor: '#eed7b5' },
  {
    id: 'figured-maple',
    name: 'Figured Maple',
    image: '/textures/figured-maple.jpg',
    previewColor: '#cc8e41',
  },
]

export const DEFAULT_BODY_COLOR = '#254148'

export interface ProjectDocument {
  format: 'gtrfactory-project'
  version: 13
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
    color?: string
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
  /** Absolute rotation in the canonical right-handed coordinate system. */
  angleDeg: number
  /** Local outer bounds before rotation. */
  widthMm: number
  lengthMm: number
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
    version: 13,
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
      color: DEFAULT_BODY_COLOR,
    },
    neck: null,
    pickupCavities: [],
  }
}
