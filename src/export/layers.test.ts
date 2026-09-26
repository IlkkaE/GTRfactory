import { describe, it, expect } from 'vitest'
import { PDFDocument, PDFDict, PDFName, PDFString, PDFRawStream, decodePDFRawStream } from 'pdf-lib'
import { createStarterDocument } from '../model/project'
import { deriveNeckDocument } from '../neck/neckDocument'
import { DEFAULT_EXPORT_OPTIONS, type ExportOptions } from './model'
import { buildExportDrawing } from './geometry'
import { dxfExport } from './dxf'
import { svgExport } from './svg'
import { pdfExport } from './pdf'

const starterDoc = () => deriveNeckDocument(createStarterDocument(), { kind: 'fresh' })!

describe('Per-part export layering across SVG, DXF, and PDF', () => {
  const allPartsOpts: ExportOptions = {
    ...DEFAULT_EXPORT_OPTIONS,
    includeCenterlines: true,
    includeReferences: true,
    includeFretGuides: true,
    includeMeasurements: true,
    includeNames: true,
    includeCalibration: true,
    parts: ['front', 'back', 'neck', 'fretboard', 'headstock', 'pocket'],
  }

  it('exports every guitar part onto its own named layer in SVG', () => {
    const doc = starterDoc()
    const drawing = buildExportDrawing(doc, allPartsOpts)
    const svg = svgExport(drawing)

    expect(svg).toContain('xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"')

    // Jokaisen piirtyvän osan nimen tulee esiintyä omana tasonaan
    for (const part of drawing.parts) {
      expect(svg).toContain(`id="part-${part.id}"`)
      expect(svg).toContain(`inkscape:label="${part.name}"`)
    }

    // Lisäksi mittataulukolla ja kalibroinnilla on omat tasonsa
    expect(svg).toContain('inkscape:label="Dimensions"')
    expect(svg).toContain('inkscape:label="Calibration reference"')
  })

  it('exports every guitar part onto its own named layers in DXF', () => {
    const doc = starterDoc()
    const drawing = buildExportDrawing(doc, allPartsOpts)
    const dxf = dxfExport(drawing)

    // Jokaisen piirtyvän osan nimen tulee esiintyä osana DXF-tasonimeä
    for (const part of drawing.parts) {
      const partPrefix = part.name.replace(/[<>/\":;?*|=]/g, '').trim()
      expect(dxf).toContain(`${partPrefix} - `)
    }

    // Tarkistetaan esimerkkiosan toolpath-tasot
    expect(dxf).toContain('Body - front - CUT_OUTER')
    expect(dxf).toContain('Fretboard - CUT_OUTER')
    expect(dxf).toContain('Dimensions - REFERENCE_DIMENSIONS')
    expect(dxf).toContain('Calibration - REFERENCE')
  })

  it('exports every guitar part onto its own Optional Content Group (OCG) layer in PDF', async () => {
    const doc = starterDoc()
    const drawing = buildExportDrawing(doc, allPartsOpts)
    const pdfBytes = await pdfExport(drawing)
    const loadedPdf = await PDFDocument.load(pdfBytes)

    const ocgNames: string[] = []
    for (const [, obj] of loadedPdf.context.enumerateIndirectObjects()) {
      if (obj instanceof PDFDict && obj.get(PDFName.of('Type'))?.toString() === '/OCG') {
        const nameObj = obj.get(PDFName.of('Name'))
        if (nameObj instanceof PDFString) ocgNames.push(nameObj.asString())
      }
    }

    // Jokaisen piirtyvän osan nimen tulee löytyä PDF:n OCG-tasoista
    for (const part of drawing.parts) {
      expect(ocgNames).toContain(part.name)
    }

    // Mittataulukko ja kalibrointi
    expect(ocgNames).toContain('Dimensions')
    expect(ocgNames).toContain('Calibration reference')

    // Tekninen kehys ja nimiö
    expect(ocgNames).toContain('Technical frame & title block')
  })

  it('includes technical drawing frame, title block, and 1:1 verification scale in PDF', async () => {
    const doc = starterDoc()
    doc.name = 'Pro Custom 2026'
    const drawing = buildExportDrawing(doc, allPartsOpts)
    const pdfBytes = await pdfExport(drawing, 'a3')
    const loadedPdf = await PDFDocument.load(pdfBytes)

    const textChunks: string[] = []
    for (const [, object] of loadedPdf.context.enumerateIndirectObjects()) {
      if (!(object instanceof PDFRawStream)) continue
      const stream = Buffer.from(decodePDFRawStream(object).decode()).toString('latin1')
      for (const match of stream.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
        textChunks.push(Buffer.from(match[1], 'hex').toString('latin1'))
      }
      for (const match of stream.matchAll(/\(([^)]+)\)\s*Tj/g)) {
        textChunks.push(match[1])
      }
    }
    const combined = textChunks.join(' ')

    // Nimiö ja tekniset tiedot
    expect(combined).toContain('SCALE: 1:1 (100 %)')
    expect(combined).toContain('UNITS: mm')
    expect(combined).toContain('GTRfactory CAD/CAM')
    expect(combined).toContain('PROJECT: Pro Custom 2026')

    // Tarkistusviivain
    expect(combined).toContain('VERIFICATION SCALE (1:1 ACCURACY CHECK)')
  })
})
