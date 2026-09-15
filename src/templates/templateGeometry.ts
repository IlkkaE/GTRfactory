import { bounds, cubicAt, segmentPoints, type Bounds } from '../geometry/outline'
import type { NeckPocketGeometry, Point } from '../geometry/neckPocket'
import type { OutlineNode, ProjectDocument } from '../model/project'
import { automaticPocket } from '../neck/automaticPocket'

const EPSILON = 1e-7
const GEOMETRY_TOLERANCE_MM = 0.002
const MAX_FLATNESS_DEPTH = 14
const MAX_INTERSECTION_CHECKS = 15000
const CLEAR_GUARD_MM = GEOMETRY_TOLERANCE_MM * 2 + EPSILON

export type TemplateRole = 'body-outline' | 'template-bottom' | 'neck-pocket'
export type TemplateLineSegment = {
  type: 'line'
  role: TemplateRole
  from: Point
  to: Point
}
export type TemplateCubicBezierSegment = {
  type: 'cubicBezier'
  role: TemplateRole
  from: Point
  control1: Point
  control2: Point
  to: Point
}
export type TemplateCircularArcSegment = {
  type: 'circularArc'
  role: TemplateRole
  from: Point
  to: Point
  radiusMm: number
  sweep: 0 | 1
}
export type TemplateSegment =
  TemplateLineSegment | TemplateCubicBezierSegment | TemplateCircularArcSegment
export type TemplateContour = { start: Point; segments: TemplateSegment[]; closed: true }
export type TemplateDiagnostic = {
  class: 'invalid' | 'unsupported'
  code: string
  message: string
}
export type TemplateGeometryResult = {
  units: 'mm'
  kind: 'front' | 'back' | 'pocket'
  cut: TemplateContour | null
  cutPath: string | null
  centerline: TemplateLineSegment
  pocketMouth: TemplateSegment[] | null
  bounds: Bounds | null
  cutY: number | null
  diagnostic: TemplateDiagnostic | null
}
export type PocketTemplateOptions = { cutY?: number }

type Cubic = { from: Point; control1: Point; control2: Point; to: Point }
type ChainSegment = { index: number; segment: TemplateSegment }
type Crossing = { chainIndex: number; t: number; point: Point }

const copyPoint = (point: Point): Point => ({ x: point.x, y: point.y })
const mirrorPoint = (point: Point): Point => ({ x: -point.x, y: point.y })
const equalPoint = (a: Point, b: Point, epsilon = EPSILON) =>
  Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon

function line(role: TemplateRole, from: Point, to: Point): TemplateLineSegment {
  return { type: 'line', role, from: copyPoint(from), to: copyPoint(to) }
}

function cubic(
  role: TemplateRole,
  from: Point,
  control1: Point,
  control2: Point,
  to: Point,
): TemplateCubicBezierSegment {
  return {
    type: 'cubicBezier',
    role,
    from: copyPoint(from),
    control1: copyPoint(control1),
    control2: copyPoint(control2),
    to: copyPoint(to),
  }
}

function arc(
  role: TemplateRole,
  from: Point,
  to: Point,
  radiusMm: number,
  sweep: 0 | 1,
): TemplateCircularArcSegment {
  return { type: 'circularArc', role, from: copyPoint(from), to: copyPoint(to), radiusMm, sweep }
}

function bodySegment(nodes: OutlineNode[], index: number, mirror = false): TemplateSegment {
  const source = nodes[index]
  const target = nodes[(index + 1) % nodes.length]
  const transform = (point: Point) => (mirror ? mirrorPoint(point) : copyPoint(point))
  const from = transform(source)
  const to = transform(target)
  if (source.outgoing === 'line') return line('body-outline', from, to)
  return cubic(
    'body-outline',
    from,
    transform({
      x: source.x + (source.outHandle?.dx ?? 0),
      y: source.y + (source.outHandle?.dy ?? 0),
    }),
    transform({
      x: target.x + (target.inHandle?.dx ?? 0),
      y: target.y + (target.inHandle?.dy ?? 0),
    }),
    to,
  )
}

