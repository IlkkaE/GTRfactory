/**
 * Restricted FretFactory geometry adapter.
 * Origin: FretFactory commit 89f94c0e693b75528a41ac8fd8b682c04899f7fb,
 * src/geom/core.ts, curved.ts, naming.ts and pchip.ts.  The verbatim files
 * live in ./vendor; this adapter only maps their output into GTR's contract.
 * only the pure calculation contract; UI, URL state and exports are excluded.
 */
import type { NeckParams, NeckPoint, NeckSnapshot, NeckDocument } from '../model/project'
import { computeCurvedFretsRaw, computeCurvedNutBridge } from './vendor/curved'
import { pchipToBezierSegments } from './vendor/pchip'

const finite = (name: string, n: number) => {
  if (!Number.isFinite(n)) throw new Error(`${name} is not finite.`)
  return n
}
export const DEFAULT_JOIN_FRET = 17
export const DEFAULT_FRETBOARD_OVERHANG_MM = 6.35
export const DEFAULT_NECK: NeckParams = {
  strings: 6,
  frets: 22,
  scaleTreble: 647.7,
  scaleBass: 647.7,
  anchorFret: 7,
  stringSpanNut: 35.814,
  stringSpanBridge: 49.784,
  overhang: 3.048,
  curvedExponent: 1,
}
export function validateNeckParams(p: NeckParams) {
  for (const [key, value] of Object.entries(p)) finite(key, value)
  if (
    !Number.isInteger(p.strings) ||
    p.strings < 1 ||
    p.strings > 12 ||
    !Number.isInteger(p.frets) ||
    p.frets < 1 ||
    p.frets > 36
  )
    throw new Error('The number of strings or frets is invalid.')
  // Same supported ranges as the pinned FretFactory stateValidation.ts. Reject, never clamp.
  const ranges: Array<[keyof NeckParams, number, number, string]> = [
    ['scaleTreble', 100, 1000, 'Treble scale length'],
    ['scaleBass', 100, 1200, 'Bass scale length'],
    ['stringSpanNut', 10, 100, 'String spacing at the nut'],
    ['stringSpanBridge', 10, 120, 'String spacing at the bridge'],
    ['overhang', 0, 20, 'Edge clearance'],
    ['curvedExponent', 0.01, 10, 'Curve exponent'],
  ]
  for (const [key, min, max, label] of ranges)
    if (p[key] < min || p[key] > max)
      throw new Error(
        `${label}: the permitted range is ${min}–${max}${key === 'curvedExponent' ? '' : ' mm'}.`,
      )
  if (!Number.isInteger(p.anchorFret) || p.anchorFret < 0 || p.anchorFret > p.frets)
    throw new Error('The straight-fret number must be within 0–the number of frets.')
}
/** Same calculation semantics as the pinned FretFactory source: bass index 0 is left. */
export function calculateNeck(
  p: NeckParams,
  endMarginMm: number,
  fretboardEndMarginMm = endMarginMm + DEFAULT_FRETBOARD_OVERHANG_MM,
  physicalProfile: NeckDocument['physicalProfile'] = null,
): NeckSnapshot {
  validateNeckParams(p)
  finite('Neck end clearance', endMarginMm)
  finite('Fretboard end clearance', fretboardEndMarginMm)
  if (endMarginMm < 0) throw new Error('Neck end clearance cannot be negative.')
  if (fretboardEndMarginMm <= endMarginMm)
    throw new Error('Fretboard end clearance must be greater than neck end clearance.')
  const args = [
    p.strings,
    p.scaleTreble,
    p.scaleBass,
    p.anchorFret,
    p.stringSpanNut,
    p.stringSpanBridge,
    p.overhang,
    p.curvedExponent,
  ] as const
  const nb = computeCurvedNutBridge(...args)
  const rows = computeCurvedFretsRaw(
    p.strings,
    p.frets,
    p.scaleTreble,
    p.scaleBass,
    p.anchorFret,
    p.stringSpanNut,
    p.stringSpanBridge,
    p.overhang,
    p.curvedExponent,
  )
  const line = (a: [number, number], b: [number, number]) => {
    const slope = (b[0] - a[0]) / (b[1] - a[1])
    return { a: slope, b: a[0] - slope * a[1] }
  }
  let left = line([nb.nut.x_left, nb.nut.y_left], [nb.bridge.x_left, nb.bridge.y_left])
  let right = line([nb.nut.x_right, nb.nut.y_right], [nb.bridge.x_right, nb.bridge.y_right])
  const frets = rows.map((row) => ({ n: row.n, points: row.pts }))
  const nut = nb.nut.pts,
    bridge = nb.bridge.pts
  if (physicalProfile) {
    const nutY = nut[1].y,
      reference = frets.find((f) => f.n === 12)
    if (!reference) throw new Error('The physical bass profile requires the twelfth fret.')
    const referenceY = reference.points[1].y
    const slope =
      (physicalProfile.widthAt12thMm - physicalProfile.nutWidthMm) / (2 * (referenceY - nutY))
    left = { a: -slope, b: -physicalProfile.nutWidthMm / 2 + slope * nutY }
    right = { a: slope, b: physicalProfile.nutWidthMm / 2 - slope * nutY }
    const resizeEdges = (points: NeckPoint[]) => {
      const a = points[0],
        b = points.at(-1)!
      points[0] = { x: left.a * a.y + left.b, y: a.y }
      points[points.length - 1] = { x: right.a * b.y + right.b, y: b.y }
    }
    resizeEdges(nut)
    resizeEdges(bridge)
    frets.forEach((f) => resizeEdges(f.points))
  }
  const lastFretMaxY = Math.max(...frets.at(-1)!.points.map((q) => q.y)),
    heelEndY = lastFretMaxY + endMarginMm,
    fretboardEndY = lastFretMaxY + fretboardEndMarginMm
  return {
    leftSide: { a: left.a, b: left.b },
    rightSide: { a: right.a, b: right.b },
    nut,
    bridge,
    frets,
    lastFretMaxY,
    heelEndY,
    fretboardEndY,
  }
}
export function transformPoint(
  p: NeckPoint,
  placement: { joinFret: number; offsetMm: number },
  snapshot: NeckSnapshot,
  datum: NeckPoint,
): NeckPoint {
  const join = joinIntersection(snapshot, placement.joinFret)
  return { x: p.x + datum.x, y: p.y - join.y + datum.y + placement.offsetMm }
}
/** Exact PCHIP representation of the selected fret, intersected with x = 0. */
export function joinIntersection(snapshot: NeckSnapshot, n: number): NeckPoint {
  const fret = snapshot.frets.find((f) => f.n === n)
  if (!fret) throw new Error('The joint fret cannot be found.')
  const seg = pchipToBezierSegments(fret.points).find((s) => s.p0.x <= 0 && s.p1.x >= 0)
  if (!seg) throw new Error('The joint fret does not intersect the neck centreline.')
  let lo = 0,
    hi = 1
  const point = (t: number) => {
    const u = 1 - t
    return {
      x:
        u ** 3 * seg.p0.x + 3 * u * u * t * seg.c1.x + 3 * u * t * t * seg.c2.x + t ** 3 * seg.p1.x,
      y:
        u ** 3 * seg.p0.y + 3 * u * u * t * seg.c1.y + 3 * u * t * t * seg.c2.y + t ** 3 * seg.p1.y,
    }
  }
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2
    if (point(mid).x < 0) lo = mid
    else hi = mid
  }
  return point((lo + hi) / 2)
}
export function translatedSides(
  snapshot: NeckSnapshot,
  placement: { joinFret: number; offsetMm: number },
  datum: NeckPoint,
) {
  const join = joinIntersection(snapshot, placement.joinFret),
    dx = datum.x,
    dy = datum.y + placement.offsetMm - join.y
  const move = (side: { a: number; b: number }) => ({ a: side.a, b: side.b + dx - side.a * dy })
  return { left: move(snapshot.leftSide), right: move(snapshot.rightSide) }
}
