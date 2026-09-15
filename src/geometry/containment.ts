import { cubicAt, segmentPoints, type Point } from './outline'
import type { OutlineNode } from '../model/project'
export type FlatSegment = {
  type: 'line' | 'cubicBezier'
  from: Point
  to: Point
  control1?: Point
  control2?: Point
}
export type ContainmentResult = {
  class: 'invalid' | 'unsupported'
  code: string
  message: string
} | null
const TOL = 0.01,
  CONTACT = 0.03,
  MAX = 20000
const distance = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x,
    dy = b.y - a.y
  const z = dx * dx + dy * dy
  if (!z) return Math.hypot(p.x - a.x, p.y - a.y)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / z))
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}
function cubic(a: Point, b: Point, c: Point, d: Point, out: Point[], depth = 0) {
  if (Math.max(distance(b, a, d), distance(c, a, d)) <= TOL) {
    if (out.length >= MAX) throw new Error('budget')
    out.push(d)
    return
  }
  if (depth >= 18 || out.length >= MAX) throw new Error('budget')
  const m = (p: Point, q: Point) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }),
    ab = m(a, b),
    bc = m(b, c),
    cd = m(c, d),
    abc = m(ab, bc),
    bcd = m(bc, cd),
    mid = m(abc, bcd)
  cubic(a, ab, abc, mid, out, depth + 1)
  cubic(mid, bcd, cd, d, out, depth + 1)
}
export function flattenContour(segments: FlatSegment[]) {
  if (!segments.length) return []
  const out = [segments[0].from]
  for (const s of segments) {
    if (out.length >= MAX) throw new Error('budget')
    s.type === 'line' ? out.push(s.to) : cubic(s.from, s.control1!, s.control2!, s.to, out)
  }
  out.pop()
  return out
}
export function flattenOutline(nodes: OutlineNode[]) {
  return flattenContour(
    nodes.map((n, i) => {
      const s = segmentPoints(nodes, i)
      return n.outgoing === 'line'
        ? { type: 'line' as const, from: s.p0, to: s.p3 }
        : { type: 'cubicBezier' as const, from: s.p0, control1: s.p1, control2: s.p2, to: s.p3 }
    }),
  )
}
type E = { a: Point; b: Point }
const edges = (a: Point[]) => a.map((p, i) => ({ a: p, b: a[(i + 1) % a.length] }))
const turn = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
function contact(a: E, b: E) {
  const u = turn(a.a, a.b, b.a),
    v = turn(a.a, a.b, b.b),
    w = turn(b.a, b.b, a.a),
    z = turn(b.a, b.b, a.b)
  return (
    (u * v < 0 && w * z < 0) ||
    Math.min(
      distance(a.a, b.a, b.b),
      distance(a.b, b.a, b.b),
      distance(b.a, a.a, a.b),
      distance(b.b, a.a, a.b),
    ) <= CONTACT
  )
}
export function polygonContains(poly: Point[], p: Point) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
    if (
      poly[i].y > p.y !== poly[j].y > p.y &&
      p.x < ((poly[j].x - poly[i].x) * (p.y - poly[i].y)) / (poly[j].y - poly[i].y) + poly[i].x
    )
      inside = !inside
  return inside
}
export function selfIntersects(poly: Point[]) {
  const list = edges(poly)
  return list.some((a, i) =>
    list.some((b, j) => {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === list.length - 1)) return false
      const u = turn(a.a, a.b, b.a),
        v = turn(a.a, a.b, b.b),
        w = turn(b.a, b.b, a.a),
        z = turn(b.a, b.b, a.b)
      return u * v < -1e-12 && w * z < -1e-12
    }),
  )
}
export function containment(body: Point[], route: Point[]): ContainmentResult {
  if (body.length < 3 || route.length < 3)
    return {
      class: 'unsupported',
      code: 'empty-contour',
      message: 'The cavity or body contour cannot be checked.',
    }
  if (selfIntersects(body))
    return {
      class: 'unsupported',
      code: 'invalid-body-outline',
      message: 'The body outline self-intersects; the cavity cannot be checked reliably.',
    }
  if (selfIntersects(route))
    return {
      class: 'unsupported',
      code: 'invalid-route',
      message: 'The cavity outline cannot be checked reliably.',
    }
  if (!route.every((p) => polygonContains(body, p)))
    return {
      class: 'invalid',
      code: 'outside',
      message: 'The electronics cavity is outside the body. Move or reduce it.',
    }
  const bodyEdges = edges(body),
    routeEdges = edges(route)
  if (bodyEdges.some((a) => routeEdges.some((b) => contact(a, b))))
    return {
      class: 'invalid',
      code: 'contact',
      message: 'The electronics cavity touches or intersects the body edge.',
    }
  return null
}
