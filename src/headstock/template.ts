import { bassOutlineTransform } from './bassTransform'
import type { NeckDocument, OutlineNode, ProjectDocument } from '../model/project'
import { bounds, splitSegment, segmentPath, segmentPoints, type Point } from '../geometry/outline'
import { transformPoint } from '../neck/fretfactoryGeometry'
import { pchipToBezierSegments } from '../neck/vendor/pchip'
import reference from './reference.json' with { type: 'json' }
import { HEADSTOCK_TEMPLATE_DEFINITIONS } from './variants'
import { bassPosts, isBassTemplate, validateBassPolicy } from './bass'
import { canSplitSegmentAt } from '../editor/segmentSelection'
import {
  HEADSTOCK_TEMPLATE_IDS,
  activeHeadstockNodes as activeNodes,
  canDeleteHeadstockNode as coreCanDelete,
  canSplitHeadstockSegment as coreCanSplit,
  createHeadstockVariants,
  deleteHeadstockNodes as coreDelete,
  headstockTemplate,
  headstockTemplateConstants,
  isProtectedHeadstockHandle as coreProtectedHandle,
  isProtectedHeadstockNode as coreProtectedNode,
  supportsHeadstockTemplate,
  validateHeadstockVariants,
  type HeadstockDocument,
  type HeadstockTemplateId,
} from './variantsCore'
import {
  add,
  sub,
  mul,
  unit,
  distance,
  norm,
  dot,
  insideClearance,
  outsideClearance,
  pairClearance,
  diskClearance,
  selfIntersects,
  flattenCubic,
  segmentsCross,
  segmentDistance,
  angleDeg,
  TOL,
} from './math'

/** Version 2 keeps the inline oracle and both measured 3+3 variants. */
export const HEADSTOCK_VERSION = 3
export const TUNER_PITCH_MM = reference.p
export const TUNER_EDGE_OFFSET_MM = reference.h
export { HEADSTOCK_TEMPLATE_DEFINITIONS, HEADSTOCK_TEMPLATE_IDS, headstockTemplateConstants }
export type { HeadstockDocument, HeadstockTemplateId }
export function createHeadstock(): HeadstockDocument {
  return createHeadstockVariants()
}
export const activeHeadstockNodes = (document: ProjectDocument | HeadstockDocument) =>
  activeNodes(document)
export const isProtectedHeadstockNode = (id: string, headstock?: HeadstockDocument) =>
  coreProtectedNode(id, headstock)
export const isProtectedHeadstockHandle = (
  nodes: OutlineNode[],
  id: string,
  side: 'inHandle' | 'outHandle',
  headstock?: HeadstockDocument,
) => coreProtectedHandle(nodes, id, side, headstock)
export const supportsHeadstock = (document: ProjectDocument) =>
  !!document.neck &&
  ([6, 7, 8].includes(document.neck.params.strings) ||
    isBassTemplate(document.neck.headstock.activeTemplateId))
export const canSplitHeadstockSegment = (document: ProjectDocument, id: string) =>
  coreCanSplit(document, id)
export const canDeleteHeadstockNode = (document: ProjectDocument, id: string) =>
  coreCanDelete(document, id)
