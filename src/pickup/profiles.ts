import hulls from './source-hulls.json' with { type: 'json' }
import type { ProjectDocument, PickupCavity, OutlineNode } from '../model/project'
import { validNumber } from '../model/project'
import { cubicAt, segmentPoints, type Point } from '../geometry/outline'
import { automaticPocket, physicalFretboard, physicalHeel } from '../neck/automaticPocket'
import type { NeckPocketGeometry } from '../geometry/neckPocket'
import { transformPoint } from '../neck/fretfactoryGeometry'
import { pchipToBezierSegments } from '../neck/vendor/pchip'

// Geometry is flattened within 0.01 mm; near-contact within 0.03 mm is rejected.
// This is an editor tolerance, not a manufacturing certification.
export const PICKUP_TOLERANCE_MM = 0.01
const CONTACT = 0.03,
  EPS = 1e-8
export type PickupRouteSegment =
  | { type: 'line'; from: Point; to: Point }
  | { type: 'cubicBezier'; from: Point; control1: Point; control2: Point; to: Point }
  | {
      type: 'circularArc'
      from: Point
      to: Point
      center: Point
      radiusMm: number
      sweep: 0 | 1
      largeArc: 0 | 1
    }
export type PickupProfile = {
  id: string
  version: number
  name: string
  path: string
  segments: PickupRouteSegment[]
  samples: Point[]
  widthMm: number
  lengthMm: number
  source: string
  sourceUrl: string
  clearanceMm: number
  rotationDeg: number
  stringCount: 6 | 7 | 8
}
const pair = (p: Point) => p.x + ' ' + p.y
const turn = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
const rotate = (p: Point, deg: number): Point => {
  const a = (deg * Math.PI) / 180
  return { x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) }
}
const extent = (p: Point[]) => ({
  minX: Math.min(...p.map((q) => q.x)),
  maxX: Math.max(...p.map((q) => q.x)),
  minY: Math.min(...p.map((q) => q.y)),
  maxY: Math.max(...p.map((q) => q.y)),
})
function distance(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    l = dx * dx + dy * dy,
    t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}
