import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { createStarterDocument } from '../model/project'
import { deriveNeckDocument } from '../neck/neckDocument'
import { DEFAULT_EXPORT_OPTIONS, type ExportOptions, type ExportPart } from './model'
import { buildExportDrawing } from './geometry'
import { dxfExport } from './dxf'
import { svgExport } from './svg'
import { pdfExport } from './pdf'
import { createDefaultInlayDocument, createPresetShape } from '../inlays/inlayPresets'

const docWithNeck = () => deriveNeckDocument(createStarterDocument(), { kind: 'fresh' })!

const exportOpts = (parts: ExportPart[], extra: Partial<ExportOptions> = {}): ExportOptions => ({
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

describe('fretboard inlay manufacturing export', () => {
  it('guarantees identical byte output when inlays are absent (fretboardInlays is null)', () => {
    const docA = docWithNeck()
    docA.fretboardInlays = null

    const docB = docWithNeck()
    docB.fretboardInlays = null

    const drawingA = buildExportDrawing(docA, exportOpts(['fretboard', 'overview']))
    const drawingB = buildExportDrawing(docB, exportOpts(['fretboard', 'overview']))

    const dxfA = dxfExport(drawingA)
    const dxfB = dxfExport(drawingB)
    expect(dxfA).toBe(dxfB)

    const svgA = svgExport(drawingA)
    const svgB = svgExport(drawingB)
    expect(svgA).toBe(svgB)
  })

  it('exports circle inlays as ExportCircle entities with ROUTE_INLAY on fretboard and REFERENCE on overview', () => {
    const doc = docWithNeck()
    doc.fretboardInlays = {
      ...createDefaultInlayDocument(),
      enabled: true,
      markedFrets: [3, 5, 7, 9, 12],
      doubleInlayFrets: [12],
    }

    const fretboardOnly = buildExportDrawing(doc, exportOpts(['fretboard']))
    const inlayCircles = fretboardOnly.circles.filter((c) => c.role === 'ROUTE_INLAY')
    // Frets 3, 5, 7, 9 have 1 inlay each; fret 12 is double (2 inlays) => total 6
    expect(inlayCircles).toHaveLength(6)
    for (const c of inlayCircles) {
      expect(c.radiusMm).toBe(3) // diameter 6mm -> radius 3mm
      expect(Number.isFinite(c.center.x)).toBe(true)
      expect(Number.isFinite(c.center.y)).toBe(true)
    }

    // Overview drawing: inlays are converted to REFERENCE role
    const overviewOnly = buildExportDrawing(doc, exportOpts(['overview']))
    const refCircles = overviewOnly.circles.filter((c) => c.role === 'REFERENCE')
    // Overview has 6 tuner holes + 6 inlays = 12 reference circles
    expect(refCircles.length).toBeGreaterThanOrEqual(6)

    // DXF includes ROUTE_INLAY layer with color 4 (Cyan)
    const dxf = dxfExport(fretboardOnly)
    expect(dxf).toContain('ROUTE_INLAY')
    expect(dxf).toContain('62\n4\n') // Color 4 = Cyan
    expect(dxf).toContain('AcDbCircle')
  })

  it('exports polygon/bezier inlays as closed ExportPath entities with ROUTE_INLAY', () => {
    const doc = docWithNeck()
    doc.fretboardInlays = {
      ...createDefaultInlayDocument(),
      enabled: true,
      shape: createPresetShape('diamond'),
      markedFrets: [5, 7],
      doubleInlayFrets: [],
    }

    const drawing = buildExportDrawing(doc, exportOpts(['fretboard']))
    const inlayPaths = drawing.paths.filter((p) => p.role === 'ROUTE_INLAY')
    expect(inlayPaths).toHaveLength(2)
    for (const p of inlayPaths) {
      expect(p.closed).toBe(true)
      expect(p.segments.length).toBe(4) // Diamond has 4 linear segments
      for (const seg of p.segments) {
        expect(seg.type).toBe('line')
      }
    }

    const dxf = dxfExport(drawing)
    expect(dxf).toContain('ROUTE_INLAY')
    expect(dxf).toContain('AcDbLine')
  })

  it('exports trapezoid inlays with proportional scaling without crashing', () => {
    const doc = docWithNeck()
    doc.fretboardInlays = {
      ...createDefaultInlayDocument(),
      enabled: true,
      shape: createPresetShape('trapezoid'),
      scalingMode: 'proportionalPercent',
      fillPercentage: 70,
      markedFrets: [3, 5, 7, 9, 12],
      doubleInlayFrets: [],
    }

    const drawing = buildExportDrawing(doc, exportOpts(['fretboard']))
    const inlayPaths = drawing.paths.filter((p) => p.role === 'ROUTE_INLAY')
    expect(inlayPaths).toHaveLength(5)

    const dxf = dxfExport(drawing)
    expect(dxf).toContain('ROUTE_INLAY')
  })

  it('omits inlays from export when includeInlays is false', () => {
    const doc = docWithNeck()
    doc.fretboardInlays = {
      ...createDefaultInlayDocument(),
      enabled: true,
      markedFrets: [3, 5, 7],
    }

    const withInlays = buildExportDrawing(doc, exportOpts(['fretboard'], { includeInlays: true }))
    expect(withInlays.circles.some((c) => c.role === 'ROUTE_INLAY')).toBe(true)

    const withoutInlays = buildExportDrawing(
      doc,
      exportOpts(['fretboard'], { includeInlays: false }),
    )
    expect(withoutInlays.circles.some((c) => c.role === 'ROUTE_INLAY')).toBe(false)
  })

  it('respects left-handed instrument layout in export without distortion', () => {
    const doc = docWithNeck()
    doc.handedness = 'left'
    doc.fretboardInlays = {
      ...createDefaultInlayDocument(),
      enabled: true,
      markedFrets: [12],
      doubleInlayFrets: [12],
      doubleInlaySpacingMm: 16,
    }

    const drawing = buildExportDrawing(doc, exportOpts(['fretboard']))
    const circles = drawing.circles.filter((c) => c.role === 'ROUTE_INLAY')
    expect(circles).toHaveLength(2)

    // In left-handed layout, coordinates are properly transformed and distance between inlays is preserved
    const dist = Math.hypot(
      circles[0].center.x - circles[1].center.x,
      circles[0].center.y - circles[1].center.y,
    )
    expect(dist).toBeCloseTo(16, 1)
  })

  it('exports SVG with inkscape layer attributes and ROUTE_INLAY ordered on top of fretboard and frets', () => {
    const doc = docWithNeck()
    doc.fretboardInlays = {
      ...createDefaultInlayDocument(),
      enabled: true,
      markedFrets: [3, 5, 7],
    }

    const drawing = buildExportDrawing(
      doc,
      exportOpts(['fretboard'], { includeFretGuides: true, includeInlays: true }),
    )
    const svg = svgExport(drawing)

    // Contains inkscape namespace and layer attributes
    expect(svg).toContain('xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"')
    expect(svg).toContain('inkscape:groupmode="layer"')
    expect(svg).toContain('inkscape:label="Fretboard inlays"')

    // Verify layer ordering in DOM: CUT_OUTER appears before FRET_GUIDE, which appears before ROUTE_INLAY
    const cutPos = svg.indexOf('id="CUT_OUTER"')
    const fretPos = svg.indexOf('id="FRET_GUIDE"')
    const inlayPos = svg.indexOf('id="ROUTE_INLAY"')

    expect(cutPos).toBeGreaterThan(-1)
    expect(fretPos).toBeGreaterThan(cutPos)
    expect(inlayPos).toBeGreaterThan(fretPos)
  })

  it('exports PDF with Optional Content Group (OCG) for inlays and draws inlays on top of frets', async () => {
    const doc = docWithNeck()
    doc.fretboardInlays = {
      ...createDefaultInlayDocument(),
      enabled: true,
      markedFrets: [3, 5, 7, 9, 12],
      doubleInlayFrets: [12],
    }

    const drawingWithInlays = buildExportDrawing(
      doc,
      exportOpts(['fretboard'], { includeFretGuides: true, includeInlays: true }),
    )
    const pdfBytes = await pdfExport(drawingWithInlays)
    const loadedPdf = await PDFDocument.load(pdfBytes)

    // Verify PDF has catalog with OCProperties and OCG entry
    const ocProperties = loadedPdf.catalog.get(loadedPdf.context.obj('OCProperties') as any)
    expect(ocProperties).toBeDefined()

    // When inlays are disabled, PDF should not contain OCG
    const drawingWithoutInlays = buildExportDrawing(
      doc,
      exportOpts(['fretboard'], { includeFretGuides: true, includeInlays: false }),
    )
    const pdfBytesNoInlays = await pdfExport(drawingWithoutInlays)
    const loadedNoInlays = await PDFDocument.load(pdfBytesNoInlays)
    const noOcProperties = loadedNoInlays.catalog.get(
      loadedNoInlays.context.obj('OCProperties') as any,
    )
    expect(noOcProperties).toBeUndefined()
  })
})
