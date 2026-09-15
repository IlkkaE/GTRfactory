import type { ProjectDocument } from '../model/project'
import { transformPoint } from '../neck/fretfactoryGeometry'
import type { Point } from '../geometry/outline'

export const BASS_TEMPLATE_IDS = ['bass-4-inline'] as const
export type BassTemplateId = (typeof BASS_TEMPLATE_IDS)[number]
export const isBassTemplate = (id: string): id is BassTemplateId =>
  (BASS_TEMPLATE_IDS as readonly string[]).includes(id)
export const bassPreset = (id: string) => {
  if (id !== 'bass-4-inline') throw new Error('Unknown bass headstock design.')
  return {
    strings: 4,
    frets: 21,
    scale: 863.6,
    nutWidthMm: 44.5,
    nutMin: 42,
    nutMax: 44.5,
    bridgePitchMm: 19,
    widthAt12thMm: 57.6,
  }
}
export const bassParams = (id: BassTemplateId) => {
  const p = bassPreset(id),
    spanNut = p.nutWidthMm - 6
  return {
    strings: p.strings,
    frets: p.frets,
    scaleTreble: p.scale,
    scaleBass: p.scale,
    anchorFret: 7,
    stringSpanNut: spanNut,
    stringSpanBridge: p.bridgePitchMm * (p.strings - 1),
    overhang: 3,
    curvedExponent: 1,
  }
}
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y })
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y })
const mul = (a: Point, n: number): Point => ({ x: a.x * n, y: a.y * n })
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x
const unit = (p: Point): Point => {
  const n = Math.hypot(p.x, p.y)
  return { x: p.x / n, y: p.y / n }
}
const intersect = (a: Point, u: Point, b: Point, v: Point) => {
  const d = cross(u, v)
  if (Math.abs(d) < 1e-9) throw new Error('Bass tuner-row geometry is parallel to a string.')
  return add(a, mul(u, cross(sub(b, a), v) / d))
}
export type BassPost = {
  x: number
  y: number
  r: number
  e: Point
  n: Point
  branch: 1 | -1
  stringIndex: number
  tangent: Point
}
export function bassPosts(document: ProjectDocument): BassPost[] {
  const neck = document.neck
  if (!neck || !isBassTemplate(neck.headstock.activeTemplateId)) return []
  const preset = bassPreset(neck.headstock.activeTemplateId)
  if (neck.params.strings !== preset.strings)
    throw new Error('The selected bass headstock requires its matching string count.')
  const datum = document.body.outline.nodes.find(
    (n) => n.id === document.body.neckJointBoundary?.anchorIds[1],
  )
  if (!datum) throw new Error('The neck joint is missing.')
  const nut = neck.snapshot.nut.map((p) => transformPoint(p, neck.placement, neck.snapshot, datum))
  const bridge = neck.snapshot.bridge.map((p) =>
    transformPoint(p, neck.placement, neck.snapshot, datum),
  )
  const make = (thetaDeg: number) => {
    const theta = (thetaDeg * Math.PI) / 180,
      row = { x: Math.sin(theta), y: -Math.cos(theta) }
    const firstD = unit(sub(nut[1], bridge[1])),
      firstNormal = { x: -firstD.y, y: firstD.x }
    const firstT = add(nut[1], mul(firstD, 54.627636)),
      first = sub(firstT, mul(firstNormal, 7))
    return Array.from({ length: preset.strings }, (_, stringIndex) => {
      const S = nut[stringIndex + 1],
        B = bridge[stringIndex + 1],
        d = unit(sub(S, B)),
        normal = { x: -d.y, y: d.x }
      const C = intersect(sub(S, mul(normal, 7)), d, first, row)
      return {
        ...C,
        r: 8.8,
        e: row,
        n: { x: row.y, y: -row.x },
        branch: 1 as const,
        stringIndex,
        tangent: add(C, mul(normal, 7)),
      }
    })
  }
  const minPitch = (posts: BassPost[]) =>
    Math.min(...posts.slice(1).map((p, i) => Math.hypot(p.x - posts[i].x, p.y - posts[i].y)))
  let lo = 3,
    hi = 20
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (minPitch(make(mid)) >= 47.60075) lo = mid
    else hi = mid
  }
  const result = make(lo)
  if (minPitch(result) < 47.60075 - 1e-7)
    throw new Error('The bass tuner row cannot maintain the minimum GB2 pitch.')
  return result
}
export function bassDerivedLayout(document: ProjectDocument) {
  const posts = bassPosts(document),
    pitch = posts.slice(1).map((p, i) => Math.hypot(p.x - posts[i].x, p.y - posts[i].y))
  return {
    angleDeg: posts[0] ? (Math.atan2(posts[0].e.x, -posts[0].e.y) * 180) / Math.PI : null,
    pitchesMm: pitch,
  }
}
export function validateBassPolicy(document: ProjectDocument) {
  const neck = document.neck
  if (!neck || !isBassTemplate(neck.headstock.activeTemplateId)) return
  const preset = bassPreset(neck.headstock.activeTemplateId),
    p = neck.params
  if (
    p.strings !== preset.strings ||
    p.frets !== preset.frets ||
    p.scaleTreble !== preset.scale ||
    p.scaleBass !== preset.scale ||
    p.anchorFret !== 7 ||
    p.overhang !== 3 ||
    p.curvedExponent !== 1 ||
    Math.abs(p.stringSpanBridge - preset.bridgePitchMm * (preset.strings - 1)) > 1e-8
  )
    throw new Error(
      'This bass headstock locks string count, scale length, fret count, and bridge spacing.',
    )
  if (
    !neck.physicalProfile ||
    neck.physicalProfile.widthAt12thMm !== preset.widthAt12thMm ||
    Math.abs(neck.physicalProfile.nutWidthMm - (p.stringSpanNut + 2 * p.overhang)) > 1e-8
  )
    throw new Error('The bass headstock requires its matching physical neck profile.')
  const width = p.stringSpanNut + 2 * p.overhang
  if (width < preset.nutMin - 1e-8 || width > preset.nutMax + 1e-8)
    throw new Error(
      `This bass headstock requires a ${preset.nutMin}–${preset.nutMax} mm nut width.`,
    )
}
export function validateInstrumentPolicy(document: ProjectDocument) {
  const neck = document.neck
  if (!neck) return
  if (isBassTemplate(neck.headstock.activeTemplateId)) validateBassPolicy(document)
  else if (neck.physicalProfile !== null)
    throw new Error('A guitar headstock cannot carry a bass physical neck profile.')
}
