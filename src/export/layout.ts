import type {
  ExportDrawing,
  PartDrawing,
  Measurement,
  ExportOptions,
  ExportText,
  ExportPath,
  MeasurementBox,
} from './model'
import { boundsOf, mapSegment, rect, union } from './math'
export function formatMeasurement(m: Measurement, unit: ExportOptions['measurementUnit']) {
  if (m.text !== undefined) return m.text
  if (m.count) return String(m.value)
  if (m.unit === 'deg') return m.value.toFixed(3) + '°'
  const mm = m.value.toFixed(1) + ' mm',
    inch = (m.value / 25.4).toFixed(3) + ' in'
  return unit === 'mm' ? mm : unit === 'in' ? inch : mm + ' / ' + inch
}
export function textBounds(t: ExportText) {
  return rect(t.x, t.y - t.size, t.x + t.text.length * t.size * 0.6, t.y + t.size * 0.25)
}
export function tablePath(table: MeasurementBox): ExportPath {
  const b = table.bounds,
    ps = [
      { x: b.minX, y: b.minY },
      { x: b.maxX, y: b.minY },
      { x: b.maxX, y: b.maxY },
      { x: b.minX, y: b.maxY },
    ]
  return {
    role: 'REFERENCE_DIMENSIONS',
    closed: true,
    segments: ps.map((p, i) => ({ type: 'line', from: p, to: ps[(i + 1) % 4] })),
  }
}
export function layoutDrawing(
  name: string,
  raw: PartDrawing[],
  measurements: Measurement[],
  o: ExportOptions,
  handedness: 'right' | 'left' = 'right',
): ExportDrawing {
  const parts: PartDrawing[] = [],
    texts: ExportText[] = []
  let y = 0
  const rows = [['overview'], ['front', 'back', 'pocket', 'headstock'], ['fretboard'], ['neck']]
  for (const row of rows) {
    let x = 0,
      rowHeight = 0
    for (const id of row) {
      const part = raw.find((p) => p.id === id)
      if (!part) continue
      const rotate = (p: { x: number; y: number }) =>
        handedness === 'left' ? { x: p.y, y: -p.x } : { x: -p.y, y: p.x }
      const rotatedPaths = part.paths.map((p) => ({
        ...p,
        segments: p.segments.map((s) => mapSegment(s, rotate)),
      }))
      const rotatedCircles = part.circles.map((c) => ({ ...c, center: rotate(c.center) }))
      const b = boundsOf(rotatedPaths, rotatedCircles),
        dy = y + (o.includeNames ? 7 : 0)
      const move = (p: { x: number; y: number }) => ({ x: p.x - b.minX + x, y: p.y - b.minY + dy })
      const paths = rotatedPaths.map((p) => ({
        ...p,
        segments: p.segments.map((s) => mapSegment(s, move)),
      }))
      const circles = rotatedCircles.map((c) => ({ ...c, center: move(c.center) }))
      const bounds = boundsOf(paths, circles)
      parts.push({ ...part, paths, circles, bounds })
      if (o.includeNames) texts.push({ x, y: y + 3, text: part.name, size: 3, role: 'REFERENCE' })
      x += Math.max(b.width, o.includeNames ? part.name.length * 1.8 : 0) + 20
      rowHeight = Math.max(rowHeight, b.height + (o.includeNames ? 7 : 0))
    }
    if (x) y += rowHeight + 20
  }
  const paths = parts.flatMap((p) => p.paths),
    circles = parts.flatMap((p) => p.circles)
  if (o.includeCalibration) {
    paths.push({
      role: 'REFERENCE',
      segments: [
        { type: 'line', from: { x: 0, y: y + 5 }, to: { x: 100, y: y + 5 } },
        { type: 'line', from: { x: 0, y: y + 3 }, to: { x: 0, y: y + 7 } },
        { type: 'line', from: { x: 100, y: y + 3 }, to: { x: 100, y: y + 7 } },
      ],
    })
    texts.push({ x: 0, y: y + 1, text: '100 mm calibration reference', size: 3, role: 'REFERENCE' })
  }
  const geometryBounds = union([boundsOf(paths, circles), ...texts.map(textBounds)])
  let table: MeasurementBox | null = null
  if (o.includeMeasurements && measurements.length) {
    const lines: Array<[string, string]> = [['Guitar dimensions', '']]
    let group = ''
    for (const m of measurements) {
      if (m.group !== group) {
        group = m.group
        lines.push([group, ''])
      }
      lines.push([m.label, formatMeasurement(m, o.measurementUnit)])
    }
    const charWidth = 1.62,
      size = 2.7,
      width = Math.max(105, ...lines.map(([l, v]) => (l.length + v.length + 4) * charWidth + 10)),
      height = lines.length * 5 + 10
    const x = geometryBounds.maxX + 15,
      y = geometryBounds.minY
    const tableTexts: ExportText[] = []
    for (let i = 0; i < lines.length; i++) {
      const [l, v] = lines[i]
      tableTexts.push({ x: x + 5, y: y + 7 + i * 5, text: l, size, role: 'REFERENCE_DIMENSIONS' })
      if (v)
        tableTexts.push({
          x: x + width - 5 - v.length * charWidth,
          y: y + 7 + i * 5,
          text: v,
          size,
          role: 'REFERENCE_DIMENSIONS',
        })
    }
    table = { bounds: rect(x, y, x + width, y + height), texts: tableTexts }
  }
  const bounds = table ? union([geometryBounds, table.bounds]) : geometryBounds
  return { name, parts, paths, circles, texts, table, bounds, geometryBounds, measurements }
}
