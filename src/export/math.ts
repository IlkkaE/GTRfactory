import type { Point } from '../geometry/neckPocket'
import type { ExportSegment, ExportPath, ExportCircle, Rect } from './model'
export const rect = (minX: number, minY: number, maxX: number, maxY: number): Rect => ({
  minX,
  minY,
  maxX,
  maxY,
  width: maxX - minX,
  height: maxY - minY,
})
export const union = (items: Rect[]) =>
  items.length
    ? rect(
        Math.min(...items.map((b) => b.minX)),
        Math.min(...items.map((b) => b.minY)),
        Math.max(...items.map((b) => b.maxX)),
        Math.max(...items.map((b) => b.maxY)),
      )
    : rect(0, 0, 0, 0)
export const rectOverlap = (a: Rect, b: Rect) =>
  a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
const TAU = 2 * Math.PI
export function arcData(s: Extract<ExportSegment, { type: 'circularArc' }>) {
  const dx = s.to.x - s.from.x,
    dy = s.to.y - s.from.y,
    len = Math.hypot(dx, dy),
    r = s.radiusMm
  if (!(r > 0) || len > 2 * r + 1e-6 || len < 1e-9)
    throw new Error('The export arc radius or endpoints are invalid.')
  const factor =
    ((s.sweep ? 1 : -1) * (s.largeArc ? -1 : 1) * Math.sqrt(Math.max(0, r * r - (len * len) / 4))) /
    len
  const center = s.center ?? {
    x: (s.from.x + s.to.x) / 2 - dy * factor,
    y: (s.from.y + s.to.y) / 2 + dx * factor,
  }
  const start = Math.atan2(s.from.y - center.y, s.from.x - center.x)
  let delta = Math.atan2(s.to.y - center.y, s.to.x - center.x) - start
  if (s.sweep) {
    while (delta < 0) delta += TAU
  } else {
    while (delta > 0) delta -= TAU
  }
  return { center, start, delta, r }
}
export function at(s: ExportSegment, t: number): Point {
  if (s.type === 'line')
    return { x: s.from.x + (s.to.x - s.from.x) * t, y: s.from.y + (s.to.y - s.from.y) * t }
  if (s.type === 'circularArc') {
    const a = arcData(s),
      v = a.start + a.delta * t
    return { x: a.center.x + a.r * Math.cos(v), y: a.center.y + a.r * Math.sin(v) }
  }
  const u = 1 - t
  return {
    x:
      u * u * u * s.from.x +
      3 * u * u * t * s.control1.x +
      3 * u * t * t * s.control2.x +
      t * t * t * s.to.x,
    y:
      u * u * u * s.from.y +
      3 * u * u * t * s.control1.y +
      3 * u * t * t * s.control2.y +
      t * t * t * s.to.y,
  }
}
export function segmentBounds(s: ExportSegment): Rect {
  const ps = [s.from, s.to]
  if (s.type === 'cubicBezier') {
    for (const k of ['x', 'y'] as const) {
      const a = -s.from[k] + 3 * s.control1[k] - 3 * s.control2[k] + s.to[k],
        b = 2 * (s.from[k] - 2 * s.control1[k] + s.control2[k]),
        c = s.control1[k] - s.from[k]
      const roots =
        Math.abs(a) < 1e-12
          ? Math.abs(b) > 1e-12
            ? [-c / b]
            : []
          : b * b - 4 * a * c >= 0
            ? [
                (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a),
                (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a),
              ]
            : []
      for (const t of roots) if (t > 0 && t < 1) ps.push(at(s, t))
    }
  } else if (s.type === 'circularArc') {
    const a = arcData(s)
    for (let i = -8; i <= 8; i++) {
      const t = ((i * Math.PI) / 2 - a.start) / a.delta
      if (t > 0 && t < 1) ps.push(at(s, t))
    }
  }
  return rect(
    Math.min(...ps.map((p) => p.x)),
    Math.min(...ps.map((p) => p.y)),
    Math.max(...ps.map((p) => p.x)),
    Math.max(...ps.map((p) => p.y)),
  )
}
export function boundsOf(paths: ExportPath[], circles: ExportCircle[] = []): Rect {
  return union([
    ...paths.flatMap((p) => p.segments.map(segmentBounds)),
    ...circles.map((c) =>
      rect(
        c.center.x - c.radiusMm,
        c.center.y - c.radiusMm,
        c.center.x + c.radiusMm,
        c.center.y + c.radiusMm,
      ),
    ),
  ])
}
export function mapSegment(
  s: ExportSegment,
  fn: (p: Point) => Point,
  mirror = false,
): ExportSegment {
  if (s.type === 'line') return { ...s, from: fn(s.from), to: fn(s.to) }
  if (s.type === 'cubicBezier')
    return {
      ...s,
      from: fn(s.from),
      to: fn(s.to),
      control1: fn(s.control1),
      control2: fn(s.control2),
    }
  return {
    ...s,
    from: fn(s.from),
    to: fn(s.to),
    center: s.center ? fn(s.center) : undefined,
    sweep: mirror ? (s.sweep ? 0 : 1) : s.sweep,
  }
}
export function arcCubics(s: Extract<ExportSegment, { type: 'circularArc' }>): ExportSegment[] {
  const a = arcData(s)
  // Tramos cortos: error radial muy inferior a 0,01 mm, también en radios grandes.
  const n = Math.max(
    1,
    Math.ceil(Math.abs(a.delta) / (Math.PI / 8)),
    Math.ceil(Math.abs(a.delta) * Math.pow(a.r / 0.001, 1 / 6)),
  )
  return Array.from({ length: n }, (_, i) => {
    const start = a.start + (a.delta * i) / n,
      end = a.start + (a.delta * (i + 1)) / n,
      k = (4 / 3) * Math.tan((end - start) / 4),
      p = at(s, i / n),
      q = at(s, (i + 1) / n)
    return {
      type: 'cubicBezier',
      from: p,
      to: q,
      control1: { x: p.x - k * a.r * Math.sin(start), y: p.y + k * a.r * Math.cos(start) },
      control2: { x: q.x + k * a.r * Math.sin(end), y: q.y - k * a.r * Math.cos(end) },
    } as ExportSegment
  })
}
export function segmentHits(s: ExportSegment, b: Rect, depth = 0): boolean {
  const sb = segmentBounds(s)
  if (!rectOverlap(sb, b)) return false
  if (sb.minX >= b.minX && sb.maxX <= b.maxX && sb.minY >= b.minY && sb.maxY <= b.maxY) return true
  if (depth >= 16 || Math.max(sb.width, sb.height) < 0.02) return true
  if (s.type === 'line') {
    let lo = 0,
      hi = 1
    const dx = s.to.x - s.from.x,
      dy = s.to.y - s.from.y
    for (const [p, q] of [
      [-dx, s.from.x - b.minX],
      [dx, b.maxX - s.from.x],
      [-dy, s.from.y - b.minY],
      [dy, b.maxY - s.from.y],
    ]) {
      if (p === 0) {
        if (q < 0) return false
      } else {
        const t = q / p
        if (p < 0) lo = Math.max(lo, t)
        else hi = Math.min(hi, t)
        if (lo > hi) return false
      }
    }
    return true
  }
  if (s.type === 'circularArc') return arcCubics(s).some((c) => segmentHits(c, b, depth + 1))
  const mid = (p: Point, q: Point) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 })
  const p = mid(s.from, s.control1),
    q = mid(s.control1, s.control2),
    r = mid(s.control2, s.to),
    u = mid(p, q),
    v = mid(q, r),
    w = mid(u, v)
  return (
    segmentHits({ ...s, control1: p, control2: u, to: w }, b, depth + 1) ||
    segmentHits({ ...s, from: w, control1: v, control2: r }, b, depth + 1)
  )
}
