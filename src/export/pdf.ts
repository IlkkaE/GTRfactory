import {
  PDFDocument,
  StandardFonts,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  rectangle,
  clip,
  endPath,
} from 'pdf-lib'
import type { ExportDrawing, ExportPath, ExportText } from './model'
import { planPdfPages, type Paper } from './pages'
import { pathData } from './svg'
import { tablePath } from './layout'
const PT = 72 / 25.4
export async function pdfExport(d: ExportDrawing, paper: Paper = 'custom', margin = 10) {
  const plan = planPdfPages(d, paper, margin),
    doc = await PDFDocument.create(),
    font = await doc.embedFont(StandardFonts.Courier)
  doc.setTitle(d.name)
  doc.setCreator('GTRfactory')
  for (const [index, tile] of plan.pages.entries()) {
    const page = doc.addPage([tile.width * PT, tile.height * PT]),
      ox = tile.source.minX - margin,
      oy = tile.source.minY - margin
    const drawPath = (p: ExportPath) =>
      page.drawSvgPath(pathData(p, true), {
        x: -ox * PT,
        y: (tile.height + oy) * PT,
        scale: PT,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.2,
        borderDashArray: p.role === 'REFERENCE_CENTERLINE' ? [6, 3] : undefined,
      })
    const drawText = (t: ExportText) =>
      page.drawText(t.text, {
        x: (t.x - ox) * PT,
        y: (tile.height - (t.y - oy)) * PT,
        size: t.size * PT,
        font,
        color: rgb(0, 0, 0),
      })
    if (paper !== 'custom')
      page.pushOperators(
        pushGraphicsState(),
        rectangle(
          margin * PT,
          margin * PT,
          (tile.width - 2 * margin) * PT,
          (tile.height - 2 * margin) * PT,
        ),
        clip(),
        endPath(),
      )
    if (tile.kind === 'drawing') {
      for (const p of d.paths) drawPath(p)
      for (const c of d.circles)
        page.drawCircle({
          x: (c.center.x - ox) * PT,
          y: (tile.height - (c.center.y - oy)) * PT,
          size: c.radiusMm * PT,
          borderColor: rgb(0, 0, 0),
          borderWidth: 0.2 * PT,
        })
      for (const t of d.texts) drawText(t)
    }
    if (tile.table && d.table) {
      drawPath(tablePath(d.table))
      for (const t of d.table.texts) drawText(t)
    }
    if (paper !== 'custom') page.pushOperators(popGraphicsState())
    if (paper !== 'custom') {
      const label =
        index +
        1 +
        '/' +
        plan.pages.length +
        (tile.kind === 'info'
          ? ' - Dimensions'
          : ' - R' + (tile.row + 1) + ' C' + (tile.column + 1)) +
        ' - 100 % / 1:1'
      page.drawText(label, { x: margin * PT, y: 3 * PT, size: 7, font })
      if (tile.kind === 'drawing') {
        // Marcas en el borde del área imprimible, fuera del dibujo.
        for (const [x, y] of [
          [margin, margin],
          [tile.width - margin, margin],
          [margin, tile.height - margin],
          [tile.width - margin, tile.height - margin],
        ]) {
          page.drawLine({
            start: { x: (x - 1.5) * PT, y: y * PT },
            end: { x: (x + 1.5) * PT, y: y * PT },
            thickness: 0.15 * PT,
          })
          page.drawLine({
            start: { x: x * PT, y: (y - 1.5) * PT },
            end: { x: x * PT, y: (y + 1.5) * PT },
            thickness: 0.15 * PT,
          })
        }
      }
    }
  }
  return doc.save()
}