function extremaRoots(a: number, b: number, c: number, d: number) {
  const qa = -a + 3 * b - 3 * c + d
  const qb = 2 * (a - 2 * b + c)
  const qc = b - a
  if (Math.abs(qa) < EPSILON) return Math.abs(qb) < EPSILON ? [] : [-qc / qb]
  const discriminant = qb * qb - 4 * qa * qc
  if (discriminant < -EPSILON) return []
  const root = Math.sqrt(Math.max(0, discriminant))
  return [(-qb + root) / (2 * qa), (-qb - root) / (2 * qa)]
}

const MAX_ARC_SAMPLES = 4096

type ArcDefinition = { center: Point; start: number; delta: number }

function arcDefinition(segment: TemplateCircularArcSegment): ArcDefinition | null {
  const dx = segment.to.x - segment.from.x
  const dy = segment.to.y - segment.from.y
  const chord = Math.hypot(dx, dy)
  if (chord < EPSILON || chord > segment.radiusMm * 2 + EPSILON) return null
  const half = chord / 2
  const offset = Math.sqrt(Math.max(0, segment.radiusMm ** 2 - half ** 2))
  const midpoint = {
    x: (segment.from.x + segment.to.x) / 2,
    y: (segment.from.y + segment.to.y) / 2,
  }
  const normals = [
    { x: -dy / chord, y: dx / chord },
    { x: dy / chord, y: -dx / chord },
  ]
  return (
    normals
      .map((normal) => ({ x: midpoint.x + normal.x * offset, y: midpoint.y + normal.y * offset }))
      .map((center) => {
        const start = Math.atan2(segment.from.y - center.y, segment.from.x - center.x)
        const end = Math.atan2(segment.to.y - center.y, segment.to.x - center.x)
        let delta = end - start
        if (segment.sweep === 1 && delta < 0) delta += Math.PI * 2
        if (segment.sweep === 0 && delta > 0) delta -= Math.PI * 2
        return { center, start, delta }
      })
      .find(({ delta }) => Math.abs(delta) <= Math.PI + EPSILON) ?? null
  )
}

function arcSampleCount(segment: TemplateCircularArcSegment, definition: ArcDefinition) {
  const maximumStep = 2 * Math.acos(Math.max(-1, 1 - GEOMETRY_TOLERANCE_MM / segment.radiusMm))
  return Math.max(2, Math.ceil(Math.abs(definition.delta) / maximumStep))
}

function arcSamples(segment: TemplateCircularArcSegment) {
  const definition = arcDefinition(segment)
  if (!definition) return [segment.from, segment.to]
  const count = arcSampleCount(segment, definition)
  if (count > MAX_ARC_SAMPLES) return [segment.from, segment.to]
  return Array.from({ length: count + 1 }, (_, index) => {
    const angle = definition.start + (definition.delta * index) / count
    return {
      x: definition.center.x + Math.cos(angle) * segment.radiusMm,
      y: definition.center.y + Math.sin(angle) * segment.radiusMm,
    }
  })
}

