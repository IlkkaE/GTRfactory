import { boundsOf, mapSegment, at } from './math'
import { layoutDrawing } from './layout'
import { PART_NAMES, type PartDrawing, type Measurement } from './model'
import { rearElectronicsCavityGeometry } from '../electronicsCavity'
import type { Point } from '../geometry/neckPocket'
import { automaticPocket, physicalFretboard, physicalHeel } from '../neck/automaticPocket'
import { transformPoint } from '../neck/fretfactoryGeometry'
import { pchipToBezierSegments } from '../neck/vendor/pchip'
import { headstockGeometry, headstockFit, tunerHoles, isHeadless } from '../headstock/template'
import { bassDerivedLayout, isBassTemplate } from '../headstock/bass'
import type { ProjectDocument } from '../model/project'
import {
  isPickupCustomized,
  pickupDistanceToBridge,
  pickupGeometry,
  pickupPlacementError,
} from '../pickup/profiles'
import {
  backTemplateGeometry,
  frontTemplateGeometry,
  pocketTemplateGeometry,
  type TemplateSegment,
} from '../templates/templateGeometry'
import type {
  ExportCircle,
  ExportDrawing,
  ExportOptions,
  ExportPart,
  ExportPath,
  ExportSegment,
  ExportRole,
} from './model'

