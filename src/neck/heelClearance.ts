import type { NeckPocketGeometry, Point } from '../geometry/neckPocket'
import { pchipToBezierSegments } from './vendor/pchip'

type Cubic = [Point, Point, Point, Point]
type Plane = { distance: (p: Point) => number; minimum: number }
export const CAP_SAGITTA_MM = 0.0001
const SIDE_TOLERANCE_MM = 1e-8
const CAP_CLEARANCE_MM = 1e-8

function split(p: Cubic): [Cubic, Cubic] {
  const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  const a = mid(p[0], p[1]),
    b = mid(p[1], p[2]),
    c = mid(p[2], p[3])
  const d = mid(a, b),
    e = mid(b, c),
    f = mid(d, e)
  return [
    [p[0], a, d, f],
    [f, e, c, p[3]],
  ]
}

function arcPoints(from: Point, to: Point, center: Point, radius: number): Point[] {
  const start = Math.atan2(from.y - center.y, from.x - center.x)
  let end = Math.atan2(to.y - center.y, to.x - center.x)
  while (end > start + 1e-12) end -= 2 * Math.PI
  const step = 2 * Math.acos(Math.max(-1, 1 - CAP_SAGITTA_MM / radius))
  const count = Math.max(1, Math.ceil((start - end) / step))
  return Array.from({ length: count + 1 }, (_, i) =>
    i === 0
      ? from
      : i === count
        ? to
        : {
            x: center.x + radius * Math.cos(start + ((end - start) * i) / count),
            y: center.y + radius * Math.sin(start + ((end - start) * i) / count),
          },
  )
}

/** Continuous cubic containment, with conservative circular-cap chords. No mouth chord. */
export function assertFretInsideHeel(points: Point[], heel: NeckPocketGeometry): void {
  const left = heel.adjustedLeftSide,
    right = heel.adjustedRightSide,
    r = heel.radiusMm
  const cap =
    r > 0
      ? [
          ...arcPoints(
            heel.leftSideTangent,
            heel.leftEndTangent,
            { x: heel.leftEndTangent.x, y: heel.leftCorner.y - r },
            r,
          ),
          ...arcPoints(
            heel.rightEndTangent,
            heel.rightSideTangent,
            { x: heel.rightEndTangent.x, y: heel.rightCorner.y - r },
            r,
          ),
        ]
      : [heel.leftCorner, heel.rightCorner]
  const planes: Plane[] = [
    {
      distance: (p) => (p.x - left.a * p.y - left.b) / Math.hypot(1, left.a),
      minimum: -SIDE_TOLERANCE_MM,
    },
    {
      distance: (p) => (right.a * p.y + right.b - p.x) / Math.hypot(1, right.a),
      minimum: -SIDE_TOLERANCE_MM,
    },
  ]
  for (let i = 1; i < cap.length; i++) {
    const a = cap[i - 1],
      b = cap[i],
      dx = b.x - a.x,
      dy = b.y - a.y,
      length = Math.hypot(dx, dy)
    if (length < 1e-12) continue
    planes.push({
      distance: (p) => (dy * (p.x - a.x) - dx * (p.y - a.y)) / length,
      minimum: CAP_CLEARANCE_MM,
    })
  }
  const check = (curve: Cubic, candidates: Plane[], depth: number): void => {
    const uncertain = candidates.filter((plane) =>
      curve.some((p) => plane.distance(p) < plane.minimum),
    )
    if (!uncertain.length) return
    if (
      uncertain.some((plane) => [curve[0], curve[3]].some((p) => plane.distance(p) < plane.minimum))
    ) {
      throw new Error(
        'The final fret does not fit within the rounded neck. Increase end clearance or reduce the corner radius.',
      )
    }
    if (depth === 24)
      throw new Error(
        'The gap between the final fret and the end is numerically uncertain. Increase end clearance.',
      )
    const [a, b] = split(curve)
    check(a, uncertain, depth + 1)
    check(b, uncertain, depth + 1)
  }
  for (const c of pchipToBezierSegments(points)) check([c.p0, c.c1, c.c2, c.p1], planes, 0)
}