export function splitHeadstockNodes(document: ProjectDocument, id: string, t = 0.5): OutlineNode[] {
  if (!canSplitHeadstockSegment(document, id))
    throw new Error("Only a segment of the headstock's free curve can be split.")
  const before = activeNodes(document),
    index = before.findIndex((n) => n.id === id),
    world = headstockWorldNodes(document)
  if (before.length >= 128) throw new Error('The technical limit is 128 headstock nodes.')
  if (!canSplitSegmentAt(world, index, t))
    throw new Error('Select a point within the headstock outline.')
  const divided = splitSegment(world, index, t),
    result = structuredClone(before),
    inserted = divided[index + 1]
  const inverseHandle = (h: OutlineNode['inHandle']) => {
    if (!h) return null
    const p = canonicalHeadstockDelta(document, { x: h.dx, y: h.dy })
    return { dx: p.x, dy: p.y }
  }
  result[index].outHandle = inverseHandle(divided[index].outHandle)
  const next = result[index + 1],
    newIn = divided[index + 2].inHandle!
  if (index + 1 === before.length - 1) {
    const original = next.inHandle!,
      ratio =
        Math.hypot(newIn.dx, newIn.dy) /
        Math.hypot(world.at(-1)!.inHandle!.dx, world.at(-1)!.inHandle!.dy)
    next.inHandle = { dx: original.dx * ratio, dy: original.dy * ratio }
  } else next.inHandle = inverseHandle(newIn)
  result.splice(index + 1, 0, {
    ...inserted,
    ...canonicalHeadstockPoint(document, inserted),
    inHandle: inverseHandle(inserted.inHandle),
    outHandle: inverseHandle(inserted.outHandle),
  })
  const headstock = structuredClone(document.neck!.headstock)
  headstock.variants[headstock.activeTemplateId].nodes = result
  validateHeadstockVariants(headstock)
  return result
}
export const deleteHeadstockNodes = (document: ProjectDocument, ids: Set<string>) =>
  coreDelete(document, ids)
export const headstockScale = (neck: NeckDocument, templateId: HeadstockTemplateId = 'inline') =>
  templateId === 'inline'
    ? (reference.m0 + (neck.params.strings - 1) * reference.p + reference.m1) / reference.L
    : 1