const copy = (p: Point): Point => ({ x: p.x, y: p.y })
const fromTemplate = (segment: TemplateSegment): ExportSegment => {
  if (segment.type === 'line')
    return { type: 'line', from: copy(segment.from), to: copy(segment.to) }
  if (segment.type === 'circularArc')
    return {
      type: 'circularArc',
      from: copy(segment.from),
      to: copy(segment.to),
      radiusMm: segment.radiusMm,
      sweep: segment.sweep,
    }
  return {
    type: 'cubicBezier',
    from: copy(segment.from),
    control1: copy(segment.control1),
    control2: copy(segment.control2),
    to: copy(segment.to),
  }
}
const path = (
  role: ExportRole,
  segments: ExportSegment[],
  closed = false,
  name?: string,
): ExportPath => ({ role, segments, closed, name })
function neckContour(
  document: ProjectDocument,
  fretboard: boolean,
  includeHeadstock = false,
): ExportPath | null {
  if (!document.neck) return null
  const profile = fretboard ? physicalFretboard(document) : physicalHeel(document)
  const datum = document.body.outline.nodes.find(
    (n) => n.id === document.body.neckJointBoundary?.anchorIds[1],
  )
  if (!profile || !datum) return null
  const nut = document.neck.snapshot.nut.map((p) =>
    transformPoint(p, document.neck!.placement, document.neck!.snapshot, datum),
  )
  const start = nut[0],
    endNut = nut.at(-1)!
  const segments: ExportSegment[] = []
  if (includeHeadstock) {
    const h = headstockGeometry(document)
    if (!h) return null
    for (let i = 0; i < h.nodes.length - 1; i++) {
      const a = h.nodes[i],
        b = h.nodes[i + 1]
      segments.push(
        a.outgoing === 'line'
          ? { type: 'line', from: copy(a), to: copy(b) }
          : {
              type: 'cubicBezier',
              from: copy(a),
              control1: { x: a.x + (a.outHandle?.dx ?? 0), y: a.y + (a.outHandle?.dy ?? 0) },
              control2: { x: b.x + (b.inHandle?.dx ?? 0), y: b.y + (b.inHandle?.dy ?? 0) },
              to: copy(b),
            },
      )
    }
    segments.push({ type: 'line', from: endNut, to: profile.rightSideTangent })
    if (profile.radiusMm > 0) {
      segments.push({
        type: 'circularArc',
        from: profile.rightSideTangent,
        to: profile.rightEndTangent,
        radiusMm: profile.radiusMm,
        sweep: 1,
      })
      segments.push({ type: 'line', from: profile.rightEndTangent, to: profile.leftEndTangent })
      segments.push({
        type: 'circularArc',
        from: profile.leftEndTangent,
        to: profile.leftSideTangent,
        radiusMm: profile.radiusMm,
        sweep: 1,
      })
    } else {
      segments.push(
        { type: 'line', from: profile.rightSideTangent, to: profile.rightCorner },
        { type: 'line', from: profile.rightCorner, to: profile.leftCorner },
        { type: 'line', from: profile.leftCorner, to: profile.leftSideTangent },
      )
    }
    segments.push({ type: 'line', from: profile.leftSideTangent, to: start })
  } else {
    segments.push({ type: 'line', from: start, to: profile.leftSideTangent })
    if (profile.radiusMm > 0) {
      segments.push(
        {
          type: 'circularArc',
          from: profile.leftSideTangent,
          to: profile.leftEndTangent,
          radiusMm: profile.radiusMm,
          sweep: 0,
        },
        { type: 'line', from: profile.leftEndTangent, to: profile.rightEndTangent },
        {
          type: 'circularArc',
          from: profile.rightEndTangent,
          to: profile.rightSideTangent,
          radiusMm: profile.radiusMm,
          sweep: 0,
        },
      )
    } else
      segments.push(
        { type: 'line', from: profile.leftSideTangent, to: profile.leftCorner },
        { type: 'line', from: profile.leftCorner, to: profile.rightCorner },
        { type: 'line', from: profile.rightCorner, to: profile.rightSideTangent },
      )
    segments.push({ type: 'line', from: profile.rightSideTangent, to: endNut })
    for (const s of pchipToBezierSegments(nut).reverse())
      segments.push({ type: 'cubicBezier', from: s.p1, control1: s.c2, control2: s.c1, to: s.p0 })
  }
  return path('CUT_OUTER', segments, true, fretboard ? 'Fretboard' : 'Neck')
}
function headstockContour(document: ProjectDocument): ExportPath | null {
  const h = headstockGeometry(document)
  if (!h) return null
  const nodes = h.nodes
  const segments: ExportSegment[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i],
      b = nodes[i + 1]
    segments.push(
      a.outgoing === 'line'
        ? { type: 'line', from: copy(a), to: copy(b) }
        : {
            type: 'cubicBezier',
            from: copy(a),
            control1: { x: a.x + (a.outHandle?.dx ?? 0), y: a.y + (a.outHandle?.dy ?? 0) },
            control2: { x: b.x + (b.inHandle?.dx ?? 0), y: b.y + (b.inHandle?.dy ?? 0) },
            to: copy(b),
          },
    )
  }
  const nut = document.neck!.snapshot.nut
  const datum = document.body.outline.nodes.find(
    (n) => n.id === document.body.neckJointBoundary!.anchorIds[1],
  )!
  const transformed = nut.map((p) =>
    transformPoint(p, document.neck!.placement, document.neck!.snapshot, datum),
  )
  for (const s of pchipToBezierSegments(transformed).reverse())
    segments.push({ type: 'cubicBezier', from: s.p1, control1: s.c2, control2: s.c1, to: s.p0 })
  return path('CUT_OUTER', segments, true, 'Headstock')
}
function pickupSegments(document: ProjectDocument): ExportPath[] {
  return document.pickupCavities.flatMap((c) => {
    const geometry = pickupGeometry(c)
    if (!geometry) return []
    const segments: ExportSegment[] = geometry.segments.map((s) =>
      s.type === 'line'
        ? {
            type: 'line',
            from: s.from,
            to: s.to,
          }
        : s.type === 'cubicBezier'
          ? {
              type: 'cubicBezier',
              from: s.from,
              control1: s.control1,
              control2: s.control2,
              to: s.to,
            }
          : {
              type: 'circularArc',
              from: s.from,
              to: s.to,
              center: s.center,
              radiusMm: s.radiusMm,
              sweep: s.sweep,
              largeArc: s.largeArc,
            },
    )
    return [
      path(
        'ROUTE_PICKUP',
        segments,
        true,
        geometry.profile.name + (isPickupCustomized(c) ? ' (custom)' : ''),
      ),
    ]
  })
}

