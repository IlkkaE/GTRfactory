import type { Point } from '../geometry/outline'
export const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y })
export const mul = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k })
export const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y
export const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x
export const norm = (a: Point) => Math.hypot(a.x, a.y)
export const unit = (a: Point) => mul(a, 1 / norm(a))
export const distance = (a: Point, b: Point) => norm(sub(a, b))
export const TOL = 0.005
export function segmentDistance(p: Point, a: Point, b: Point) {
  const d = sub(b, a),
    n = dot(d, d)
  return distance(p, add(a, mul(d, n ? Math.max(0, Math.min(1, dot(sub(p, a), d) / n)) : 0)))
}
export function inside(p: Point, polygon: Point[]) {
  let yes = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) yes = !yes
  }
  return yes
}
export function segmentsCross(a: Point, b: Point, c: Point, d: Point) {
  const u = sub(b, a),
    v = sub(d, c),
    det = cross(u, v),
    w = sub(c, a)
  if (Math.abs(det) < 1e-10) {
    if (Math.abs(cross(w, u)) > 1e-8) return false
    const len = dot(u, u)
    if (!len) return segmentDistance(a, c, d) < 1e-8
    const lo = dot(w, u) / len,
      hi = dot(sub(d, a), u) / len
    return Math.min(1, Math.max(lo, hi)) - Math.max(0, Math.min(lo, hi)) > 1e-9
  }
  const t = cross(w, v) / det,
    s = cross(w, u) / det
  return t >= -1e-9 && t <= 1 + 1e-9 && s >= -1e-9 && s <= 1 + 1e-9
}
export function flattenCubic(a: Point, b: Point, c: Point, d: Point): Point[] {
  const out: Point[] = [a]
  let work = 0
  const recur = (p: Point, q: Point, r: Point, s: Point, depth: number) => {
    if (++work > 16000 || depth > 24)
      throw new Error('The headstock curve exceeds the calculation precision limit.')
    if (Math.max(segmentDistance(q, p, s), segmentDistance(r, p, s)) <= TOL) {
      out.push(s)
      return
    }
    const pq = mul(add(p, q), 0.5),
      qr = mul(add(q, r), 0.5),
      rs = mul(add(r, s), 0.5),
      pqr = mul(add(pq, qr), 0.5),
      qrs = mul(add(qr, rs), 0.5),
      mid = mul(add(pqr, qrs), 0.5)
    recur(p, pq, pqr, mid, depth + 1)
    recur(mid, qrs, rs, s, depth + 1)
  }
  recur(a, b, c, d, 0)
  return out
}
export function boundaryDistance(a: Point[], b: Point[]) {
  let result = Infinity
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++) {
      const p = a[i],
        q = a[(i + 1) % a.length],
        r = b[j],
        s = b[(j + 1) % b.length]
      if (segmentsCross(p, q, r, s)) return 0
      result = Math.min(
        result,
        segmentDistance(p, r, s),
        segmentDistance(q, r, s),
        segmentDistance(r, p, q),
        segmentDistance(s, p, q),
      )
    }
  return result
}
export const overlaps = (a: Point[], b: Point[]) =>
  a.some((p) => inside(p, b)) || b.some((p) => inside(p, a)) || boundaryDistance(a, b) < 1e-9
export const insideClearance = (shape: Point[], wood: Point[]) =>
  shape.every((p) => inside(p, wood)) ? boundaryDistance(shape, wood) : -1
export const outsideClearance = (shape: Point[], wood: Point[]) =>
  overlaps(shape, wood) ? -1 : boundaryDistance(shape, wood)
export const pairClearance = (a: Point[], b: Point[]) =>
  overlaps(a, b) ? -1 : boundaryDistance(a, b)
export function diskClearance(p: Point, r: number, wood: Point[]) {
  return (
    (inside(p, wood) ? 1 : -1) *
      Math.min(...wood.map((a, i) => segmentDistance(p, a, wood[(i + 1) % wood.length]))) -
    r
  )
}
export function selfIntersects(points: Point[]) {
  if (points.length > 6000)
    throw new Error('The headstock shape exceeds the calculation technical limit.')
  let work = 0
  for (let i = 0; i < points.length; i++)
    for (let j = i + 2; j < points.length; j++) {
      if (i === 0 && j === points.length - 1) continue
      if (++work > 4000000)
        throw new Error(
          'The headstock self-intersection check exceeds the calculation technical limit.',
        )
      const a = points[i],
        b = points[(i + 1) % points.length],
        c = points[j],
        d = points[(j + 1) % points.length]
      if (
        Math.max(a.x, b.x) < Math.min(c.x, d.x) ||
        Math.max(c.x, d.x) < Math.min(a.x, b.x) ||
        Math.max(a.y, b.y) < Math.min(c.y, d.y) ||
        Math.max(c.y, d.y) < Math.min(a.y, b.y)
      )
        continue
      if (segmentsCross(a, b, c, d)) return true
    }
  return false
}
/** Same winding branch as the measured reference. The coordinate conversion preserves orientation. */
export function tangent(S: Point, C: Point): Point | null {
  const q = sub(C, S),
    d2 = dot(q, q),
    r = 3
  if (d2 <= r * r) return null
  return add(
    S,
    add(mul(q, 1 - (r * r) / d2), mul({ x: -q.y, y: q.x }, (r * Math.sqrt(d2 - r * r)) / d2)),
  )
}
export const angleDeg = (u: Point, v: Point) =>
  (Math.abs(Math.atan2(cross(u, v), dot(u, v))) * 180) / Math.PI
