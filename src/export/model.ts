import type { Point } from '../geometry/neckPocket'
export type ExportRole =
  | 'CUT_OUTER'
  | 'ROUTE_PICKUP'
  | 'ROUTE_NECK_POCKET'
  | 'ROUTE_REAR_INNER'
  | 'ROUTE_REAR_RECESS'
  | 'DRILL_TUNER'
  | 'FRET_GUIDE'
  | 'REFERENCE'
  | 'REFERENCE_DIMENSIONS'
  | 'REFERENCE_CENTERLINE'
export type ExportSegment =
  | { type: 'line'; from: Point; to: Point }
  | { type: 'cubicBezier'; from: Point; control1: Point; control2: Point; to: Point }
  | {
      type: 'circularArc'
      from: Point
      to: Point
      center?: Point
      radiusMm: number
      sweep: 0 | 1
      largeArc?: 0 | 1
    }
export type ExportPath = {
  role: ExportRole
  segments: ExportSegment[]
  closed?: boolean
  name?: string
}
export type ExportCircle = { role: ExportRole; center: Point; radiusMm: number; name?: string }
export type Rect = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}
export type ExportPart =
  'front' | 'back' | 'neck' | 'fretboard' | 'headstock' | 'pocket' | 'overview'
export type Measurement = {
  group: string
  label: string
  value: number
  text?: string
  count?: boolean
  unit?: 'deg'
}
export type PartDrawing = {
  id: ExportPart
  name: string
  paths: ExportPath[]
  circles: ExportCircle[]
  bounds: Rect
}
export type ExportText = { x: number; y: number; text: string; size: number; role: ExportRole }
export type MeasurementBox = { bounds: Rect; texts: ExportText[] }
export type ExportDrawing = {
  name: string
  parts: PartDrawing[]
  paths: ExportPath[]
  circles: ExportCircle[]
  bounds: Rect
  geometryBounds: Rect
  measurements: Measurement[]
  texts: ExportText[]
  table: MeasurementBox | null
}
export type ExportOptions = {
  parts: ExportPart[]
  includePickups: boolean
  includeElectronics: boolean
  includeCenterlines: boolean
  includeReferences: boolean
  includeFretGuides: boolean
  includeMeasurements: boolean
  allMeasurements: boolean
  includeNames: boolean
  includeCalibration: boolean
  measurementUnit: 'mm' | 'in' | 'both'
  marginMm: number
}
export const PART_NAMES: Record<ExportPart, string> = {
  front: 'Body - front',
  back: 'Body - back',
  neck: 'Neck (including headstock)',
  fretboard: 'Fretboard',
  headstock: 'Headstock',
  pocket: 'Neck pocket',
  overview: 'Assembled front view (reference)',
}
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  parts: ['front'],
  includePickups: true,
  includeElectronics: true,
  includeCenterlines: true,
  includeReferences: true,
  includeFretGuides: true,
  includeMeasurements: true,
  allMeasurements: false,
  includeNames: true,
  includeCalibration: true,
  measurementUnit: 'mm',
  marginMm: 10,
}