function neckCenterline(document: ProjectDocument, fretboard: boolean): ExportPath {
  const neck = document.neck!
  const datum = document.body.outline.nodes.find(
    (n) => n.id === document.body.neckJointBoundary!.anchorIds[1],
  )!
  const nut = neck.snapshot.nut.map((p) => transformPoint(p, neck.placement, neck.snapshot, datum))
  const segment = pchipToBezierSegments(nut).find((s) => s.p0.x <= 0 && s.p1.x >= 0)
  if (!segment) throw new Error('The nut and centerline intersection is missing.')
  const t = (0 - segment.p0.x) / (segment.p1.x - segment.p0.x)
  const start = at(
    {
      type: 'cubicBezier',
      from: segment.p0,
      control1: segment.c1,
      control2: segment.c2,
      to: segment.p1,
    },
    t,
  )
  const profile = (fretboard ? physicalFretboard(document) : physicalHeel(document))!
  return path(
    'REFERENCE_CENTERLINE',
    [{ type: 'line', from: { x: 0, y: start.y }, to: { x: 0, y: profile.leftCorner.y } }],
    false,
    'Centerline',
  )
}

function makePart(document: ProjectDocument, id: ExportPart, o: ExportOptions): PartDrawing {
  const paths: ExportPath[] = [],
    circles: ExportCircle[] = []
  const requireNeck = () => {
    if (!document.neck) throw new Error('Apply the neck before exporting this part.')
  }
  const add = (p: ExportPath | null) => {
    if (!p) throw new Error('Part geometry is missing.')
    paths.push(p)
  }
  const holes = () => {
    requireNeck()
    for (const h of tunerHoles(document))
      circles.push({ role: 'DRILL_TUNER', center: { x: h.x, y: h.y }, radiusMm: h.r })
  }
  const curve = (points: Point[], name: string, role: ExportRole = 'REFERENCE') =>
    path(
      role,
      pchipToBezierSegments(points).map((s) => ({
        type: 'cubicBezier',
        from: s.p0,
        control1: s.c1,
        control2: s.c2,
        to: s.p1,
      })),
      false,
      name,
    )
  const neckPoints = () => {
    requireNeck()
    const n = document.neck!,
      datum = document.body.outline.nodes.find(
        (p) => p.id === document.body.neckJointBoundary?.anchorIds[1],
      )
    if (!datum) throw new Error('The neck joint is missing.')
    return { n, move: (p: Point) => transformPoint(p, n.placement, n.snapshot, datum) }
  }
  if (id === 'front' || id === 'back' || id === 'overview') {
    const g =
      id === 'back'
        ? backTemplateGeometry(document.body.outline.nodes)
        : frontTemplateGeometry(document.body.outline.nodes)
    if (!g.cut) throw new Error(g.diagnostic?.message ?? 'The body geometry is invalid.')
    paths.push(path('CUT_OUTER', g.cut.segments.map(fromTemplate), true, PART_NAMES[id]))
    if (o.includeCenterlines) {
      const line = fromTemplate(g.centerline)
      if (id === 'overview' && document.neck) {
        const neckLine = neckCenterline(document, false).segments[0]
        line.from.y = Math.min(line.from.y, neckLine.from.y)
      }
      paths.push(path('REFERENCE_CENTERLINE', [line], false, 'Centerline'))
    }
    if (id !== 'back' && o.includePickups) {
      for (const c of document.pickupCavities) {
        const error = pickupPlacementError(document, c, c.id)
        if (error) throw new Error(error)
      }
      paths.push(...pickupSegments(document))
    }
    if (id === 'back' && o.includeElectronics) {
      const c = rearElectronicsCavityGeometry(document)
      if (c) {
        if (c.diagnostic) throw new Error(c.diagnostic.message)
        const mirror = (p: Point) => ({ x: -p.x, y: p.y })
        for (const [contour, role] of [
          [c.outer, 'ROUTE_REAR_RECESS'],
          [c.inner, 'ROUTE_REAR_INNER'],
        ] as const)
          paths.push(
            path(
              role,
              contour.segments.map((s) => mapSegment(s as ExportSegment, mirror, true)),
              true,
            ),
          )
      }
    }
    if (id === 'overview') {
      requireNeck()
      add(neckContour(document, false, !isHeadless(document.neck!.headstock.activeTemplateId)))
      add(neckContour(document, true))
      holes()
    }
    if (id !== 'back' && o.includeReferences && document.neck) {
      const { n, move } = neckPoints()
      if (id === 'overview') paths.push(curve(n.snapshot.nut.map(move), 'Nut line'))
      paths.push(curve(n.snapshot.bridge.map(move), 'Bridge contact line'))
    }
  } else if (id === 'pocket') {
    const template = pocketTemplateGeometry(document)
    if (!template.cut)
      throw new Error(template.diagnostic?.message ?? 'The neck pocket template is invalid.')
    paths.push(path('CUT_OUTER', template.cut.segments.map(fromTemplate), true, PART_NAMES.pocket))
    if (o.includeCenterlines) {
      const b = boundsOf(paths)
      paths.push(
        path(
          'REFERENCE_CENTERLINE',
          [{ type: 'line', from: { x: 0, y: b.minY }, to: { x: 0, y: b.maxY } }],
          false,
        ),
      )
    }
  } else {
    requireNeck()
    if (id === 'neck') {
      const fit = headstockFit(document)
      if (!fit.valid) throw new Error(fit.errors.join(' '))
      add(neckContour(document, false, !isHeadless(document.neck!.headstock.activeTemplateId)))
      holes()
    }
    if (id === 'headstock') {
      if (isHeadless(document.neck!.headstock.activeTemplateId))
        throw new Error('A headless guitar has no headstock to export.')
      const fit = headstockFit(document)
      if (!fit.valid) throw new Error(fit.errors.join(' '))
      add(headstockContour(document))
      holes()
    }
    if (id === 'fretboard') {
      add(neckContour(document, true))
      if (o.includeFretGuides) {
        const { n, move } = neckPoints()
        for (const fret of n.snapshot.frets)
          paths.push(curve(fret.points.map(move), 'Fret ' + fret.n, 'FRET_GUIDE'))
      }
    }
    if (o.includeCenterlines && (id === 'neck' || id === 'fretboard'))
      paths.push(neckCenterline(document, id === 'fretboard'))
    if (o.includeReferences) {
      const { n, move } = neckPoints()
      paths.push(curve(n.snapshot.nut.map(move), 'Nut line'))
    }
  }
  if (id === 'overview') {
    for (const p of paths) if (p.role !== 'REFERENCE_CENTERLINE') p.role = 'REFERENCE'
    for (const c of circles) c.role = 'REFERENCE'
  }
  return { id, name: PART_NAMES[id], paths, circles, bounds: boundsOf(paths, circles) }
}
function measurements(
  document: ProjectDocument,
  ids: ExportPart[],
  includePickups: boolean,
): Measurement[] {
  const rows: Measurement[] = []
  const add = (group: string, label: string, value: number, count = false, unit?: 'deg') => {
    if (Number.isFinite(value)) rows.push({ group, label, value, count, unit })
  }
  const has = (...parts: ExportPart[]) =>
    parts.some((p) => ids.includes(p)) || ids.includes('overview')
  if (has('front', 'back')) {
    const g = frontTemplateGeometry(document.body.outline.nodes)
    if (g.cut) {
      const b = boundsOf([path('CUT_OUTER', g.cut.segments.map(fromTemplate))])
      add('Body', 'Length', b.height)
      add('Body', 'Maximum width', b.width)
    }
  }
  if (includePickups && has('front') && document.pickupCavities.length) {
    for (const c of document.pickupCavities) {
      const g = pickupGeometry(c)
      if (!g) continue
      const custom = isPickupCustomized(c)
      const group = custom ? `Pickup: ${g.profile.name} (custom)` : `Pickup: ${g.profile.name}`
      add(group, 'Width', c.widthMm)
      add(group, 'Length', c.lengthMm)
      add(group, 'Angle', c.angleDeg, false, 'deg')
      const distance = pickupDistanceToBridge(document, c)
      if (distance !== null) add(group, 'Distance to bridge', distance)
    }
  }
  const n = document.neck
  if (n) {
    if (has('neck', 'fretboard')) {
      const group = has('neck') ? 'Neck' : 'Fretboard'
      add(group, 'Scale length (treble)', n.params.scaleTreble)
      if (n.params.scaleBass !== n.params.scaleTreble)
        add(group, 'Scale length (bass)', n.params.scaleBass)
      add(group, 'Strings', n.params.strings, true)
      add(group, 'Frets', n.params.frets, true)
    }
    for (const [id, board] of [
      ['neck', false],
      ['fretboard', true],
    ] as const)
      if (has(id)) {
        const p = neckContour(document, board, !board),
          profile = board ? physicalFretboard(document) : physicalHeel(document)
        if (p && profile) {
          const b = boundsOf([p]),
            g = board ? 'Fretboard' : 'Neck'
          add(
            g,
            board || isHeadless(n.headstock.activeTemplateId)
              ? 'Length'
              : 'Length including headstock',
            b.height,
          )
          add(g, 'Width at nut', n.snapshot.nut.at(-1)!.x - n.snapshot.nut[0].x)
          add(g, 'End width (before rounding)', profile.rightCorner.x - profile.leftCorner.x)
          add(
            g,
            board ? 'Fretboard end allowance' : 'Neck end allowance',
            board ? n.end.fretboardEndMarginMm : n.end.endMarginMm,
          )
        }
      }
    if (has('headstock', 'neck')) {
      const p = headstockContour(document)
      if (p) {
        const b = boundsOf([p])
        add('Headstock', 'Length', b.height)
        add('Headstock', 'Maximum width', b.width)
        const h = tunerHoles(document)[0]
        if (h) add('Headstock', 'Tuner hole diameter', h.r * 2)
        if (isBassTemplate(n.headstock.activeTemplateId)) {
          const row = bassDerivedLayout(document)
          add('Headstock', 'Tuner row angle', row.angleDeg ?? NaN, false, 'deg')
          add('Headstock', 'Tuner pitch minimum', Math.min(...row.pitchesMm))
          add('Headstock', 'Tuner pitch maximum', Math.max(...row.pitchesMm))
          add('Headstock', 'Physical width at 12th fret', n.physicalProfile?.widthAt12thMm ?? NaN)
        }
      }
    }
    if (has('pocket')) {
      const p = automaticPocket(document)
      if (p) {
        add('Neck pocket', 'Length from center node', p.leftCorner.y - p.mouth.center.y)
        add('Neck pocket', 'Opening width', p.mouth.right.x - p.mouth.left.x)
        add('Neck pocket', 'End width (before rounding)', p.rightCorner.x - p.leftCorner.x)
        add('Neck pocket', 'End corner radius', p.radiusMm)
      }
    }
  }
  return rows
}
export function buildExportDrawing(
  document: ProjectDocument,
  options: ExportOptions,
): ExportDrawing {
  if (!options.parts.length) throw new Error('Select at least one part.')
  if (!Number.isFinite(options.marginMm) || options.marginMm < 2 || options.marginMm > 40)
    throw new Error('The margin must be between 2 and 40 mm.')
  const order: ExportPart[] = [
    'overview',
    'front',
    'back',
    'pocket',
    'headstock',
    'fretboard',
    'neck',
  ]
  const canonicalParts = order
    .filter((id) => options.parts.includes(id))
    .map((id) => {
      try {
        return makePart(document, id, options)
      } catch (e) {
        throw new Error(PART_NAMES[id] + ': ' + (e as Error).message)
      }
    })
  // Keep the saved geometry canonical. Reflection happens once, before layout,
  // and therefore applies equally to SVG, DXF and PDF curves, arcs and holes.
  const parts =
    document.handedness === 'left'
      ? canonicalParts.map((part) => {
          const mirror = (p: Point) => ({ x: -p.x, y: p.y })
          const paths = part.paths.map((p) => ({
            ...p,
            segments: p.segments.map((s) => mapSegment(s, mirror, true)),
          }))
          const circles = part.circles.map((c) => ({ ...c, center: mirror(c.center) }))
          return { ...part, paths, circles, bounds: boundsOf(paths, circles) }
        })
      : canonicalParts
  let rows: Measurement[] = []
  if (options.includeMeasurements) {
    rows = measurements(
      document,
      options.allMeasurements ? order : options.parts,
      options.includePickups,
    )
    rows.unshift({
      group: 'Instrument',
      label: 'Handedness',
      value: 0,
      text: document.handedness === 'left' ? 'Left-handed' : 'Right-handed',
    })
  }
  return layoutDrawing(document.name, parts, rows, options, document.handedness)
}
