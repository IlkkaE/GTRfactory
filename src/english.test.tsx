import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PDFDocument, PDFRawStream, decodePDFRawStream } from 'pdf-lib'
import { App } from './App'
import { createStarterDocument } from './model/project'
import { parseProject, serializeProject } from './file/projectFile'
import { deriveNeckDocument } from './neck/neckDocument'
import { buildExportDrawing } from './export/geometry'
import { DEFAULT_EXPORT_OPTIONS, PART_NAMES } from './export/model'
import { pdfExport } from './export/pdf'
import { HEADSTOCK_TEMPLATE_DEFINITIONS } from './headstock/variants'
import { parseFretFactoryUrl } from './neck/importFretFactory'

describe('English interface and unchanged user content', () => {
  it('declares English and renders English navigation and accessible labels', () => {
    expect(readFileSync(new URL('../index.html', import.meta.url), 'utf8')).toContain('lang="en"')
    const html = renderToStaticMarkup(<App />)
    for (const text of [
      'Project name',
      'Undo',
      'Redo',
      'Front',
      'Back',
      'File',
      'Export / print',
    ]) {
      expect(html).toContain(text)
    }
    expect(html).not.toMatch(/Tiedosto|Kumoa|Kaulatasku|Projektin nimi/)
  })

  it('starts unnamed but preserves a saved Finnish project name and all geometry', () => {
    const document = createStarterDocument()
    expect(document.name).toBe('')
    document.name = 'Äänen ystävä — oma kitara'
    const loaded = parseProject(serializeProject(document))
    expect(loaded).toEqual(document)
    expect(loaded.name).toBe('Äänen ystävä — oma kitara')
    expect(loaded.version).toBe(14)
    expect(loaded.body.rearElectronicsCavity?.profileId).toBe('potero-v1')
  })

  it('reports invalid and unsupported projects in English', () => {
    expect(() =>
      parseFretFactoryUrl('#state=' + encodeURIComponent(JSON.stringify({ frets: 22 }))),
    ).toThrow('The FretFactory URL is missing a valid strings value.')
    expect(() => parseProject('{')).toThrow('not valid GTRfactory JSON')
    const document = { ...createStarterDocument(), version: 8 }
    expect(() => parseProject(JSON.stringify(document))).toThrow(
      'supported versions are 10, 11, 12, 13 and 14',
    )
  })

  it('translates template display names without changing canonical IDs', () => {
    expect(HEADSTOCK_TEMPLATE_DEFINITIONS.map((template) => template.id)).toEqual([
      'inline',
      'three-three-2',
      'three-three-3',
      'bass-4-inline',
      'headless',
    ])
    expect(HEADSTOCK_TEMPLATE_DEFINITIONS.map((template) => template.name)).toEqual([
      'Inline',
      '3+3 — Headstock 2',
      '3+3 — Headstock 3',
      'Bass — 4 strings',
      'Headless',
    ])
    expect(PART_NAMES.front).toBe('Body - front')
    expect(PART_NAMES.headstock).toBe('Headstock')
  })

  it('writes English labels into PDF content while retaining manufacturing roles', async () => {
    const document = deriveNeckDocument(createStarterDocument(), { kind: 'fresh' })!
    const drawing = buildExportDrawing(document, {
      ...DEFAULT_EXPORT_OPTIONS,
      parts: ['headstock'],
    })
    expect(drawing.paths.some((path) => path.role === 'CUT_OUTER')).toBe(true)
    expect(drawing.circles.filter((circle) => circle.role === 'DRILL_TUNER')).toHaveLength(6)
    const pdf = await PDFDocument.load(await pdfExport(drawing))
    const labels: string[] = []
    for (const [, object] of pdf.context.enumerateIndirectObjects()) {
      if (!(object instanceof PDFRawStream)) continue
      const stream = Buffer.from(decodePDFRawStream(object).decode()).toString('latin1')
      for (const match of stream.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
        labels.push(Buffer.from(match[1], 'hex').toString('latin1'))
      }
    }
    expect(labels).toContain('Headstock')
    expect(labels).toContain('Guitar dimensions')
    expect(labels).toContain('Tuner hole diameter')
    expect(labels.join(' ')).not.toMatch(/Lapa|Kitaran mitat|Viritinrei/)
  })

  it('renders bold guitar name topic on top center of PDF when project name is provided', async () => {
    const document = deriveNeckDocument(createStarterDocument(), { kind: 'fresh' })!
    document.name = 'Thunderbird Custom'
    const drawing = buildExportDrawing(document, {
      ...DEFAULT_EXPORT_OPTIONS,
      parts: ['headstock'],
    })
    const pdf = await PDFDocument.load(await pdfExport(drawing))
    expect(pdf.getTitle()).toBe('Thunderbird Custom')

    let foundBoldFont = false
    let foundTitle = false
    for (const [, object] of pdf.context.enumerateIndirectObjects()) {
      if (!(object instanceof PDFRawStream)) continue
      const stream = Buffer.from(decodePDFRawStream(object).decode()).toString('latin1')
      if (stream.includes('Helvetica-Bold')) foundBoldFont = true
      for (const match of stream.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
        if (Buffer.from(match[1], 'hex').toString('latin1') === 'Thunderbird Custom') {
          foundTitle = true
        }
      }
    }
    expect(foundBoldFont).toBe(true)
    expect(foundTitle).toBe(true)
  })

  it('omits guitar name topic when project name is empty or only whitespace', async () => {
    const document = deriveNeckDocument(createStarterDocument(), { kind: 'fresh' })!
    document.name = '   '
    const drawing = buildExportDrawing(document, {
      ...DEFAULT_EXPORT_OPTIONS,
      parts: ['headstock'],
    })
    const pdf = await PDFDocument.load(await pdfExport(drawing))

    let foundBoldFont = false
    for (const [, object] of pdf.context.enumerateIndirectObjects()) {
      if (!(object instanceof PDFRawStream)) continue
      const stream = Buffer.from(decodePDFRawStream(object).decode()).toString('latin1')
      if (stream.includes('Helvetica-Bold')) foundBoldFont = true
    }
    expect(foundBoldFont).toBe(false)
  })
})