class Route {
  samples: Point[] = []
  segments: PickupRouteSegment[] = []
  path = ''
  line(p: Point) {
    const from = this.samples.at(-1)
    if (from && Math.hypot(p.x - from.x, p.y - from.y) < EPS) return
    this.path += (this.samples.length ? ' L ' : 'M ') + pair(p)
    if (from) this.segments.push({ type: 'line', from: { ...from }, to: { ...p } })
    this.samples.push(p)
  }
  arc(center: Point, r: number, to: Point, sweep: 0 | 1) {
    const from = this.samples.at(-1)!
    let a = Math.atan2(from.y - center.y, from.x - center.x),
      b = Math.atan2(to.y - center.y, to.x - center.x)
    if (sweep) while (b < a - EPS) b += 2 * Math.PI
    else while (b > a + EPS) b -= 2 * Math.PI
    const span = b - a,
      largeArc: 0 | 1 = Math.abs(span) > Math.PI ? 1 : 0
    this.segments.push({
      type: 'circularArc',
      from: { ...from },
      to: { ...to },
      center: { ...center },
      radiusMm: r,
      sweep,
      largeArc,
    })
    const n = Math.max(
      1,
      Math.ceil(Math.abs(span) / (2 * Math.acos(Math.max(-1, 1 - PICKUP_TOLERANCE_MM / r)))),
    )
    this.path += ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' ' + sweep + ' ' + pair(to)
    for (let i = 1; i <= n; i++) {
      const t = a + (span * i) / n
      this.samples.push(
        i === n ? to : { x: center.x + r * Math.cos(t), y: center.y + r * Math.sin(t) },
      )
    }
  }
  close() {
    this.path += ' Z'
    const first = this.samples[0],
      last = this.samples.at(-1)!
    if (first && last && Math.hypot(first.x - last.x, first.y - last.y) >= EPS)
      this.segments.push({ type: 'line', from: { ...last }, to: { ...first } })
    if (this.samples.length > 1 && Math.hypot(first.x - last.x, first.y - last.y) < EPS)
      this.samples.pop()
    return this
  }
}
function convexOutset(points: Point[], r: number) {
  const route = new Route()
  for (let i = 0; i < points.length; i++) {
    const a = points[(i - 1 + points.length) % points.length],
      b = points[i],
      c = points[(i + 1) % points.length]
    const normal = (p: Point, q: Point) => {
      const l = Math.hypot(q.x - p.x, q.y - p.y)
      return { x: (r * (q.y - p.y)) / l, y: (-r * (q.x - p.x)) / l }
    }
    const u = normal(a, b),
      v = normal(b, c)
    route.line({ x: b.x + u.x, y: b.y + u.y })
    route.arc(b, r, { x: b.x + v.x, y: b.y + v.y }, 1)
  }
  return route.close()
}
export const roundOutset = (points: Point[], r: number) => convexOutset(points, r).samples
function roundedOrthogonal(points: Point[], r: number) {
  const route = new Route()
  for (let i = 0; i < points.length; i++) {
    const a = points[(i - 1 + points.length) % points.length],
      b = points[i],
      c = points[(i + 1) % points.length]
    const before = Math.hypot(a.x - b.x, a.y - b.y),
      after = Math.hypot(c.x - b.x, c.y - b.y),
      u = { x: ((a.x - b.x) * r) / before, y: ((a.y - b.y) * r) / before },
      v = { x: ((c.x - b.x) * r) / after, y: ((c.y - b.y) * r) / after }
    route.line({ x: b.x + u.x, y: b.y + u.y })
    route.arc(
      { x: b.x + u.x + v.x, y: b.y + u.y + v.y },
      r,
      { x: b.x + v.x, y: b.y + v.y },
      turn(a, b, c) > 0 ? 1 : 0,
    )
  }
  return route.close()
}
function profile(
  id: string,
  name: string,
  route: Route,
  source: string,
  sourceUrl: string,
  clearanceMm: number,
  rotationDeg = 0,
  stringCount: 6 | 7 | 8 = 6,
): PickupProfile {
  const b = extent(route.samples)
  return {
    id,
    version: 1,
    name,
    path: route.path,
    segments: route.segments,
    samples: route.samples,
    widthMm: b.maxX - b.minX,
    lengthMm: b.maxY - b.minY,
    source,
    sourceUrl,
    clearanceMm,
    rotationDeg,
    stringCount,
  }
}
const sd = 'https://www.seymourduncan.com/'
const sh12 = [
  { x: -36, y: -20 },
  { x: 36, y: -20 },
  { x: 36, y: -9 },
  { x: 43, y: -9 },
  { x: 43, y: 9 },
  { x: 36, y: 9 },
  { x: 36, y: 20 },
  { x: -36, y: 20 },
  { x: -36, y: 9 },
  { x: -43, y: 9 },
  { x: -43, y: -9 },
  { x: -36, y: -9 },
]
const hull = (name: 'ssl1' | 'str1' | 'stl1b', angle = 0) =>
  hulls[name].sourceHullMm.map((p) => rotate(p, angle))