function angleOnArc(angle: number, definition: ArcDefinition) {
  const normalize = (value: number) => ((value % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  const start = normalize(definition.start)
  const target = normalize(angle)
  if (definition.delta >= 0) return normalize(target - start) <= definition.delta + EPSILON
  return normalize(start - target) <= -definition.delta + EPSILON
}
function contourBounds(contour: TemplateContour): Bounds {
  const points: Point[] = []
  const include = (point: Point) => points.push(point)
  for (const segment of contour.segments) {
    include(segment.from)
    include(segment.to)
    if (segment.type === 'cubicBezier')
      for (const t of [
        ...extremaRoots(segment.from.x, segment.control1.x, segment.control2.x, segment.to.x),
        ...extremaRoots(segment.from.y, segment.control1.y, segment.control2.y, segment.to.y),
      ])
        if (t > EPSILON && t < 1 - EPSILON) include(cubicPoint(cubicFromSegment(segment), t))
    if (segment.type === 'circularArc') {
      const definition = arcDefinition(segment)
      for (const point of arcSamples(segment)) include(point)
      if (definition)
        for (const angle of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2])
          if (angleOnArc(angle, definition))
            include({
              x: definition.center.x + Math.cos(angle) * segment.radiusMm,
              y: definition.center.y + Math.sin(angle) * segment.radiusMm,
            })
    }
  }
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY }
}
export function serializeTemplatePath(contour: TemplateContour | null): string | null {
  if (!contour) return null
  let path = `M ${contour.start.x} ${contour.start.y}`
  for (const segment of contour.segments) {
    if (segment.type === 'line') path += ` L ${segment.to.x} ${segment.to.y}`
    else if (segment.type === 'cubicBezier')
      path += ` C ${segment.control1.x} ${segment.control1.y} ${segment.control2.x} ${segment.control2.y} ${segment.to.x} ${segment.to.y}`
    else
      path += ` A ${segment.radiusMm} ${segment.radiusMm} 0 0 ${segment.sweep} ${segment.to.x} ${segment.to.y}`
  }
  return `${path} Z`
}

function centerlineFor(nodes: OutlineNode[]): TemplateLineSegment {
  const box = bounds(nodes)
  return line('body-outline', { x: 0, y: box.minY }, { x: 0, y: box.maxY })
}

function bodyFailure(
  nodes: OutlineNode[],
  kind: 'front' | 'back',
  diagnostic: TemplateDiagnostic,
): TemplateGeometryResult {
  return {
    units: 'mm',
    kind,
    cut: null,
    cutPath: null,
    centerline: centerlineFor(nodes),
    pocketMouth: null,
    bounds: null,
    cutY: null,
    diagnostic,
  }
}

function bodyResult(nodes: OutlineNode[], kind: 'front' | 'back'): TemplateGeometryResult {
  if (!nodes.length)
    return bodyFailure(nodes, kind, {
      class: 'invalid',
      code: 'body-outline-empty',
      message: 'The body outline is empty.',
    })
  const mirror = kind === 'back'
  const start = mirror ? mirrorPoint(nodes[0]) : copyPoint(nodes[0])
  const cut: TemplateContour = {
    start,
    segments: nodes.map((_, index) => bodySegment(nodes, index, mirror)),
    closed: true,
  }
  const topology = validateTemplateContour(cut)
  if (topology) return bodyFailure(nodes, kind, topology)
  return {
    units: 'mm',
    kind,
    cut,
    cutPath: serializeTemplatePath(cut),
    centerline: centerlineFor(nodes),
    pocketMouth: null,
    bounds: contourBounds(cut),
    cutY: null,
    diagnostic: null,
  }
}

export const frontTemplateGeometry = (nodes: OutlineNode[]) => bodyResult(nodes, 'front')
export const backTemplateGeometry = (nodes: OutlineNode[]) => bodyResult(nodes, 'back')

function cubicPoint(segment: Cubic, t: number) {
  return cubicAt(segment.from, segment.control1, segment.control2, segment.to, t)
}

function splitCubic(segment: Cubic, t: number): [Cubic, Cubic] {
  const q0 = midpoint(segment.from, segment.control1, t)
  const q1 = midpoint(segment.control1, segment.control2, t)
  const q2 = midpoint(segment.control2, segment.to, t)
  const r0 = midpoint(q0, q1, t)
  const r1 = midpoint(q1, q2, t)
  const middle = midpoint(r0, r1, t)
  return [
    { from: segment.from, control1: q0, control2: r0, to: middle },
    { from: middle, control1: r1, control2: q2, to: segment.to },
  ]
}

