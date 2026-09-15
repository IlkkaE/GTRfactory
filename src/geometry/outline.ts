import { nodeId, validNumber, type OutlineNode, type Vec } from '../model/project'
export type Point = { x: number; y: number }
export type Bounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
}
export const add = (p: Point, v: Vec): Point => ({ x: p.x + v.dx, y: p.y + v.dy })
export const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})
export const nextIndex = (nodes: OutlineNode[], i: number) => (i + 1) % nodes.length
export function segmentPoints(nodes: OutlineNode[], index: number) {
  const source = nodes[index],
    target = nodes[nextIndex(nodes, index)]
  return {
    source,
    target,
    p0: { x: source.x, y: source.y },
    p1: source.outHandle ? add(source, source.outHandle) : { x: source.x, y: source.y },
    p2: target.inHandle ? add(target, target.inHandle) : { x: target.x, y: target.y },
    p3: { x: target.x, y: target.y },
  }
}
export function cubicAt(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  return lerp(
    lerp(lerp(p0, p1, t), lerp(p1, p2, t), t),
    lerp(lerp(p1, p2, t), lerp(p2, p3, t), t),
    t,
  )
}
function segmentCommand(nodes: OutlineNode[], i: number, mirror: boolean) {
  const s = segmentPoints(nodes, i),
    x = (n: number) => (mirror ? -n : n)
  return s.source.outgoing === 'line'
    ? `L ${x(s.p3.x)} ${s.p3.y}`
    : `C ${x(s.p1.x)} ${s.p1.y} ${x(s.p2.x)} ${s.p2.y} ${x(s.p3.x)} ${s.p3.y}`
}
export function segmentPath(nodes: OutlineNode[], i: number, mirror = false) {
  return `M ${mirror ? -nodes[i].x : nodes[i].x} ${nodes[i].y} ${segmentCommand(nodes, i, mirror)}`
}
export function pathD(nodes: OutlineNode[], mirror = false) {
  return nodes.length
    ? `M ${mirror ? -nodes[0].x : nodes[0].x} ${nodes[0].y} ${nodes.map((_, i) => segmentCommand(nodes, i, mirror)).join(' ')} Z`
    : ''
}
function extrema(a: number, b: number, c: number, d: number) {
  const qa = -a + 3 * b - 3 * c + d,
    qb = 2 * (a - 2 * b + c),
    qc = b - a
  if (Math.abs(qa) < 1e-10) return Math.abs(qb) < 1e-10 ? [] : [-qc / qb]
  const disc = qb * qb - 4 * qa * qc
  return disc < 0 ? [] : [(-qb + Math.sqrt(disc)) / (2 * qa), (-qb - Math.sqrt(disc)) / (2 * qa)]
}
export function bounds(nodes: OutlineNode[]): Bounds {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  const include = (p: Point) => {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  nodes.forEach((n, i) => {
    const s = segmentPoints(nodes, i)
    include(s.p0)
    include(s.p3)
    if (n.outgoing === 'cubicBezier')
      for (const t of [
        ...extrema(s.p0.x, s.p1.x, s.p2.x, s.p3.x),
        ...extrema(s.p0.y, s.p1.y, s.p2.y, s.p3.y),
      ])
        if (t > 0 && t < 1) include(cubicAt(s.p0, s.p1, s.p2, s.p3, t))
  })
  if (!nodes.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}
export function splitSegment(nodes: OutlineNode[], index: number, t = 0.5) {
  if (!Number.isFinite(t) || t <= 0 || t >= 1)
    throw new Error('The split parameter must be between 0 and 1.')
  const copy = structuredClone(nodes),
    s = segmentPoints(copy, index),
    source = copy[index],
    target = copy[nextIndex(copy, index)]
  if (source.outgoing === 'line') {
    const p = lerp(s.p0, s.p3, t)
    copy.splice(index + 1, 0, {
      id: nodeId(),
      ...p,
      kind: 'corner',
      inHandle: null,
      outHandle: null,
      outgoing: 'line',
    })
    return copy
  }
  const q0 = lerp(s.p0, s.p1, t),
    q1 = lerp(s.p1, s.p2, t),
    q2 = lerp(s.p2, s.p3, t),
    r0 = lerp(q0, q1, t),
    r1 = lerp(q1, q2, t),
    mid = lerp(r0, r1, t)
  source.outHandle = { dx: q0.x - source.x, dy: q0.y - source.y }
  target.inHandle = { dx: q2.x - target.x, dy: q2.y - target.y }
  const inHandle = { dx: r0.x - mid.x, dy: r0.y - mid.y },
    outHandle = { dx: r1.x - mid.x, dy: r1.y - mid.y }
  copy.splice(index + 1, 0, {
    id: nodeId(),
    ...mid,
    kind:
      Math.hypot(inHandle.dx, inHandle.dy) > 1e-10 && Math.hypot(outHandle.dx, outHandle.dy) > 1e-10
        ? 'smooth'
        : 'corner',
    inHandle,
    outHandle,
    outgoing: 'cubicBezier',
  })
  return copy
}
export function asCubic(nodes: OutlineNode[], index: number, cubic: boolean) {
  const copy = structuredClone(nodes),
    source = copy[index],
    target = copy[nextIndex(copy, index)]
  if ((source.outgoing === 'cubicBezier') === cubic) return copy
  source.kind = 'corner'
  target.kind = 'corner'
  if (cubic) {
    source.outgoing = 'cubicBezier'
    source.outHandle = { dx: (target.x - source.x) / 3, dy: (target.y - source.y) / 3 }
    target.inHandle = { dx: (source.x - target.x) / 3, dy: (source.y - target.y) / 3 }
  } else {
    source.outgoing = 'line'
    source.outHandle = null
    target.inHandle = null
  }
  return copy
}
export function deleteNodes(nodes: OutlineNode[], ids: Set<string>) {
  const kept = structuredClone(nodes.filter((n) => !ids.has(n.id)))
  if (kept.length < 3) throw new Error('At least three nodes are required.')
  kept.forEach((source, i) => {
    const target = kept[nextIndex(kept, i)],
      oldNext =
        nodes[
          nextIndex(
            nodes,
            nodes.findIndex((n) => n.id === source.id),
          )
        ]
    if (target.id === oldNext.id) return
    // Only the newly connected segment may change. Other endpoint handles remain intact.
    if (source.outgoing === 'cubicBezier' && !target.inHandle) {
      target.inHandle = { dx: (source.x - target.x) / 3, dy: (source.y - target.y) / 3 }
      target.kind = 'corner'
    }
  })
  return kept
}
export function moveNodes(nodes: OutlineNode[], ids: Set<string>, dx: number, dy: number) {
  if (
    !Number.isFinite(dx) ||
    !Number.isFinite(dy) ||
    nodes.some((n) => ids.has(n.id) && (!validNumber(n.x + dx) || !validNumber(n.y + dy)))
  )
    throw new Error('The coordinate exceeds the technical limit of ±1,000,000 mm.')
  return nodes.map((n) =>
    ids.has(n.id) ? { ...structuredClone(n), x: n.x + dx, y: n.y + dy } : structuredClone(n),
  )
}
export function isDegenerate(nodes: OutlineNode[]) {
  const b = bounds(nodes)
  return b.width < 1e-4 || b.height < 1e-4
}
const orient = (a: Point, b: Point, c: Point) =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
function intersects(a: Point, b: Point, c: Point, d: Point) {
  const o1 = orient(a, b, c),
    o2 = orient(a, b, d),
    o3 = orient(c, d, a),
    o4 = orient(c, d, b)
  const on = (p: Point, q: Point, r: Point) =>
    Math.abs(orient(p, q, r)) < 1e-8 &&
    r.x >= Math.min(p.x, q.x) - 1e-8 &&
    r.x <= Math.max(p.x, q.x) + 1e-8 &&
    r.y >= Math.min(p.y, q.y) - 1e-8 &&
    r.y <= Math.max(p.y, q.y) + 1e-8
  return (o1 * o2 < 0 && o3 * o4 < 0) || on(a, b, c) || on(a, b, d) || on(c, d, a) || on(c, d, b)
}
// Fixed 16 samples per cubic, with a sweep and work cap: draft feedback, not manufacturing validation.
function intersectionStatus(nodes: OutlineNode[], steps = 16): 'crossing' | 'clear' | 'limited' {
  const points: Point[] = []
  nodes.forEach((n, i) => {
    const s = segmentPoints(nodes, i)
    for (let j = 0; j < (n.outgoing === 'line' ? 1 : steps); j++)
      points.push(n.outgoing === 'line' ? s.p0 : cubicAt(s.p0, s.p1, s.p2, s.p3, j / steps))
  })
  const lines = points
    .map((a, i) => {
      const b = points[(i + 1) % points.length]
      return {
        a,
        b,
        i,
        minX: Math.min(a.x, b.x),
        maxX: Math.max(a.x, b.x),
        minY: Math.min(a.y, b.y),
        maxY: Math.max(a.y, b.y),
      }
    })
    .sort((a, b) => a.minX - b.minX)
  let active: typeof lines = [],
    checks = 0
  for (const line of lines) {
    active = active.filter((a) => a.maxX >= line.minX)
    for (const other of active) {
      if (++checks > 250000) return 'limited'
      if (
        Math.abs(line.i - other.i) === 1 ||
        Math.abs(line.i - other.i) === lines.length - 1 ||
        other.maxY < line.minY ||
        line.maxY < other.minY
      )
        continue
      if (intersects(line.a, line.b, other.a, other.b)) return 'crossing'
    }
    active.push(line)
  }
  return 'clear'
}
export const hasSelfIntersection = (nodes: OutlineNode[], steps = 16) =>
  intersectionStatus(nodes, steps) === 'crossing'
export function geometryWarning(nodes: OutlineNode[]) {
  if (isDegenerate(nodes)) return 'The outline is degenerate.'
  if (
    nodes.some((n, i) => {
      const s = segmentPoints(nodes, i)
      return (
        Math.hypot(s.p0.x - s.p3.x, s.p0.y - s.p3.y) < 1e-8 &&
        (n.outgoing === 'line' ||
          Math.hypot(s.p0.x - s.p1.x, s.p0.y - s.p1.y) +
            Math.hypot(s.p0.x - s.p2.x, s.p0.y - s.p2.y) <
            1e-8)
      )
    })
  )
    return 'The outline contains a zero-length segment.'
  const status = intersectionStatus(nodes)
  return status === 'crossing'
    ? 'The outline self-intersects.'
    : status === 'limited'
      ? 'The shape is too complex; the self-intersection check did not complete.'
      : null
}
