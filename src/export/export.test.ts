import { describe, it, expect } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { createStarterDocument } from '../model/project'
import { deriveNeckDocument } from '../neck/neckDocument'
import {
  DEFAULT_EXPORT_OPTIONS,
  type ExportOptions,
  type ExportPart,
  type ExportSegment,
} from './model'
import { buildExportDrawing } from './geometry'
import { planPdfPages } from './pages'
import { arcData, at, arcCubics, segmentBounds } from './math'
import { svgExport } from './svg'
import { dxfExport } from './dxf'
import { pdfExport } from './pdf'
import { PICKUP_PROFILES, firstPickupPosition, pickupDefaults } from '../pickup/profiles'
import { pocketTemplateGeometry } from '../templates/templateGeometry'
const doc = () => deriveNeckDocument(createStarterDocument(), { kind: 'fresh' })!
const options = (parts: ExportPart[], extra: Partial<ExportOptions> = {}): ExportOptions => ({
  ...DEFAULT_EXPORT_OPTIONS,
  includeCenterlines: false,
  includeReferences: false,
  includeFretGuides: false,
  includeMeasurements: false,
  includeNames: false,
  includeCalibration: false,
  parts,
  ...extra,
})
const manualPocket = (document = createStarterDocument()) => {
  const [rightId, centerId, leftId] = document.body.neckJointBoundary!.anchorIds
  const node = (id: string) =>
    structuredClone(document.body.outline.nodes.find((n) => n.id === id)!)
  document.body.neckPocket = {
    datumNodeId: centerId,
    referenceBoundaryNodes: { left: node(leftId), center: node(centerId), right: node(rightId) },
    mouthWinding: 'right-to-left',
    mouthWidthMm: 56,
    heelWidthMm: 56,
    lengthMm: 76,
    fitAllowanceMm: 0,
    radiusMm: 6,
  }
  return document
}
describe('manufacturing exports', () => {
  it('uses the transformed pickup route and lists custom dimensions in front measurements', () => {
    const source = doc(),
      profile = PICKUP_PROFILES[0],
      pos = firstPickupPosition(source, profile.id)!
    source.pickupCavities = [
      {
        id: 'custom',
        profileId: profile.id,
        profileVersion: 1,
        centerYmm: pos,
        ...pickupDefaults(profile),
        angleDeg: 25,
        widthMm: 90,
        lengthMm: 44,
      },
    ]
    const drawing = buildExportDrawing(
      source,
      options(['front'], { includePickups: true, includeMeasurements: true }),
    )
    const pickup = drawing.paths.find((p) => p.role === 'ROUTE_PICKUP')!
    expect(pickup.segments.some((s) => s.type === 'cubicBezier')).toBe(true)
    expect(pickup.name).toContain('custom')
    expect(drawing.measurements.map((r) => r.label)).toEqual(
      expect.arrayContaining(['Width', 'Length', 'Angle', 'Distance to bridge']),
    )
  })
  for (const part of [
    'front',
    'back',
    'neck',
    'fretboard',
    'headstock',
    'pocket',
    'overview',
  ] as ExportPart[])
    it('isolates ' + part, () => {
      const d = buildExportDrawing(doc(), options([part]))
      expect(d.parts.map((p) => p.id)).toEqual([part])
      expect(d.paths.length).toBeGreaterThan(0)
      const svg = svgExport(d)
      expect(svg).toContain('mm"')
      expect(svg).not.toContain('NaN')
      for (const path of d.paths.filter((p) => p.closed))
        for (let i = 0; i < path.segments.length; i++) {
          const a = path.segments[i].to,
            b = path.segments[(i + 1) % path.segments.length].from
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(1e-6)
        }
    })
  it('exports the canonical closed pocket template with an open notch and no mouth reference', () => {
    const source = doc(),
      before = JSON.stringify(source),
      template = pocketTemplateGeometry(source),
      drawing = buildExportDrawing(source, options(['pocket'], { includeReferences: true })),
      route = drawing.parts[0].paths.find((p) => p.role === 'CUT_OUTER')!
    expect(template.cut).not.toBeNull()
    expect(route.closed).toBe(true)
    expect(route.name).toBe('Neck pocket')
    expect(
      drawing.paths.some((p) => p.role === 'ROUTE_NECK_POCKET' || p.role === 'REFERENCE'),
    ).toBe(false)
    expect(route.segments).toHaveLength(template.cut!.segments.length)
    expect(route.segments.map((s) => s.type)).toEqual(template.cut!.segments.map((s) => s.type))
    const rotate = (p: { x: number; y: number }) => ({ x: -p.y, y: p.x }),
      first = rotate(template.cut!.segments[0].from),
      shift = { x: route.segments[0].from.x - first.x, y: route.segments[0].from.y - first.y },
      project = (p: { x: number; y: number }) => {
        const q = rotate(p)
        return { x: q.x + shift.x, y: q.y + shift.y }
      }
    for (let i = 0; i < route.segments.length; i++) {
      const actual = route.segments[i],
        expected = template.cut!.segments[i]
      expect(actual.from).toEqual(project(expected.from))
      expect(actual.to).toEqual(project(expected.to))
      if (actual.type === 'cubicBezier' && expected.type === 'cubicBezier') {
        expect(actual.control1).toEqual(project(expected.control1))
        expect(actual.control2).toEqual(project(expected.control2))
      }
      if (actual.type === 'circularArc' && expected.type === 'circularArc') {
        expect(actual.radiusMm).toBe(expected.radiusMm)
        expect(actual.sweep).toBe(expected.sweep)
      }
    }
    const bottom = template.cut!.segments.find((segment) => segment.role === 'template-bottom')!
    expect(route.segments[template.cut!.segments.indexOf(bottom)]).toMatchObject({
      type: 'line',
      from: project(bottom.from),
      to: project(bottom.to),
    })
    expect(drawing.parts[0].bounds.width).toBeCloseTo(template.bounds!.height, 8)
    expect(drawing.parts[0].bounds.height).toBeCloseTo(template.bounds!.width, 8)
    for (let i = 0; i < route.segments.length; i++)
      expect(route.segments[i].to).toEqual(route.segments[(i + 1) % route.segments.length].from)
    const mouth = template.pocketMouth!
    expect(
      route.segments.some(
        (segment) =>
          segment.from.x === project(mouth[0].from).x &&
          segment.from.y === project(mouth[0].from).y &&
          segment.to.x === project(mouth.at(-1)!.to).x &&
          segment.to.y === project(mouth.at(-1)!.to).y,
      ),
    ).toBe(false)
    expect(JSON.stringify(source)).toBe(before)
  })
  it('keeps the canonical pocket contour straight at radius zero and fails closed without a neck', () => {
    const base = doc(),
      source = deriveNeckDocument(base, {
        kind: 'end',
        end: { ...base.neck!.end, radiusMm: 0, fitAllowanceMm: 1.25 },
      })!
    const template = pocketTemplateGeometry(source),
      drawing = buildExportDrawing(source, options(['pocket'])),
      route = drawing.parts[0].paths.find((p) => p.role === 'CUT_OUTER')!
    expect(template.cut).not.toBeNull()
    expect(route.segments).toHaveLength(template.cut!.segments.length)
    expect(route.segments.filter((s) => s.type === 'circularArc')).toHaveLength(0)
    expect(() => buildExportDrawing(createStarterDocument(), options(['pocket']))).toThrow(
      'No neck has been created.',
    )
    expect(() => buildExportDrawing(manualPocket(), options(['pocket']))).toThrow(
      'No neck has been created.',
    )
  })
  it('fails closed for invalid canonical pocket templates and automatic pocket geometry', () => {
    const source = doc()
    source.body.outline.nodes.find((node) => node.id === 'starter-05')!.x = Number.NaN
    expect(pocketTemplateGeometry(source).cut).toBeNull()
    expect(() => buildExportDrawing(source, options(['pocket']))).toThrow(/body|template|geometry/i)
    const invalidAutomatic = doc()
    invalidAutomatic.neck!.referenceBoundaryNodes.center.x += 0.1
    expect(() => buildExportDrawing(invalidAutomatic, options(['pocket']))).toThrow(
      /fixed centre node|neck pocket/i,
    )
  })
  it('separates pieces without unselected fretboard geometry and keeps headstock holes per piece', () => {
    const d = buildExportDrawing(doc(), options(['front', 'neck', 'headstock']))
    expect(d.parts.map((p) => p.id)).toEqual(['front', 'headstock', 'neck'])
    expect(d.circles).toHaveLength(12)
    expect(
      d.parts.find((p) => p.id === 'neck')!.paths.filter((p) => p.role === 'CUT_OUTER'),
    ).toHaveLength(1)
    expect(d.paths.some((p) => p.role === 'FRET_GUIDE')).toBe(false)
    for (let i = 0; i < d.parts.length; i++)
      for (let j = i + 1; j < d.parts.length; j++) {
        const a = d.parts[i].bounds,
          b = d.parts[j].bounds
        expect(a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY).toBe(true)
      }
  })
  it('uses physical heel rather than fretboard end, and preserves source state', () => {
    const source = doc(),
      before = JSON.stringify(source)
    const d = buildExportDrawing(
      source,
      options(['neck', 'fretboard'], { includeMeasurements: true, measurementUnit: 'both' }),
    )
    expect(d.measurements.find((m) => m.label === 'Neck end allowance')!.value).toBe(10)
    expect(d.measurements.find((m) => m.label === 'Fretboard end allowance')!.value).toBe(16.35)
    expect(d.table!.texts.some((t) => t.text.includes(' in'))).toBe(true)
    expect(JSON.stringify(source)).toBe(before)
  })
  it('has exact cubic and arc bounds instead of a control hull', () => {
    const c: ExportSegment = {
      type: 'cubicBezier',
      from: { x: 0, y: 0 },
      control1: { x: 0, y: 100 },
      control2: { x: 10, y: 100 },
      to: { x: 10, y: 0 },
    }
    expect(segmentBounds(c).maxY).toBeCloseTo(75, 9)
    const a: ExportSegment = {
      type: 'circularArc',
      from: { x: 1, y: 0 },
      to: { x: -1, y: 0 },
      center: { x: 0, y: 0 },
      radiusMm: 1,
      sweep: 1,
    }
    expect(segmentBounds(a).maxY).toBeCloseTo(1, 9)
    for (const c of arcCubics(a))
      for (let i = 0; i <= 20; i++) {
        const p = at(c, i / 20)
        expect(Math.abs(Math.hypot(p.x, p.y) - 1)).toBeLessThan(0.001)
      }
  })
  it('retains analytic pickup arcs for every profile', () => {
    for (const p of PICKUP_PROFILES) {
      expect(p.segments.some((s) => s.type === 'circularArc')).toBe(true)
      for (const s of p.segments)
        if (s.type === 'circularArc') {
          const a = arcData(s)
          expect(Math.hypot(s.from.x - a.center.x, s.from.y - a.center.y)).toBeCloseTo(
            s.radiusMm,
            6,
          )
        }
    }
  })
  it('blocks only selected invalid cavity and leaves valid isolated parts exportable', () => {
    const source = doc()
    source.body.rearElectronicsCavity!.centerXmm = 10000
    expect(() => buildExportDrawing(source, options(['back']))).toThrow(/cavity|edge|body/i)
    expect(() => buildExportDrawing(source, options(['fretboard']))).not.toThrow()
    expect(() =>
      buildExportDrawing(source, options(['back'], { includeElectronics: false })),
    ).not.toThrow()
  })
  it('exports the replacement rear cavity as the existing paired manufacturing routes', () => {
    const drawing = buildExportDrawing(doc(), options(['back']))
    const routes = drawing.parts
      .find((part) => part.id === 'back')!
      .paths.filter((path) => path.role === 'ROUTE_REAR_RECESS' || path.role === 'ROUTE_REAR_INNER')
    expect(routes.map((path) => path.role)).toEqual(['ROUTE_REAR_RECESS', 'ROUTE_REAR_INNER'])
    expect(routes.map((path) => path.segments.length)).toEqual([8, 18])
    expect(routes.every((path) => path.closed)).toBe(true)
  })
  it('rejects empty and unavailable parts instead of silently omitting them', () => {
    expect(() => buildExportDrawing(doc(), options([]))).toThrow()
    expect(() => buildExportDrawing(createStarterDocument(), options(['neck']))).toThrow()
  })
  it('fits a single headstock and a table without changing scale, tiled table appears once', () => {
    const small = buildExportDrawing(doc(), options(['headstock']))
    expect(small.bounds.width).toBeLessThan(300)
    expect(small.bounds.height).toBeLessThan(150)
    const d = buildExportDrawing(
      doc(),
      options(['front', 'back', 'neck', 'fretboard', 'headstock', 'pocket'], {
        includeMeasurements: true,
        includeNames: true,
      }),
    )
    for (const paper of ['a4', 'a3'] as const) {
      const p = planPdfPages(d, paper)
      expect(p.pages.length).toBeGreaterThan(1)
      expect(p.pages.filter((t) => t.table)).toHaveLength(1)
      for (const t of p.pages) expect(t.source.width).toBeCloseTo(t.width - 20, 7)
    }
  })
  it('writes readable dimensioned artifacts with genuine PDF millimetres', async () => {
    const source = doc(),
      profile = PICKUP_PROFILES[0],
      pos = firstPickupPosition(source, profile.id)
    if (pos !== null)
      source.pickupCavities = [
        {
          id: 'export-pickup',
          profileId: profile.id,
          profileVersion: profile.version,
          centerYmm: pos,
          ...pickupDefaults(profile),
        },
      ]
    const variants: [string, ExportOptions][] = [
      [
        'all',
        options(['front', 'back', 'neck', 'fretboard', 'headstock', 'pocket', 'overview'], {
          includeMeasurements: true,
          includeReferences: true,
          includeFretGuides: true,
          includeNames: true,
          includeCalibration: true,
        }),
      ],
      ['headstock', options(['headstock'])],
      ['neck-body', options(['neck', 'front'])],
      [
        'fretboard-headstock',
        options(['fretboard', 'headstock'], { includeMeasurements: true, measurementUnit: 'both' }),
      ],
    ]
    mkdirSync('tmp/export-v1/artifacts', { recursive: true })
    for (const [name, o] of variants) {
      const d = buildExportDrawing(source, o)
      writeFileSync('tmp/export-v1/artifacts/' + name + '.svg', svgExport(d))
      writeFileSync('tmp/export-v1/artifacts/' + name + '.dxf', dxfExport(d))
      const data = await pdfExport(d)
      writeFileSync('tmp/export-v1/artifacts/' + name + '.pdf', data)
      const pdf = await PDFDocument.load(data),
        size = pdf.getPage(0).getSize()
      expect((size.width * 25.4) / 72).toBeCloseTo(d.bounds.width + 20, 7)
      expect((size.height * 25.4) / 72).toBeCloseTo(d.bounds.height + 20, 7)
      if (name === 'all') {
        writeFileSync('tmp/export-v1/artifacts/all-a4.pdf', await pdfExport(d, 'a4'))
        writeFileSync('tmp/export-v1/artifacts/all-a3.pdf', await pdfExport(d, 'a3'))
        writeFileSync('tmp/export-v1/artifacts/model.json', JSON.stringify(d))
      }
    }
  }, 30000)
})