const hb7 = [
  { x: -42.0017, y: -20.7546 },
  { x: 42.0017, y: -20.7546 },
  { x: 42.0017, y: -9.5024 },
  { x: 49.99, y: -9.5024 },
  { x: 49.99, y: 9.5024 },
  { x: 42.0017, y: 9.5024 },
  { x: 42.0017, y: 20.7546 },
  { x: -42.0017, y: 20.7546 },
  { x: -42.0017, y: 9.5024 },
  { x: -49.99, y: 9.5024 },
  { x: -49.99, y: -9.5024 },
  { x: -42.0017, y: -9.5024 },
]
const hb8 = [
  { x: -48.4152, y: -20.907 },
  { x: 48.4152, y: -20.907 },
  { x: 48.4152, y: -9.985 },
  { x: 53.546, y: -9.985 },
  { x: 53.546, y: 9.985 },
  { x: 48.4152, y: 9.985 },
  { x: 48.4152, y: 20.907 },
  { x: -48.4152, y: 20.907 },
  { x: -48.4152, y: 9.985 },
  { x: -53.546, y: 9.985 },
  { x: -53.546, y: -9.985 },
  { x: -48.4152, y: -9.985 },
]
const rectangle = (width: number, length: number) => [
  { x: -width / 2, y: -length / 2 },
  { x: width / 2, y: -length / 2 },
  { x: width / 2, y: length / 2 },
  { x: -width / 2, y: length / 2 },
]
export const PICKUP_PROFILES: readonly PickupProfile[] = [
  profile(
    'sh12-humbucker',
    'Humbucker (SH-12)',
    roundedOrthogonal(sh12, 3),
    'SH-12: custom 72 × 40 / 86 mm design profile, R3.',
    sd + 'wp-content/uploads/2019/08/HB-6-String-Screamin-Demon.pdf',
    0,
  ),
  profile(
    'ssl1-strat',
    'Strat single-coil (SSL-1)',
    convexOutset(hull('ssl1'), 3),
    'SSL-1: manufacturer clearance + 3 mm. Conservative design profile.',
    sd + 'images/dimensions/SSL1.pdf',
    3,
  ),
  profile(
    'str1-tele-neck',
    'Tele neck (STR-1)',
    convexOutset(hull('str1'), 3),
    'STR-1: manufacturer clearance + 3 mm. Conservative design profile.',
    sd + 'wp-content/uploads/2019/08/Tele-Rhythm-STR-1.pdf',
    3,
  ),
  profile(
    'stl1b-tele-bridge',
    'Tele bridge (STL-1b)',
    convexOutset(hull('stl1b', 17), 3),
    'STL-1b: clearance + 3 mm. Derived from the Gotoh Ti/BS-TC1S drawing at 17°; bridge-plate fit not verified.',
    sd + 'wp-content/uploads/2019/08/Tele-Lead-Flat-STL-1b.pdf',
    3,
    17,
  ),
  profile(
    'sp90-sgz-p90',
    'P-90 soapbar (SP90 SGZ)',
    roundedOrthogonal(
      [
        { x: -43.75, y: -18.25 },
        { x: 43.75, y: -18.25 },
        { x: 43.75, y: 18.25 },
        { x: -43.75, y: 18.25 },
      ],
      7.35,
    ),
    'SP90 SGZ: cover dimensions + 1 mm. Custom design profile, R7.35.',
    'https://espguitars.co.jp/seymourduncan/wp-content/uploads/sites/13/2025/02/sp90_sgz_dimention.pdf',
    1,
  ),
  profile(
    'sd-hb7-uncovered',
    'Humbucker 7-string (SD)',
    roundedOrthogonal(hb7, 2.5),
    'SD HB7 uncovered passive mount: body and lug envelope + 3 mm/side. Conservative 2D design profile.',
    sd + 'wp-content/uploads/2019/08/HB-7-String-Uncovered-Passive-Mount.pdf',
    3,
    0,
    7,
  ),
  profile(
    'sd-hb8-uncovered',
    'Humbucker 8-string (SD)',
    roundedOrthogonal(hb8, 2.5),
    'SD HB8 uncovered passive mount: body and lug envelope + 3 mm/side. Conservative 2D design profile.',
    sd + 'wp-content/uploads/2019/08/HB-8-String-Uncovered-Passive-Mount.jpg',
    3,
    0,
    8,
  ),
  profile(
    'emg-707-soapbar',
    'Soapbar 7-string (EMG 707)',
    roundedOrthogonal(rectangle(90.9, 40.1), 4.175),
    'EMG 707: manufacturer cover dimensions + 1 mm/side. Custom 2D design profile, R4.175.',
    'https://www.emgpickups.com/pub/media/Mageants/7/0/707_0230-0284rb.pdf',
    1,
    0,
    7,
  ),
  profile(
    'emg-808-soapbar',
    'Soapbar 8-string (EMG 808)',
    roundedOrthogonal(rectangle(103.6, 40.1), 4.175),
    'EMG 808: manufacturer cover dimensions + 1 mm/side. Custom 2D design profile, R4.175.',
    'https://www.emgpickups.com/pub/media/Mageants/8/0/808_0230-0134rb.pdf',
    1,
    0,
    8,
  ),
]
export const pickupProfile = (id: string, version: number) =>
  PICKUP_PROFILES.find((p) => p.id === id && p.version === version)