function midpoint(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function cubicFromSegment(segment: TemplateCubicBezierSegment): Cubic {
  return {
    from: segment.from,
    control1: segment.control1,
    control2: segment.control2,
    to: segment.to,
  }
}

function trimSegment(segment: TemplateSegment, start: number, end: number): TemplateSegment {
  if (segment.type === 'line')
    return line(
      segment.role,
      midpoint(segment.from, segment.to, start),
      midpoint(segment.from, segment.to, end),
    )
  if (segment.type === 'circularArc')
    throw new Error('The body edge cannot contain an arc segment.')
  const original = cubicFromSegment(segment)
  if (start <= EPSILON && end >= 1 - EPSILON)
    return cubic(segment.role, original.from, original.control1, original.control2, original.to)
  const [, afterStart] = splitCubic(original, start)
  const localEnd = (end - start) / (1 - start)
  const [trimmed] = splitCubic(afterStart, localEnd)
  return cubic(segment.role, trimmed.from, trimmed.control1, trimmed.control2, trimmed.to)
}

function derivativeRoots(a: number, b: number, c: number, d: number) {
  const qa = -a + 3 * b - 3 * c + d
  const qb = 2 * (a - 2 * b + c)
  const qc = b - a
  if (Math.abs(qa) < EPSILON) return Math.abs(qb) < EPSILON ? [] : [-qc / qb]
  const discriminant = qb * qb - 4 * qa * qc
  if (discriminant < -EPSILON) return []
  const root = Math.sqrt(Math.max(0, discriminant))
  return [(-qb + root) / (2 * qa), (-qb - root) / (2 * qa)]
}

function yAt(segment: TemplateSegment, t: number) {
  if (segment.type === 'line') return segment.from.y + (segment.to.y - segment.from.y) * t
  if (segment.type === 'circularArc')
    throw new Error('The body edge cannot contain an arc segment.')
  return cubicPoint(cubicFromSegment(segment), t).y
}

function segmentCrossings(
  segment: TemplateSegment,
  cutY: number,
): { roots: number[]; ambiguous: boolean } {
  if (segment.type === 'circularArc') return { roots: [], ambiguous: true }
  if (segment.type === 'line') {
    const first = segment.from.y - cutY
    const second = segment.to.y - cutY
    if (Math.abs(first) < EPSILON || Math.abs(second) < EPSILON)
      return { roots: [], ambiguous: true }
    if (Math.abs(first - second) < EPSILON) return { roots: [], ambiguous: false }
    return first * second < 0
      ? { roots: [-first / (second - first)], ambiguous: false }
      : { roots: [], ambiguous: false }
  }
  const cubicSegment = cubicFromSegment(segment)
  const critical = derivativeRoots(
    cubicSegment.from.y,
    cubicSegment.control1.y,
    cubicSegment.control2.y,
    cubicSegment.to.y,
  )
    .filter((root) => root > EPSILON && root < 1 - EPSILON)
    .sort((a, b) => a - b)
  const intervals = [0, ...critical, 1]
  const roots: number[] = []
  for (const root of [0, 1, ...critical])
    if (Math.abs(yAt(segment, root) - cutY) < EPSILON) return { roots: [], ambiguous: true }
  for (let index = 0; index < intervals.length - 1; index++) {
    let low = intervals[index]
    let high = intervals[index + 1]
    const lowY = yAt(segment, low) - cutY
    const highY = yAt(segment, high) - cutY
    if (lowY * highY >= 0) continue
    for (let iteration = 0; iteration < 70; iteration++) {
      const middle = (low + high) / 2
      const middleY = yAt(segment, middle) - cutY
      if (Math.abs(middleY) < EPSILON) {
        low = high = middle
        break
      }
      if (lowY * middleY < 0) high = middle
      else low = middle
    }
    roots.push((low + high) / 2)
  }
  return { roots, ambiguous: false }
}

function outerChain(
  nodes: OutlineNode[],
  boundary: NonNullable<ProjectDocument['body']['neckJointBoundary']>,
): ChainSegment[] | null {
  const leftIndex = nodes.findIndex((node) => node.id === boundary.anchorIds[2])
  const rightIndex = nodes.findIndex((node) => node.id === boundary.anchorIds[0])
  if (leftIndex < 0 || rightIndex < 0 || leftIndex === rightIndex) return null
  const chain: ChainSegment[] = []
  let index = leftIndex
  while (index !== rightIndex) {
    chain.push({ index, segment: bodySegment(nodes, index) })
    index = (index + 1) % nodes.length
    if (chain.length > nodes.length) return null
  }
  return chain
}

function pocketMouthReference(
  nodes: OutlineNode[],
  boundary: NonNullable<ProjectDocument['body']['neckJointBoundary']>,
): TemplateSegment[] | null {
  if (boundary.segmentStartIds.length !== 2) return null
  const [rightId, centerId] = boundary.segmentStartIds
  const [rightIndex, centerIndex] = [rightId, centerId].map((id) =>
    nodes.findIndex((node) => node.id === id),
  )
  if (rightIndex < 0 || centerIndex < 0) return null
  if (
    nodes[(rightIndex + 1) % nodes.length]?.id !== boundary.anchorIds[1] ||
    nodes[(centerIndex + 1) % nodes.length]?.id !== boundary.anchorIds[2]
  )
    return null
  return [bodySegment(nodes, rightIndex), bodySegment(nodes, centerIndex)]
}

function allAtOrAbove(segment: TemplateSegment, cutY: number) {
  const samples =
    segment.type === 'cubicBezier'
      ? [
          0,
          1,
          ...derivativeRoots(
            segment.from.y,
            segment.control1.y,
            segment.control2.y,
            segment.to.y,
          ).filter((root) => root > EPSILON && root < 1 - EPSILON),
        ]
      : [0, 1]
  return samples.every((t) => yAt(segment, t) <= cutY + GEOMETRY_TOLERANCE_MM)
}
function joinIfNeeded(from: Point, to: Point): TemplateSegment[] {
  return equalPoint(from, to) ? [] : [line('neck-pocket', from, to)]
}

function pocketSegments(pocket: NeckPocketGeometry): TemplateSegment[] {
  const left = pocket.mouth.left
  const right = pocket.mouth.right
  if (pocket.radiusMm === 0)
    return [
      line('neck-pocket', right, pocket.rightCorner),
      line('neck-pocket', pocket.rightCorner, pocket.leftCorner),
      line('neck-pocket', pocket.leftCorner, left),
    ]
  return [
    line('neck-pocket', right, pocket.rightSideTangent),
    arc('neck-pocket', pocket.rightSideTangent, pocket.rightEndTangent, pocket.radiusMm, 1),
    line('neck-pocket', pocket.rightEndTangent, pocket.leftEndTangent),
    arc('neck-pocket', pocket.leftEndTangent, pocket.leftSideTangent, pocket.radiusMm, 1),
    line('neck-pocket', pocket.leftSideTangent, left),
  ]
}

function flattenSegment(segment: TemplateSegment, output: Point[], depth = 0): boolean {
  if (segment.type === 'line') {
    output.push(segment.to)
    return true
  }
  if (segment.type === 'circularArc') {
    const definition = arcDefinition(segment)
    if (!definition || arcSampleCount(segment, definition) > MAX_ARC_SAMPLES) {
      output.push(segment.to)
      return false
    }
    output.push(...arcSamples(segment).slice(1))
    return true
  }
  const source = segment.from
  const distance = (point: Point) => pointToSegmentDistance(point, source, segment.to)
  if (Math.max(distance(segment.control1), distance(segment.control2)) <= GEOMETRY_TOLERANCE_MM) {
    output.push(segment.to)
    return true
  }
  if (depth >= MAX_FLATNESS_DEPTH) {
    output.push(segment.to)
    return false
  }
  const [first, second] = splitCubic(cubicFromSegment(segment), 0.5)
  const left = flattenSegment(
    cubic(segment.role, first.from, first.control1, first.control2, first.to),
    output,
    depth + 1,
  )
  const right = flattenSegment(
    cubic(segment.role, second.from, second.control1, second.control2, second.to),
    output,
    depth + 1,
  )
  return left && right
}

function orientation(a: Point, b: Point, c: Point) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

function pointToSegmentDistance(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const denominator = dx * dx + dy * dy
  if (denominator < EPSILON) return Math.hypot(point.x - start.x, point.y - start.y)
  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / denominator),
  )
  return Math.hypot(point.x - (start.x + dx * t), point.y - (start.y + dy * t))
}