describe('export neck variants', () => {
  for (const strings of [6, 7, 8])
    for (const multiscale of [false, true])
      it(
        'exports ' + strings + ' strings ' + (multiscale ? 'multiscale' : 'single scale'),
        async () => {
          const source = doc()
          const params = {
            ...source.neck!.params,
            strings,
            scaleBass: multiscale ? 660.4 : 647.7,
            ...(strings === 6
              ? {}
              : { stringSpanNut: (strings - 1) * 7, stringSpanBridge: (strings - 1) * 10.5 }),
          }
          const changed = deriveNeckDocument(source, { kind: 'params', params })!
          const drawing = buildExportDrawing(
            changed,
            options(['neck', 'fretboard', 'headstock', 'pocket'], {
              includeMeasurements: true,
              includeFretGuides: true,
            }),
          )
          expect(drawing.circles).toHaveLength(strings * 2)
          expect(
            drawing.measurements.filter((m) => m.label.startsWith('Scale length')),
          ).toHaveLength(multiscale ? 2 : 1)
          const pdf = await PDFDocument.load(await pdfExport(drawing))
          expect(pdf.getPageCount()).toBe(1)
          expect(dxfExport(drawing)).toContain('SPLINE')
          for (const p of drawing.paths.filter((p) => p.closed))
            for (let i = 0; i < p.segments.length; i++) {
              const a = p.segments[i].to,
                b = p.segments[(i + 1) % p.segments.length].from
              expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(1e-6)
            }
        },
      )
  for (const id of ['three-three-2', 'three-three-3'] as const)
    it('exports ' + id + ' without extra seam', () => {
      const source = doc()
      source.neck!.headstock.activeTemplateId = id
      const d = buildExportDrawing(source, options(['neck', 'headstock']))
      expect(d.circles).toHaveLength(12)
      expect(d.parts[1].paths).toHaveLength(1)
      expect(d.paths.every((p) => p.closed)).toBe(true)
    })
  it('reflects all seven parts before layout, including arc direction and readable handedness data', () => {
    const source = doc()
    const ids: ExportPart[] = [
      'front',
      'back',
      'neck',
      'fretboard',
      'headstock',
      'pocket',
      'overview',
    ]
    const right = buildExportDrawing(source, options(ids, { includeMeasurements: true }))
    source.handedness = 'left'
    const left = buildExportDrawing(source, options(ids, { includeMeasurements: true }))
    expect(left.parts.map((p) => p.id)).toEqual(right.parts.map((p) => p.id))
    for (let i = 0; i < left.parts.length; i++) {
      expect(left.parts[i].bounds.width).toBeCloseTo(right.parts[i].bounds.width, 7)
      expect(left.parts[i].bounds.height).toBeCloseTo(right.parts[i].bounds.height, 7)
    }
    const rightArcs = right.paths
      .filter((p) => p.segments.some((s) => s.type === 'circularArc'))
      .flatMap((p) => p.segments)
      .filter((s) => s.type === 'circularArc')
    const leftArcs = left.paths
      .filter((p) => p.segments.some((s) => s.type === 'circularArc'))
      .flatMap((p) => p.segments)
      .filter((s) => s.type === 'circularArc')
    expect(leftArcs).toHaveLength(rightArcs.length)
    for (let i = 0; i < leftArcs.length; i++)
      expect(leftArcs[i].sweep).toBe(rightArcs[i].sweep ? 0 : 1)
    expect(left.table?.texts.map((t) => t.text)).toContain('Left-handed')
    expect(svgExport(left)).toContain('Left-handed')
  })
})