export const PICKUP_MIN_DIMENSION_MM = 1
export const PICKUP_MAX_DIMENSION_MM = 1000
export const PICKUP_MIN_ANGLE_DEG = -180
export const PICKUP_MAX_ANGLE_DEG = 180
const PICKUP_MAX_SEGMENTS = 20000

/**
 * Maximum radial error of one five-degree circular cubic after anisotropic scaling.
 * For h=2.5°, b=-sin(h)(1-cos(h))/(2(1+cos(h))) and max u²=1/3,
 * |B|²-1 = b²u²(1-u²)², so e=r*scale*(sqrt(1+4b²/27)-1).
 */
export const anisotropicArcErrorBound = (radiusMm: number, scale: number) => {
  const h = Math.PI / 72,
    b = (-Math.sin(h) * (1 - Math.cos(h))) / (2 * (1 + Math.cos(h)))
  return radiusMm * scale * (Math.sqrt(1 + (4 * b * b) / 27) - 1)
}

export function pickupDefaults(profile: PickupProfile) {
  const local = localSegments(profile)
  const points: Point[] = []
  for (const s of local) {
    points.push(s.from, s.to)
    if (s.type === 'circularArc') {
      const a = Math.atan2(s.from.y - s.center.y, s.from.x - s.center.x)
      let b = Math.atan2(s.to.y - s.center.y, s.to.x - s.center.x)
      if (s.sweep) while (b < a - EPS) b += 2 * Math.PI
      else while (b > a + EPS) b -= 2 * Math.PI
      for (const q of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        const t = s.sweep
          ? q + Math.ceil((a - q) / (2 * Math.PI)) * 2 * Math.PI
          : q + Math.floor((a - q) / (2 * Math.PI)) * 2 * Math.PI
        if ((s.sweep && t >= a - EPS && t <= b + EPS) || (!s.sweep && t <= a + EPS && t >= b - EPS))
          points.push({
            x: s.center.x + s.radiusMm * Math.cos(t),
            y: s.center.y + s.radiusMm * Math.sin(t),
          })
      }
    }
  }
  const b = extent(points)
  return { angleDeg: profile.rotationDeg, widthMm: b.maxX - b.minX, lengthMm: b.maxY - b.minY }
}

export function validPickupTransform(c: PickupCavity) {
  return (
    validNumber(c.centerYmm) &&
    validNumber(c.angleDeg) &&
    c.angleDeg >= PICKUP_MIN_ANGLE_DEG &&
    c.angleDeg <= PICKUP_MAX_ANGLE_DEG &&
    validNumber(c.widthMm) &&
    c.widthMm >= PICKUP_MIN_DIMENSION_MM &&
    c.widthMm <= PICKUP_MAX_DIMENSION_MM &&
    validNumber(c.lengthMm) &&
    c.lengthMm >= PICKUP_MIN_DIMENSION_MM &&
    c.lengthMm <= PICKUP_MAX_DIMENSION_MM
  )
}

const arcCubic = (
  center: Point,
  radius: number,
  a: number,
  b: number,
): Extract<PickupRouteSegment, { type: 'cubicBezier' }> => {
  const k = (4 / 3) * Math.tan((b - a) / 4)
  const point = (t: number) => ({
    x: center.x + radius * Math.cos(t),
    y: center.y + radius * Math.sin(t),
  })
  const from = point(a),
    to = point(b)
  return {
    type: 'cubicBezier',
    from,
    control1: { x: from.x - radius * Math.sin(a) * k, y: from.y + radius * Math.cos(a) * k },
    control2: { x: to.x + radius * Math.sin(b) * k, y: to.y - radius * Math.cos(b) * k },
    to,
  }
}

const mapPoint = (
  p: Point,
  scaleX: number,
  scaleY: number,
  angleDeg: number,
  centerYmm: number,
) => {
  const scaled = { x: p.x * scaleX, y: p.y * scaleY }
  const rotated = rotate(scaled, angleDeg)
  return { x: rotated.x, y: rotated.y + centerYmm }
}