function frame(document: ProjectDocument) {
  const neck = document.neck
  if (!neck) throw new Error('The headstock requires a neck.')
  const datum = document.body.outline.nodes.find(
    (n) => n.id === document.body.neckJointBoundary?.anchorIds[1],
  )
  if (!datum) throw new Error('The neck joint is missing.')
  const move = (p: Point) => transformPoint(p, neck.placement, neck.snapshot, datum),
    nut = neck.snapshot.nut.map(move),
    bridge = neck.snapshot.bridge.map(move),
    headstock = neck.headstock,
    definition = headstockTemplate(headstock.activeTemplateId),
    k = headstockScale(neck, definition.id)
  if (definition.id !== 'inline') {
    const mid = mul(add(definition.nodes[0], definition.nodes.at(-1)!), 0.5),
      nutMid = mul(add(nut[0], nut.at(-1)!), 0.5)
    return { nut, bridge, k, A: nutMid, C0: nutMid, shift: sub(nutMid, mul(mid, k)), definition }
  }
  const C0 = add(nut[1], sub(reference.C0, reference.S0)),
    A = sub(sub(C0, mul(reference.e, reference.m0)), mul(reference.n, reference.h)),
    shift = sub(A, mul(reference.A, k))
  return { nut, bridge, k, A, C0, shift, definition }
}
export function canonicalHeadstockPoint(document: ProjectDocument, point: Point) {
  if (document.neck && isBassTemplate(document.neck.headstock.activeTemplateId))
    return bassOutlineTransform(document).inversePoint(point)
  const f = frame(document)
  return mul(sub(point, f.shift), 1 / f.k)
}
export function canonicalHeadstockDelta(document: ProjectDocument, delta: Point) {
  if (document.neck && isBassTemplate(document.neck.headstock.activeTemplateId))
    return bassOutlineTransform(document).inverseDelta(delta)
  return mul(delta, 1 / frame(document).k)
}
export function headstockWorldNodes(
  document: ProjectDocument,
  nodes = activeNodes(document),
): OutlineNode[] {
  const f = frame(document)
  const affine = isBassTemplate(f.definition.id) ? bassOutlineTransform(document) : null
  const toHandle = (h: OutlineNode['inHandle']) => {
    if (!h) return null
    const p = affine ? affine.delta({ x: h.dx, y: h.dy }) : { x: h.dx * f.k, y: h.dy * f.k }
    return { dx: p.x, dy: p.y }
  }
  const result = nodes.map((n) => ({
    ...structuredClone(n),
    ...(affine ? affine.point(n) : add(mul(n, f.k), f.shift)),
    inHandle: toHandle(n.inHandle),
    outHandle: toHandle(n.outHandle),
  }))
  const first = result[0],
    last = result.at(-1)!,
    firstLength = norm({ x: first.outHandle?.dx ?? 0, y: first.outHandle?.dy ?? -16 }) || 16,
    lastLength = norm({ x: last.inHandle?.dx ?? 0, y: last.inHandle?.dy ?? -16 }) || 16
  Object.assign(first, f.nut[0])
  Object.assign(last, f.nut.at(-1)!)
  const firstDirection = mul(unit(sub(f.nut[0], f.bridge[0])), firstLength),
    lastDirection = mul(unit(sub(f.nut.at(-1)!, f.bridge.at(-1)!)), lastLength)
  first.outHandle = { dx: firstDirection.x, dy: firstDirection.y }
  last.inHandle = { dx: lastDirection.x, dy: lastDirection.y }
  return result
}
function contour(document: ProjectDocument, nodes: OutlineNode[]) {
  const polygon: Point[] = [nodes[0]],
    parts: string[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const s = segmentPoints(nodes, i)
    parts.push(segmentPath(nodes, i).replace(/^M [^ ]+ [^ ]+ /, ''))
    polygon.push(
      ...(nodes[i].outgoing === 'line' ? [s.p3] : flattenCubic(s.p0, s.p1, s.p2, s.p3).slice(1)),
    )
  }
  const nut = frame(document).nut,
    segments = pchipToBezierSegments(nut).reverse(),
    pair = (p: Point) => `${p.x} ${p.y}`
  for (const s of segments) {
    parts.push(`C ${pair(s.c2)} ${pair(s.c1)} ${pair(s.p0)}`)
    polygon.push(...flattenCubic(s.p1, s.c2, s.c1, s.p0).slice(1))
  }
  if (distance(polygon[0], polygon.at(-1)!) < 1e-8) polygon.pop()
  return { path: `M ${pair(nodes[0])} ${parts.join(' ')} Z`, polygon }
}
export function headstockPath(document: ProjectDocument) {
  return contour(document, headstockWorldNodes(document)).path
}
function contourBounds(nodes: OutlineNode[], polygon: Point[]) {
  const nodeBounds = bounds(nodes),
    xs = polygon.map((p) => p.x),
    ys = polygon.map((p) => p.y)
  return {
    minX: Math.min(nodeBounds.minX, ...xs) - TOL,
    minY: Math.min(nodeBounds.minY, ...ys) - TOL,
    maxX: Math.max(nodeBounds.maxX, ...xs) + TOL,
    maxY: Math.max(nodeBounds.maxY, ...ys) + TOL,
    width: Math.max(nodeBounds.maxX, ...xs) - Math.min(nodeBounds.minX, ...xs) + 2 * TOL,
    height: Math.max(nodeBounds.maxY, ...ys) - Math.min(nodeBounds.minY, ...ys) + 2 * TOL,
  }
}
export function headstockBounds(document: ProjectDocument) {
  const nodes = headstockWorldNodes(document),
    shape = contour(document, nodes)
  return contourBounds(nodes, shape.polygon)
}
type TunerHole = Point & {
  r: number
  e: Point
  n: Point
  branch: 1 | -1
  stringIndex: number
  tangent?: Point
}
export function tunerHoles(document: ProjectDocument): TunerHole[] {
  if (!supportsHeadstock(document)) return []
  const f = frame(document),
    posts = f.definition.posts
  if (document.neck && isBassTemplate(document.neck.headstock.activeTemplateId))
    return bassPosts(document)
  if (posts)
    return posts.map((post) => ({
      ...add(mul(post.C, f.k), f.shift),
      r: 5,
      e: post.e,
      n: post.n,
      branch: post.branch,
      stringIndex: post.stringIndex,
    }))
  return Array.from({ length: document.neck!.params.strings }, (_, i) => ({
    ...add(f.C0, mul(reference.e, i * reference.p)),
    r: 5,
    e: reference.e,
    n: reference.n,
    branch: 1 as const,
    stringIndex: i,
  }))
}
const rect = (x0: number, y0: number, x1: number, y1: number): Point[] => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
]
export const BASS_GB2_PROFILE = {
  body: rect(-16.7, -21.5, 29.3, 21.5),
  shaft: rect(10.3, 21.5, 17.3, 42.8),
  button: rect(-6.7, 28.8, 34.3, 67.8),
  screw: { x: 23.8, y: 16 },
  lugRadius: 2.5,
  washerRadius: 11,
  postRadius: 7,
  boreRadius: 8.8,
}
export const M6_PROFILE = {
  body: rect(-10.8, -7.3, 12, 7.3),
  shaft: rect(2.4, -16.4, 11.1, -6.7),
  button: rect(6.75 - Math.hypot(18.5, 7.2) / 2, -32.1, 6.75 + Math.hypot(18.5, 7.2) / 2, -16.3),
  screw: { x: -8.1, y: 4.1 },
  lugRadius: 2.7,
  washerRadius: 7.25,
  postRadius: 3,
  boreRadius: 5,
}
function tangentFor(S: Point, C: Point, branch: 1 | -1, r = 3) {
  const q = sub(C, S),
    d2 = dot(q, q)
  if (d2 <= r * r) return null
  const perpendicular = { x: -q.y, y: q.x }
  return add(
    S,
    add(mul(q, 1 - (r * r) / d2), mul(perpendicular, (branch * r * Math.sqrt(d2 - r * r)) / d2)),
  )
}
export function headstockGeometry(document: ProjectDocument) {
  if (!supportsHeadstock(document)) return null
  const f = frame(document)
  if (!supportsHeadstockTemplate(f.definition, document.neck!.params.strings)) return null
  const nodes = headstockWorldNodes(document),
    shape = contour(document, nodes),
    holes = tunerHoles(document),
    shapeBounds = contourBounds(nodes, shape.polygon)
  const place = (C: Point, p: Point, e: Point, n: Point) => add(C, add(mul(e, p.x), mul(n, p.y)))
  const bass = document.neck && isBassTemplate(document.neck.headstock.activeTemplateId)
  const profile = bass ? BASS_GB2_PROFILE : M6_PROFILE
  const units = holes.map((h) => ({
    C: { x: h.x, y: h.y },
    body: profile.body.map((p) => place(h, p, h.e, h.n)),
    shaft: profile.shaft.map((p) => place(h, p, h.e, h.n)),
    button: profile.button.map((p) => place(h, p, h.e, h.n)),
    screw: place(h, profile.screw, h.e, h.n),
    stringIndex: h.stringIndex,
    branch: h.branch,
  }))
  const strings = holes.map((h) => {
    const S = f.nut[h.stringIndex + 1],
      B = f.bridge[h.stringIndex + 1],
      T = bass && 'tangent' in h ? h.tangent : tangentFor(S, h, h.branch, bass ? 7 : 3)
    return {
      C: { x: h.x, y: h.y },
      S,
      B,
      T,
      angleDeg: T ? angleDeg(sub(S, B), sub(T, S)) : Infinity,
      stringIndex: h.stringIndex,
      branch: h.branch,
    }
  })
  return {
    ...shape,
    nodes,
    holes,
    units,
    strings,
    A: f.A,
    e: holes[0]?.e ?? reference.e,
    n: holes[0]?.n ?? reference.n,
    scale: f.k,
    hardware: bass ? 'GB2' : 'M6',
    edgeLengthMm: bass ? bassOutlineTransform(document).edgeLengthMm : reference.L * f.k,
    maxAngleDeg: Math.max(...strings.map((s) => s.angleDeg)),
    bounds: shapeBounds,
    templateId: f.definition.id,
  }
}
export function headstockFit(document: ProjectDocument) {
  const geometry = headstockGeometry(document)
  if (!geometry)
    return {
      supported: false,
      valid: false,
      errors: ['Headstock support covers 6–8-string guitars and the bass templates.'],
      maxAngleDeg: null,
      minBodyGapMm: null,
      minButtonGapMm: null,
    }
  const { polygon, units, strings } = geometry,
    profile = geometry.hardware === 'GB2' ? BASS_GB2_PROFILE : M6_PROFILE,
    errors: string[] = []
  if (selfIntersects(polygon)) errors.push('The headstock edge self-intersects.')
  let minBodyGapMm = Infinity,
    minButtonGapMm = Infinity
  if (polygon.some((p, i) => distance(p, polygon[(i + 1) % polygon.length]) < 1e-9))
    errors.push('The headstock edge contains a zero-length segment.')
  for (let i = 0; i < units.length; i++) {
    const u = units[i]
    if (
      insideClearance(u.body, polygon) <= TOL ||
      diskClearance(u.screw, profile.lugRadius, polygon) <= TOL
    )
      errors.push('The tuner body or mounting lug crosses the headstock edge.')
    if (diskClearance(u.C, profile.washerRadius, polygon) <= TOL)
      errors.push('The tuner-hole washer crosses the headstock edge.')
    if (outsideClearance(u.button, polygon) <= TOL)
      errors.push('The tuner knob crosses the headstock edge.')
    for (let j = i + 1; j < units.length; j++) {
      const v = units[j]
      minBodyGapMm = Math.min(minBodyGapMm, pairClearance(u.body, v.body))
      minButtonGapMm = Math.min(minButtonGapMm, pairClearance(u.button, v.button))
      for (const a of [u.body, u.shaft, u.button])
        for (const b of [v.body, v.shaft, v.button])
          if (pairClearance(a, b) <= TOL)
            errors.push('The tuner mechanisms collide with each other.')
      if (
        strings[i].T &&
        strings[j].T &&
        segmentsCross(strings[i].S, strings[i].T!, strings[j].S, strings[j].T!)
      )
        errors.push('The strings cross on the headstock.')
    }
    const s = strings[i]
    if (!s.T || dot(sub(s.S, s.B), sub(s.T, s.S)) <= 0)
      errors.push('The string tangent does not run forward to the tuner.')
    if (geometry.hardware === 'GB2' && s.T) {
      const stringDirection = sub(s.S, s.B)
      const tangentDirection = sub(s.T, s.S)
      const denominator =
        Math.hypot(stringDirection.x, stringDirection.y) *
        Math.hypot(tangentDirection.x, tangentDirection.y)
      if (
        denominator === 0 ||
        Math.abs(stringDirection.x * tangentDirection.y - stringDirection.y * tangentDirection.x) /
          denominator >
          Math.sin((0.00001 * Math.PI) / 180)
      )
        errors.push('The bass string centerline must remain straight to its tuner post.')
    }
    if (s.T)
      for (let j = 0; j < units.length; j++)
        if (i !== j && segmentDistance(units[j].C, s.S, s.T) - profile.postRadius <= TOL)
          errors.push('The string hits another tuner post.')
  }
  return {
    supported: true,
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    maxAngleDeg: geometry.maxAngleDeg,
    minBodyGapMm,
    minButtonGapMm,
  }
}
export function validateHeadstockStructure(headstock: HeadstockDocument) {
  validateHeadstockVariants(headstock)
}
export function validateHeadstock(document: ProjectDocument, headstock: HeadstockDocument) {
  validateHeadstockVariants(headstock)
  if (!supportsHeadstock(document)) return
  validateBassPolicy(document)
  const d = headstockTemplate(headstock.activeTemplateId)
  if (!supportsHeadstockTemplate(d, document.neck!.params.strings))
    throw new Error('The active headstock template does not match the neck string count.')
  const fit = headstockFit({ ...document, neck: { ...document.neck!, headstock } })
  if (!fit.valid) throw new Error(fit.errors.join(' '))
}