function strictCrossing(a: Point, b: Point, c: Point, d: Point) {
  const first = orientation(a, b, c)
  const second = orientation(a, b, d)
  const third = orientation(c, d, a)
  const fourth = orientation(c, d, b)
  return first * second < -EPSILON && third * fourth < -EPSILON
}

function collinearOverlap(a: Point, b: Point, c: Point, d: Point) {
  if (Math.abs(orientation(a, b, c)) > EPSILON || Math.abs(orientation(a, b, d)) > EPSILON)
    return false
  const useX = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)
  const [a0, a1] = useX ? [a.x, b.x] : [a.y, b.y]
  const [b0, b1] = useX ? [c.x, d.x] : [c.y, d.y]
  return (
    Math.min(Math.max(a0, a1), Math.max(b0, b1)) - Math.max(Math.min(a0, a1), Math.min(b0, b1)) >
    EPSILON
  )
}

function edgeDistance(a: Point, b: Point, c: Point, d: Point) {
  return Math.min(
    pointToSegmentDistance(a, c, d),
    pointToSegmentDistance(b, c, d),
    pointToSegmentDistance(c, a, b),
    pointToSegmentDistance(d, a, b),
  )
}

function intendedJoin(
  a: { from: Point; to: Point; segment: number },
  b: { from: Point; to: Point; segment: number },
  length: number,
) {
  return (
    (b.segment === a.segment + 1 && equalPoint(a.to, b.from)) ||
    (a.segment === 0 && b.segment === length - 1 && equalPoint(b.to, a.from))
  )
}
export function validateTemplateContour(contour: TemplateContour): TemplateDiagnostic | null {
  if (!contour.segments.length || !equalPoint(contour.start, contour.segments.at(-1)!.to))
    return {
      class: 'invalid',
      code: 'contour-open',
      message: 'The template cutting edge is not closed.',
    }
  const edges: Array<{
    from: Point
    to: Point
    segment: number
    local: number
    minX: number
    maxX: number
    minY: number
    maxY: number
  }> = []
  for (let segmentIndex = 0; segmentIndex < contour.segments.length; segmentIndex++) {
    const segment = contour.segments[segmentIndex]
    const previous =
      contour.segments[(segmentIndex - 1 + contour.segments.length) % contour.segments.length]
    if (!equalPoint(previous.to, segment.from))
      return {
        class: 'invalid',
        code: 'contour-disconnected',
        message: 'The template cutting edge contains a gap.',
      }
    if (![segment.from.x, segment.from.y, segment.to.x, segment.to.y].every(Number.isFinite))
      return {
        class: 'invalid',
        code: 'non-finite',
        message: 'The template cutting edge contains an invalid coordinate.',
      }
    const points = [segment.from]
    if (!flattenSegment(segment, points))
      return {
        class: 'unsupported',
        code: 'topology-depth-limit',
        message: 'The template cutting-edge curve check exceeded the precision limit.',
      }
    for (let index = 0; index < points.length - 1; index++) {
      if (
        Math.hypot(points[index + 1].x - points[index].x, points[index + 1].y - points[index].y) <=
        EPSILON
      )
        return {
          class: 'invalid',
          code: 'zero-length',
          message: 'The template cutting edge contains a zero-length segment.',
        }
      edges.push({
        from: points[index],
        to: points[index + 1],
        segment: segmentIndex,
        local: index,
        minX: Math.min(points[index].x, points[index + 1].x),
        maxX: Math.max(points[index].x, points[index + 1].x),
        minY: Math.min(points[index].y, points[index + 1].y),
        maxY: Math.max(points[index].y, points[index + 1].y),
      })
      if (edges.length > MAX_INTERSECTION_CHECKS)
        return {
          class: 'unsupported',
          code: 'topology-edge-limit',
          message: 'The template cutting-edge check exceeded the work limit.',
        }
    }
  }
  let checks = 0
  for (let index = 0; index < edges.length; index++)
    for (let other = index + 1; other < edges.length; other++) {
      const a = edges[index]
      const b = edges[other]
      if (
        a.maxX < b.minX - CLEAR_GUARD_MM ||
        b.maxX < a.minX - CLEAR_GUARD_MM ||
        a.maxY < b.minY - CLEAR_GUARD_MM ||
        b.maxY < a.minY - CLEAR_GUARD_MM
      )
        continue
      if (a.segment === b.segment && Math.abs(a.local - b.local) <= 1) continue
      if (intendedJoin(a, b, contour.segments.length)) {
        const incoming = { x: a.to.x - a.from.x, y: a.to.y - a.from.y }
        const outgoing = { x: b.to.x - b.from.x, y: b.to.y - b.from.y }
        if (
          Math.abs(incoming.x * outgoing.y - incoming.y * outgoing.x) <= EPSILON &&
          incoming.x * outgoing.x + incoming.y * outgoing.y < -EPSILON
        )
          return {
            class: 'invalid',
            code: 'self-overlap',
            message: 'The template cutting edge contains a backtracking segment.',
          }
        continue
      }
      const shared =
        equalPoint(a.from, b.from) ||
        equalPoint(a.from, b.to) ||
        equalPoint(a.to, b.from) ||
        equalPoint(a.to, b.to)
      if (shared || strictCrossing(a.from, a.to, b.from, b.to))
        return {
          class: 'invalid',
          code: 'self-intersection',
          message: 'The template cutting edge self-intersects.',
        }
      if (collinearOverlap(a.from, a.to, b.from, b.to))
        return {
          class: 'invalid',
          code: 'self-overlap',
          message: 'The template cutting edge contains an overlapping segment.',
        }
      if (++checks > MAX_INTERSECTION_CHECKS)
        return {
          class: 'unsupported',
          code: 'topology-work-limit',
          message: 'The template cutting-edge check exceeded the work limit.',
        }
      if (edgeDistance(a.from, a.to, b.from, b.to) <= CLEAR_GUARD_MM)
        return {
          class: 'unsupported',
          code: 'topology-near-touch',
          message: 'The template cutting edge contains a near-touch point.',
        }
    }
  return null
}
function failure(
  nodes: OutlineNode[],
  diagnostic: TemplateDiagnostic,
  cutY: number | null,
): TemplateGeometryResult {
  return {
    units: 'mm',
    kind: 'pocket',
    cut: null,
    cutPath: null,
    centerline: centerlineFor(nodes),
    pocketMouth: null,
    bounds: null,
    cutY,
    diagnostic,
  }
}