function localSegments(profile: PickupProfile): PickupRouteSegment[] {
  const turnBack = (p: Point) => rotate(p, -profile.rotationDeg)
  return profile.segments.map((s) =>
    s.type === 'line'
      ? { type: 'line' as const, from: turnBack(s.from), to: turnBack(s.to) }
      : s.type === 'cubicBezier'
        ? {
            type: 'cubicBezier' as const,
            from: turnBack(s.from),
            control1: turnBack(s.control1),
            control2: turnBack(s.control2),
            to: turnBack(s.to),
          }
        : { ...s, from: turnBack(s.from), to: turnBack(s.to), center: turnBack(s.center) },
  )
}

/** Shared final-space pickup geometry for canvas, collision checks and exports. */
export function pickupGeometry(c: PickupCavity) {
  const profile = pickupProfile(c.profileId, c.profileVersion)
  if (!profile || !validPickupTransform(c)) return null
  const defaults = pickupDefaults(profile)
  const sx = c.widthMm / defaults.widthMm,
    sy = c.lengthMm / defaults.lengthMm
  const segments: PickupRouteSegment[] = []
  const map = (p: Point) => mapPoint(p, sx, sy, c.angleDeg, c.centerYmm)
  for (const source of localSegments(profile)) {
    if (source.type === 'line')
      segments.push({ type: 'line', from: map(source.from), to: map(source.to) })
    else if (source.type === 'cubicBezier') {
      segments.push({
        type: 'cubicBezier',
        from: map(source.from),
        control1: map(source.control1),
        control2: map(source.control2),
        to: map(source.to),
      })
    } else {
      const uniform = Math.abs(sx - sy) <= 1e-12
      if (uniform) {
        segments.push({
          ...source,
          from: map(source.from),
          to: map(source.to),
          center: map(source.center),
          radiusMm: source.radiusMm * sx,
        })
      } else {
        let a = Math.atan2(source.from.y - source.center.y, source.from.x - source.center.x)
        let b = Math.atan2(source.to.y - source.center.y, source.to.x - source.center.x)
        if (source.sweep) while (b < a - EPS) b += 2 * Math.PI
        else while (b > a + EPS) b -= 2 * Math.PI
        // Five-degree circular pieces bound the transformed ellipse approximation below 0.01 mm
        // at the 1000 mm technical size limit; each piece is then affine-transformed.
        const count = Math.max(1, Math.ceil(Math.abs(b - a) / (Math.PI / 36)))
        if (anisotropicArcErrorBound(source.radiusMm, Math.max(sx, sy)) >= PICKUP_TOLERANCE_MM)
          throw new Error('The pickup shape exceeds the geometric error limit.')
        if (segments.length + count > PICKUP_MAX_SEGMENTS)
          throw new Error('The pickup shape is too complex.')
        for (let i = 0; i < count; i++) {
          const q = arcCubic(
            source.center,
            source.radiusMm,
            a + ((b - a) * i) / count,
            a + ((b - a) * (i + 1)) / count,
          )
          segments.push({
            type: 'cubicBezier',
            from: map(q.from),
            control1: map(q.control1),
            control2: map(q.control2),
            to: map(q.to),
          })
        }
      }
    }
  }
  const samples: Point[] = []
  for (const s of segments) {
    if (!samples.length) samples.push(s.from)
    if (s.type === 'line') samples.push(s.to)
    else if (s.type === 'circularArc') {
      const a = Math.atan2(s.from.y - s.center.y, s.from.x - s.center.x)
      let b = Math.atan2(s.to.y - s.center.y, s.to.x - s.center.x)
      if (s.sweep) while (b < a - EPS) b += 2 * Math.PI
      else while (b > a + EPS) b -= 2 * Math.PI
      const n = Math.max(
        1,
        Math.ceil(
          Math.abs(b - a) / (2 * Math.acos(Math.max(-1, 1 - PICKUP_TOLERANCE_MM / s.radiusMm))),
        ),
      )
      for (let i = 1; i <= n; i++)
        samples.push(
          i === n
            ? s.to
            : {
                x: s.center.x + s.radiusMm * Math.cos(a + ((b - a) * i) / n),
                y: s.center.y + s.radiusMm * Math.sin(a + ((b - a) * i) / n),
              },
        )
    } else {
      const cubic = s as Extract<PickupRouteSegment, { type: 'cubicBezier' }>
      flattenCubic(cubic.from, cubic.control1, cubic.control2, cubic.to, samples)
    }
  }
  if (samples.length > PICKUP_MAX_SEGMENTS) throw new Error('The pickup shape is too complex.')
  const path =
    segments.reduce((d, s, i) => {
      const start = i ? '' : `M ${pair(s.from)}`
      if (s.type === 'line') return `${d}${start} L ${pair(s.to)}`
      if (s.type === 'cubicBezier')
        return `${d}${start} C ${pair(s.control1)} ${pair(s.control2)} ${pair(s.to)}`
      return `${d}${start} A ${s.radiusMm} ${s.radiusMm} 0 ${s.largeArc} ${s.sweep} ${pair(s.to)}`
    }, '') + ' Z'
  return { profile, segments, samples, path, bounds: extent(samples), defaults }
}

