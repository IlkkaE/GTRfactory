import { cubicAt, lerp, segmentPoints, type Point } from '../geometry/outline'
import type { OutlineNode } from '../model/project'
const distance2 = (a: Point, b: Point) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2
const evaluate = (coefficients: number[], t: number) =>
  coefficients.reduceRight((value, c) => value * t + c, 0)

// Las raíces de la derivada separan intervalos monótonos: buscamos todos los mínimos.
function rootsInUnitInterval(input: number[]): number[] {
  const scale = Math.max(...input.map(Math.abs))
  if (!scale) return []
  const c = input.map((value) => value / scale)
  while (c.length > 1 && Math.abs(c.at(-1)!) < 1e-14) c.pop()
  if (c.length === 1) return []
  if (c.length === 2) {
    const t = -c[0] / c[1]
    return t > 0 && t < 1 ? [t] : []
  }
  const critical = rootsInUnitInterval(c.slice(1).map((value, i) => value * (i + 1)))
  const stops = [0, ...critical, 1],
    roots: number[] = []
  for (const t of critical) if (Math.abs(evaluate(c, t)) < 1e-12) roots.push(t)
  for (let i = 1; i < stops.length; i++) {
    let lo = stops[i - 1],
      hi = stops[i],
      flo = evaluate(c, lo)
    if (flo * evaluate(c, hi) >= 0) continue
    for (let k = 0; k < 60; k++) {
      const middle = (lo + hi) / 2,
        value = evaluate(c, middle)
      if (value === 0) {
        lo = hi = middle
        break
      }
      if (flo < 0 === value < 0) {
        lo = middle
        flo = value
      } else hi = middle
    }
    roots.push((lo + hi) / 2)
  }
  return roots
    .sort((a, b) => a - b)
    .filter((t, i, list) => i === 0 || Math.abs(t - list[i - 1]) > 1e-12)
}

/** The closest actual curve parameter, including exact endpoints; never an SVG length fraction. */
export function nearestSegmentParameter(
  nodes: OutlineNode[],
  index: number,
  target: Point,
): number {
  const s = segmentPoints(nodes, index)
  if (s.source.outgoing === 'line') {
    const dx = s.p3.x - s.p0.x,
      dy = s.p3.y - s.p0.y,
      length2 = dx * dx + dy * dy
    return length2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((target.x - s.p0.x) * dx + (target.y - s.p0.y) * dy) / length2))
  }
  const controls = [s.p0, s.p1, s.p2, s.p3].map((p) => ({ x: p.x - target.x, y: p.y - target.y }))
  const scale = Math.max(...controls.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)]))
  if (!scale) return 0
  const [a, b, c, d] = controls.map((p) => ({ x: p.x / scale, y: p.y / scale }))
  const coefficients = (axis: 'x' | 'y') => [
    a[axis],
    3 * (b[axis] - a[axis]),
    3 * (c[axis] - 2 * b[axis] + a[axis]),
    d[axis] - 3 * c[axis] + 3 * b[axis] - a[axis],
  ]
  const stationary = Array<number>(6).fill(0)
  for (const axis of ['x', 'y'] as const) {
    const q = coefficients(axis)
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 3; j++) stationary[i + j] += q[i] * (j + 1) * q[j + 1]
  }
  const candidates = [0, ...rootsInUnitInterval(stationary), 1]
  let best = 0,
    bestDistance = Infinity
  for (const t of candidates) {
    const dist = distance2(cubicAt(a, b, c, d, t), { x: 0, y: 0 })
    if (dist < bestDistance) {
      best = t
      bestDistance = dist
    }
  }
  return best
}
export function segmentPoint(nodes: OutlineNode[], index: number, t: number): Point {
  const s = segmentPoints(nodes, index)
  return s.source.outgoing === 'line' ? lerp(s.p0, s.p3, t) : cubicAt(s.p0, s.p1, s.p2, s.p3, t)
}
export function canSplitSegmentAt(nodes: OutlineNode[], index: number, t: number | null): boolean {
  if (index < 0 || index >= nodes.length || t === null || !Number.isFinite(t) || t <= 0 || t >= 1)
    return false
  const p = segmentPoint(nodes, index, t),
    s = segmentPoints(nodes, index)
  return distance2(p, s.p0) > 1e-14 && distance2(p, s.p3) > 1e-14
}
