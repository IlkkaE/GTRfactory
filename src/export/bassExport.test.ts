import { mkdirSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { useAppStore } from '../store'
import { DEFAULT_EXPORT_OPTIONS, type ExportOptions } from './model'
import { buildExportDrawing } from './geometry'
import { dxfExport } from './dxf'
import { pdfExport } from './pdf'
import { svgExport } from './svg'
import type { BassTemplateId } from '../headstock/bass'

const state = () => useAppStore.getState()
const options: ExportOptions = {
  ...DEFAULT_EXPORT_OPTIONS,
  parts: ['neck', 'fretboard', 'headstock'],
  includeMeasurements: true,
  includeReferences: false,
  includeFretGuides: false,
  includeNames: false,
  includeCalibration: false,
  includeCenterlines: true,
  measurementUnit: 'mm',
}

function bassDocument(id: BassTemplateId) {
  state().newProject()
  state().setView('front')
  state().setEditingTarget('headstock')
  state().switchHeadstockTemplate(id)
  expect(state().message).toBeNull()
  return structuredClone(state().document)
}

describe('bass manufacturing exports', () => {
  it('exports bass-4-inline with row measurements and nominal GB2 bores', async () => {
    const id = 'bass-4-inline'
    const strings = 4
    const drawing = buildExportDrawing(bassDocument(id), options)
    const row = drawing.measurements.filter((m) => m.group === 'Headstock')
    expect(row.find((m) => m.label === 'Tuner row angle')).toMatchObject({ unit: 'deg' })
    expect(row.find((m) => m.label === 'Tuner pitch minimum')!.value).toBeGreaterThanOrEqual(
      47.60075 - 1e-7,
    )
    expect(row.find((m) => m.label === 'Tuner pitch maximum')!.value).toBeGreaterThanOrEqual(
      47.60075 - 1e-7,
    )
    expect(row.find((m) => m.label === 'Physical width at 12th fret')!.value).toBeGreaterThan(0)
    expect(row.find((m) => m.label === 'Tuner hole diameter')!.value).toBeCloseTo(17.6, 9)
    const svg = svgExport(drawing)
    expect((svg.match(/<circle /g) ?? []).length).toBe(strings * 2)
    expect(svg).toContain('Tuner row angle')
    expect(svg).toContain('°')
    expect(svg).not.toContain('Tuner row angle:')
    const dxf = dxfExport(drawing)
    expect((dxf.match(/\r?\nCIRCLE\r?\n/g) ?? []).length).toBe(strings * 2)
    const directory = 'tmp/bass-headstocks/artifacts'
    mkdirSync(directory, { recursive: true })
    const stem = 'bass4'
    writeFileSync(`${directory}/${stem}.svg`, svg)
    writeFileSync(`${directory}/${stem}.dxf`, dxf)
    writeFileSync(`${directory}/${stem}.pdf`, await pdfExport(drawing))
    writeFileSync(`${directory}/${stem}.json`, JSON.stringify(drawing, null, 2))
  })
})
