import type { ExportDrawing, Rect } from './model'
import { rect, rectOverlap, segmentHits } from './math'
import { textBounds } from './layout'
export type Paper = 'custom' | 'a4' | 'a3'
export type PdfPage = {
  kind: 'drawing' | 'info'
  width: number
  height: number
  source: Rect
  row: number
  column: number
  table: boolean
}
export type PdfPlan = { pages: PdfPage[]; margin: number; overlap: number }
const contains = (a: Rect, b: Rect) =>
  a.minX <= b.minX && a.minY <= b.minY && a.maxX >= b.maxX && a.maxY >= b.maxY
function hasInk(d: ExportDrawing, b: Rect) {
  const expanded = rect(b.minX - 0.15, b.minY - 0.15, b.maxX + 0.15, b.maxY + 0.15)
  if (d.texts.some((t) => rectOverlap(textBounds(t), expanded))) return true
  if (d.paths.some((p) => p.segments.some((s) => segmentHits(s, expanded)))) return true
  return d.circles.some((c) => {
    const near = Math.hypot(
      Math.max(b.minX - c.center.x, 0, c.center.x - b.maxX),
      Math.max(b.minY - c.center.y, 0, c.center.y - b.maxY),
    )
    const far = Math.max(
      ...[
        [b.minX, b.minY],
        [b.maxX, b.minY],
        [b.minX, b.maxY],
        [b.maxX, b.maxY],
      ].map(([x, y]) => Math.hypot(x - c.center.x, y - c.center.y)),
    )
    return near <= c.radiusMm + 0.15 && far >= c.radiusMm - 0.15
  })
}
export function planPdfPages(d: ExportDrawing, paper: Paper, margin = 10, overlap = 10): PdfPlan {
  if (paper === 'custom')
    return {
      margin,
      overlap: 0,
      pages: [
        {
          kind: 'drawing',
          width: d.bounds.width + 2 * margin,
          height: d.bounds.height + 2 * margin,
          source: d.bounds,
          row: 0,
          column: 0,
          table: !!d.table,
        },
      ],
    }
  const base = paper === 'a4' ? [210, 297] : [297, 420]
  function candidate(width: number, height: number): PdfPage[] {
    const pw = width - 2 * margin,
      ph = height - 2 * margin
    if (overlap < 0 || overlap >= Math.min(pw, ph))
      throw new Error('The page overlap does not fit the paper size.')
    const grid = (b: Rect, includeTable: boolean) => {
      const cols = Math.max(1, 1 + Math.ceil((b.width - pw) / (pw - overlap))),
        rows = Math.max(1, 1 + Math.ceil((b.height - ph) / (ph - overlap)))
      if (cols * rows > 500)
        throw new Error(
          'The drawing requires more than 500 pages. Select fewer parts or a custom-size PDF.',
        )
      const result: PdfPage[] = []
      let tableUsed = false
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const x = b.minX + c * (pw - overlap),
            y = b.minY + r * (ph - overlap),
            source = rect(x, y, x + pw, y + ph)
          const table = !!(
            includeTable &&
            d.table &&
            !tableUsed &&
            contains(source, d.table.bounds)
          )
          if (table) tableUsed = true
          if (hasInk(d, source) || table)
            result.push({ kind: 'drawing', width, height, source, row: r, column: c, table })
        }
      return { result, tableUsed }
    }
    let { result, tableUsed } = grid(d.bounds, !!d.table)
    if (d.table && !tableUsed) {
      result = grid(d.geometryBounds, false).result
      const b = d.table.bounds
      if (b.width > pw || b.height > ph) return []
      result.push({
        kind: 'info',
        width,
        height,
        source: rect(b.minX, b.minY, b.minX + pw, b.minY + ph),
        row: 0,
        column: 0,
        table: true,
      })
    }
    return result
  }
  const choices = [candidate(base[1], base[0]), candidate(base[0], base[1])].filter((p) => p.length)
  choices.sort((a, b) => a.length - b.length)
  if (!choices.length)
    throw new Error(
      'The dimensions table does not fit this paper size. Select A3 or a custom-size PDF.',
    )
  return { margin, overlap, pages: choices[0] }
}