export const isPickupCustomized = (c: PickupCavity) => {
  const geometry = pickupGeometry(c)
  return (
    !!geometry &&
    (c.angleDeg !== geometry.defaults.angleDeg ||
      c.widthMm !== geometry.defaults.widthMm ||
      c.lengthMm !== geometry.defaults.lengthMm)
  )
}

export const pickupPath = (c: PickupCavity) => pickupGeometry(c)?.path ?? ''
function flattenCubic(a: Point, b: Point, c: Point, d: Point, out: Point[], depth = 0) {
  if (Math.max(distance(b, a, d), distance(c, a, d)) <= PICKUP_TOLERANCE_MM) {
    out.push(d)
    return
  }
  if (depth >= 18 || out.length > 20000)
    throw new Error('The shape is too complex for pickup-cavity placement checking.')
  const mid = (p: Point, q: Point) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }),
    ab = mid(a, b),
    bc = mid(b, c),
    cd = mid(c, d),
    abc = mid(ab, bc),
    bcd = mid(bc, cd),
    m = mid(abc, bcd)
  flattenCubic(a, ab, abc, m, out, depth + 1)
  flattenCubic(m, bcd, cd, d, out, depth + 1)
}
function outlinePolygon(nodes: OutlineNode[]) {
  const out: Point[] = [{ x: nodes[0].x, y: nodes[0].y }]
  nodes.forEach((n, i) => {
    const s = segmentPoints(nodes, i)
    if (n.outgoing === 'line') out.push(s.p3)
    else flattenCubic(s.p0, s.p1, s.p2, s.p3, out)
  })
  out.pop()
  return out
}
type Edge = { a: Point; b: Point; minX: number; maxX: number; minY: number; maxY: number }
const edges = (p: Point[], closed = true): Edge[] =>
  p.slice(0, closed ? p.length : -1).map((a, i) => {
    const b = p[(i + 1) % p.length]
    return {
      a,
      b,
      minX: Math.min(a.x, b.x),
      maxX: Math.max(a.x, b.x),
      minY: Math.min(a.y, b.y),
      maxY: Math.max(a.y, b.y),
    }
  })