export function pocketTemplateGeometry(
  document: ProjectDocument,
  options: PocketTemplateOptions = {},
): TemplateGeometryResult {
  const nodes = document.body.outline.nodes
  let pocket: NeckPocketGeometry | null
  try {
    pocket = automaticPocket(document)
  } catch {
    return failure(
      nodes,
      {
        class: 'invalid',
        code: 'automatic-pocket-error',
        message: 'The neck pocket could not be derived from the current neck.',
      },
      null,
    )
  }
  if (!pocket)
    return failure(
      nodes,
      { class: 'unsupported', code: 'neck-unavailable', message: 'No neck has been created.' },
      null,
    )
  const cutY = options.cutY ?? Math.max(pocket.leftCorner.y, pocket.rightCorner.y) + 20
  if (!Number.isFinite(cutY))
    return failure(
      nodes,
      {
        class: 'invalid',
        code: 'cut-not-finite',
        message: 'The pocket-template cutting boundary is invalid.',
      },
      null,
    )
  if (cutY <= Math.max(pocket.leftCorner.y, pocket.rightCorner.y) + EPSILON)
    return failure(
      nodes,
      {
        class: 'invalid',
        code: 'cut-enters-pocket',
        message: 'The pocket-template cutting boundary intersects the neck pocket.',
      },
      cutY,
    )
  const boundary = document.body.neckJointBoundary
  if (!boundary || boundary.anchorIds.length !== 3)
    return failure(
      nodes,
      {
        class: 'invalid',
        code: 'neck-boundary-missing',
        message: "The neck's locked joint is missing.",
      },
      cutY,
    )
  const mouthReference = pocketMouthReference(nodes, boundary)
  if (!mouthReference)
    return failure(
      nodes,
      {
        class: 'invalid',
        code: 'neck-boundary-mouth-missing',
        message: "The neck's locked mouth reference could not be derived.",
      },
      cutY,
    )
  const chain = outerChain(nodes, boundary)
  if (!chain)
    return failure(
      nodes,
      {
        class: 'invalid',
        code: 'outer-chain-missing',
        message: "The body's upper edge could not be derived.",
      },
      cutY,
    )
  const crossings: Crossing[] = []
  for (let chainIndex = 0; chainIndex < chain.length; chainIndex++) {
    const result = segmentCrossings(chain[chainIndex].segment, cutY)
    if (result.ambiguous)
      return failure(
        nodes,
        {
          class: 'unsupported',
          code: 'cut-ambiguous',
          message: 'The cutting boundary meets a body node, tangent, or overlapping edge.',
        },
        cutY,
      )
    for (const t of result.roots)
      crossings.push({ chainIndex, t, point: segmentPoint(chain[chainIndex].segment, t) })
  }
  if (crossings.length !== 2)
    return failure(
      nodes,
      {
        class: 'unsupported',
        code: crossings.length > 2 ? 'cut-multiple-crossings' : 'cut-crossings-missing',
        message:
          crossings.length > 2
            ? 'The cutting boundary meets the body more than twice.'
            : 'The cutting boundary does not meet the body twice.',
      },
      cutY,
    )
  const [leftCrossing, rightCrossing] = crossings
  const leftOuter: TemplateSegment[] = []
  for (let index = 0; index < leftCrossing.chainIndex; index++) leftOuter.push(chain[index].segment)
  leftOuter.push(trimSegment(chain[leftCrossing.chainIndex].segment, 0, leftCrossing.t))
  const rightOuter: TemplateSegment[] = [
    trimSegment(chain[rightCrossing.chainIndex].segment, rightCrossing.t, 1),
  ]
  for (let index = rightCrossing.chainIndex + 1; index < chain.length; index++)
    rightOuter.push(chain[index].segment)
  if (![...leftOuter, ...rightOuter].every((segment) => allAtOrAbove(segment, cutY)))
    return failure(
      nodes,
      {
        class: 'unsupported',
        code: 'cut-non-upper-chain',
        message: 'The cutting boundary does not define one clear upper part of the body.',
      },
      cutY,
    )
  const cut = {
    start: copyPoint(pocket.mouth.left),
    segments: [
      ...joinIfNeeded(pocket.mouth.left, chain[0].segment.from),
      ...leftOuter,
      line('template-bottom', leftCrossing.point, rightCrossing.point),
      ...rightOuter,
      ...joinIfNeeded(chain.at(-1)!.segment.to, pocket.mouth.right),
      ...pocketSegments(pocket),
    ],
    closed: true as const,
  }
  const topology = validateTemplateContour(cut)
  if (topology) return failure(nodes, topology, cutY)
  return {
    units: 'mm',
    kind: 'pocket',
    cut,
    cutPath: serializeTemplatePath(cut),
    centerline: centerlineFor(nodes),
    pocketMouth: mouthReference,
    bounds: contourBounds(cut),
    cutY,
    diagnostic: null,
  }
}

function segmentPoint(segment: TemplateSegment, t: number): Point {
  if (segment.type === 'line') return midpoint(segment.from, segment.to, t)
  if (segment.type === 'circularArc')
    throw new Error('The body edge cannot contain an arc segment.')
  return cubicPoint(cubicFromSegment(segment), t)
}