describe('optional dashed centerlines', () => {
  it('adds independent centerlines and respects the two physical ends', async () => {
    const source = doc(),
      ids: ExportPart[] = ['front', 'back', 'neck', 'fretboard', 'pocket', 'overview']
    const drawing = buildExportDrawing(source, options(ids, { includeCenterlines: true }))
    expect(drawing.paths.filter((p) => p.role === 'REFERENCE_CENTERLINE')).toHaveLength(6)
    const line = (id: ExportPart) =>
      drawing.parts.find((p) => p.id === id)!.paths.find((p) => p.role === 'REFERENCE_CENTERLINE')!
        .segments[0]
    const neck = line('neck'),
      board = line('fretboard')
    expect(neck.from.y).toBeCloseTo(neck.to.y, 8)
    expect(board.from.y).toBeCloseTo(board.to.y, 8)
    expect(Math.abs(board.to.x - board.from.x) - Math.abs(neck.to.x - neck.from.x)).toBeCloseTo(
      6.35,
      8,
    )
    const off = buildExportDrawing(
      source,
      options(ids, { includeCenterlines: false, includeReferences: true }),
    )
    expect(off.paths.some((p) => p.role === 'REFERENCE_CENTERLINE')).toBe(false)
    expect(off.paths.some((p) => p.role === 'REFERENCE')).toBe(true)
    const svg = svgExport(drawing),
      dxf = dxfExport(drawing)
    expect(svg.match(/stroke-dasharray="6 3"/g)).toHaveLength(6)
    expect(dxf).toContain('GTR_CENTERLINE')
    expect(dxfExport(off)).not.toContain('REFERENCE_CENTERLINE')
    expect(svgExport(off)).not.toContain('stroke-dasharray')
    mkdirSync('tmp/export-centerlines', { recursive: true })
    writeFileSync('tmp/export-centerlines/on.svg', svg)
    writeFileSync('tmp/export-centerlines/on.dxf', dxf)
    writeFileSync('tmp/export-centerlines/on.pdf', await pdfExport(drawing))
    writeFileSync('tmp/export-centerlines/off.pdf', await pdfExport(off))
  })
})