function edgeContact(a: Edge, b: Edge) {
  if (
    a.maxX + CONTACT < b.minX ||
    b.maxX + CONTACT < a.minX ||
    a.maxY + CONTACT < b.minY ||
    b.maxY + CONTACT < a.minY
  )
    return false
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
const boundariesMeet = (a: Edge[], b: Edge[]) => a.some((e) => b.some((f) => edgeContact(e, f)))
export function polygonContains(poly: Point[], p: Point) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      inside = !inside
  }
  return inside
}
export function polygonsOverlap(a: Point[], b: Point[]) {
  const x = extent(a),
    y = extent(b)
  if (
    x.maxX + CONTACT < y.minX ||
    y.maxX + CONTACT < x.minX ||
    x.maxY + CONTACT < y.minY ||
    y.maxY + CONTACT < x.minY
  )
    return false
  return boundariesMeet(edges(a), edges(b)) || polygonContains(a, b[0]) || polygonContains(b, a[0])
}
export function polygonFits(body: Point[], route: Point[]) {
  return polygonContains(body, route[0]) && !boundariesMeet(edges(body), edges(route))
}
function bridgeSegments(d: ProjectDocument) {
  const n = d.neck,
    b = d.body.neckJointBoundary
  if (!n || !b) return []
  const datum = d.body.outline.nodes.find((v) => v.id === b.anchorIds[1])
  if (!datum) return []
  return pchipToBezierSegments(
    n.snapshot.bridge.map((p) => transformPoint(p, n.placement, n.snapshot, datum)),
  )
}
export function bridgeCenterY(d: ProjectDocument): number | null {
  for (const s of bridgeSegments(d)) {
    if (s.p0.x <= 0 && s.p1.x >= 0) {
      const t = -s.p0.x / (s.p1.x - s.p0.x)
      return cubicAt(s.p0, s.c1, s.c2, s.p1, t).y
    }
  }
  return null
}
function bridgePolyline(d: ProjectDocument, minX: number, maxX: number) {
  const segs = bridgeSegments(d)
  if (!segs.length) return []
  const out: Point[] = [segs[0].p0]
  for (const s of segs) flattenCubic(s.p0, s.c1, s.c2, s.p1, out)
  if (out[0].x > minX) out.unshift({ x: minX, y: out[0].y })
  if (out.at(-1)!.x < maxX) out.push({ x: maxX, y: out.at(-1)!.y })
  return out
}
function pocketPolygon(p: NeckPocketGeometry) {
  const r = new Route()
  r.line(p.mouth.left)
  r.line(p.leftSideTangent)
  if (p.radiusMm > EPS)
    r.arc(
      { x: p.leftEndTangent.x, y: p.leftEndTangent.y - p.radiusMm },
      p.radiusMm,
      p.leftEndTangent,
      0,
    )
  else r.line(p.leftCorner)
  r.line(p.rightEndTangent)
  if (p.radiusMm > EPS)
    r.arc(
      { x: p.rightEndTangent.x, y: p.rightEndTangent.y - p.radiusMm },
      p.radiusMm,
      p.rightSideTangent,
      0,
    )
  else r.line(p.rightCorner)
  r.line(p.mouth.right)
  const n = [p.mouth.right, p.mouth.center, p.mouth.left]
  for (let i = 0; i < 2; i++) {
    const s = segmentPoints(n, i)
    if (s.source.outgoing === 'line') r.samples.push(s.p3)
    else flattenCubic(s.p0, s.p1, s.p2, s.p3, r.samples)
  }
  return r.samples
}
const translate = (p: Point[], y: number) => p.map((q) => ({ x: q.x, y: q.y + y }))
function context(d: ProjectDocument) {
  const body = outlinePolygon(d.body.outline.nodes),
    b = extent(body),
    heel = physicalHeel(d),
    fretboard = physicalFretboard(d),
    pocket = automaticPocket(d)
  const bridge = bridgePolyline(d, b.minX - 100, b.maxX + 100)
  return {
    body,
    bodyEdges: edges(body),
    bounds: b,
    bridge,
    bridgeEdges: edges(bridge, false),
    heelEnd: heel?.leftCorner.y ?? null,
    fretboardEnd: fretboard?.leftCorner.y ?? null,
    pockets: [heel, pocket].filter((p): p is NeckPocketGeometry => !!p).map(pocketPolygon),
    others: d.pickupCavities.flatMap((c) => {
      const geometry = pickupGeometry(c)
      return geometry ? [{ id: c.id, points: geometry.samples }] : []
    }),
  }
}
type Context = ReturnType<typeof context>
function curveY(curve: Point[], x: number) {
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i],
      b = curve[i + 1]
    if (a.x <= x + EPS && b.x >= x - EPS) return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x)
  }
  return null
}
function placementError(
  ctx: Context,
  points: Point[],
  centerY: number,
  ignore?: string,
): string | null {
  const route = translate(points, centerY),
    re = edges(route)
  if (!polygonContains(ctx.body, route[0]) || boundariesMeet(ctx.bodyEdges, re))
    return 'The pickup cavity does not fit within the body.'
  if (ctx.heelEnd === null || ctx.fretboardEnd === null || !ctx.bridge.length)
    return 'Accept the neck before adding a pickup cavity.'
  if (route.some((p) => p.y < ctx.fretboardEnd! + CONTACT))
    return 'The pickup cavity crosses the physical end of the fretboard.'
  if (ctx.pockets.some((p) => polygonsOverlap(route, p)))
    return 'The pickup cavity intersects the neck pocket.'
  if (ctx.others.some((p) => p.id !== ignore && polygonsOverlap(route, p.points)))
    return 'The pickup cavities intersect each other.'
  if (
    route.some((p) => {
      const y = curveY(ctx.bridge, p.x)
      return y === null || p.y > y - CONTACT
    }) ||
    boundariesMeet(re, ctx.bridgeEdges)
  )
    return 'The pickup cavity crosses the bridge contact line.'
  return null
}
export function pickupPlacementError(
  d: ProjectDocument,
  c: PickupCavity,
  ignoreId?: string,
): string | null {
  try {
    const geometry = pickupGeometry(c)
    if (!geometry) return 'The pickup-cavity geometry is invalid.'
    return placementError(context(d), geometry.samples, 0, ignoreId)
  } catch (e) {
    return (e as Error).message
  }
}
export const pickupDistanceToBridge = (d: ProjectDocument, c: PickupCavity) => {
  const y = bridgeCenterY(d)
  return y === null ? null : y - c.centerYmm
}
/** All vertex/edge contact offsets for vertical translation, with no millimetre search grid. */
function contactOffsets(moving: Point[], fixed: Point[], closed = true) {
  const out: number[] = [],
    me = edges(moving),
    fe = edges(fixed, closed)
  const add = (v: Point, e: Edge, sign: number) => {
    if (v.x < e.minX - EPS || v.x > e.maxX + EPS) return
    if (e.maxX - e.minX < EPS) {
      out.push(sign * (e.a.y - v.y), sign * (e.b.y - v.y))
      return
    }
    const y = e.a.y + ((e.b.y - e.a.y) * (v.x - e.a.x)) / (e.b.x - e.a.x)
    out.push(sign * (y - v.y))
  }
  for (const p of moving) for (const e of fe) add(p, e, 1)
  for (const p of fixed) for (const e of me) add(p, e, -1)
  return out
}
export function firstPickupPosition(
  d: ProjectDocument,
  profileId = 'sh12-humbucker',
  profileVersion = 1,
  preferredDistanceMm?: number,
): number | null {
  const p = pickupProfile(profileId, profileVersion)
  if (!p) return null
  try {
    const defaults = pickupDefaults(p)
    const draft: PickupCavity = {
      id: '__new__',
      profileId,
      profileVersion,
      centerYmm: 0,
      ...defaults,
    }
    const geometry = pickupGeometry(draft)
    if (!geometry) return null
    const ctx = context(d),
      b = extent(geometry.samples)
    if (ctx.fretboardEnd === null || !ctx.bridge.length) return null
    const low = Math.max(ctx.bounds.minY, ctx.fretboardEnd) - b.minY + 2 * CONTACT
    const bridgeContacts = contactOffsets(geometry.samples, ctx.bridge, false)
    const high = Math.min(ctx.bounds.maxY - b.maxY, ...bridgeContacts) - 2 * CONTACT
    if (!(high > low)) return null
    if (preferredDistanceMm !== undefined) {
      const by = bridgeCenterY(d)
      if (by !== null && !placementError(ctx, geometry.samples, by - preferredDistanceMm))
        return by - preferredDistanceMm
    }
    const events = [
      low,
      high,
      ...contactOffsets(geometry.samples, ctx.body).filter((y) => y > low && y < high),
    ]
    for (const o of ctx.others) {
      const ys = contactOffsets(geometry.samples, o.points)
      if (ys.length) events.push(Math.min(...ys) - 2 * CONTACT, Math.max(...ys) + 2 * CONTACT)
    }
    const sorted = [...new Set(events.filter((y) => y >= low && y <= high))].sort((a, b) => a - b)
    let best: { y: number; length: number } | null = null,
      runStart: number | null = null
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i],
        b = sorted[i + 1],
        mid = (a + b) / 2,
        valid = b - a > 2 * CONTACT && !placementError(ctx, geometry.samples, mid)
      if (valid) {
        if (runStart === null || placementError(ctx, geometry.samples, a)) runStart = a
        const length = b - runStart
        if (!best || length > best.length) {
          const y = (runStart + b) / 2
          if (!placementError(ctx, geometry.samples, y)) best = { y, length }
        }
      } else runStart = null
    }
    return best?.y ?? null
  } catch {
    return null
  }
}
