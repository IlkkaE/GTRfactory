import {
  PDFDocument,
  StandardFonts,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  rectangle,
  clip,
  endPath,
  PDFName,
  PDFDict,
  PDFString,
  PDFOperator,
  PDFOperatorNames,
} from 'pdf-lib'
import type { ExportDrawing, ExportPath, ExportText } from './model'
import { planPdfPages, type Paper } from './pages'
import { pathData } from './svg'
import { tablePath } from './layout'

const PT = 72 / 25.4

export async function pdfExport(d: ExportDrawing, paper: Paper = 'custom', margin = 10) {
  const plan = planPdfPages(d, paper, margin),
    doc = await PDFDocument.create(),
    font = await doc.embedFont(StandardFonts.Courier),
    titleFont = await doc.embedFont(StandardFonts.HelveticaBold)
  doc.setTitle(d.name)
  doc.setCreator('GTRfactory')

  const rawTitle = d.name?.trim() ?? ''
  const title = [...rawTitle]
    .filter((c) => {
      try {
        titleFont.widthOfTextAtSize(c, 10)
        return true
      } catch {
        return false
      }
    })
    .join('')

  const hasInlays =
    d.paths.some((p) => p.role === 'ROUTE_INLAY') || d.circles.some((c) => c.role === 'ROUTE_INLAY')

  let ocgRef: any = null
  if (hasInlays) {
    const ocgDict = doc.context.obj({
      Type: 'OCG',
      Name: PDFString.of('Fretboard inlays'),
    })
    ocgRef = doc.context.register(ocgDict)
    const ocgArray = doc.context.obj([ocgRef])
    const defaultView = doc.context.obj({
      BaseState: 'ON',
      ON: [ocgRef],
      Order: [ocgRef],
    })
    const ocProperties = doc.context.obj({
      OCGs: ocgArray,
      D: defaultView,
    })
    doc.catalog.set(PDFName.of('OCProperties'), ocProperties)
  }

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
      const nonInlayPaths = d.paths.filter((p) => p.role !== 'ROUTE_INLAY')
      const inlayPaths = d.paths.filter((p) => p.role === 'ROUTE_INLAY')
      const nonInlayCircles = d.circles.filter((c) => c.role !== 'ROUTE_INLAY')
      const inlayCircles = d.circles.filter((c) => c.role === 'ROUTE_INLAY')

      for (const p of nonInlayPaths) drawPath(p)
      for (const c of nonInlayCircles)
        page.drawCircle({
          x: (c.center.x - ox) * PT,
          y: (tile.height - (c.center.y - oy)) * PT,
          size: c.radiusMm * PT,
          borderColor: rgb(0, 0, 0),
          borderWidth: 0.2 * PT,
        })

      if (inlayPaths.length > 0 || inlayCircles.length > 0) {
        if (ocgRef) {
          const res = page.node.Resources() || doc.context.obj({})
          let props = res.get(PDFName.of('Properties'))
          if (!props || !(props instanceof PDFDict)) {
            props = doc.context.obj({})
            res.set(PDFName.of('Properties'), props)
          }
          ;(props as PDFDict).set(PDFName.of('InlaysOC'), ocgRef)
          page.pushOperators(
            PDFOperator.of(PDFOperatorNames.BeginMarkedContentSequence, [
              PDFName.of('OC'),
              PDFName.of('InlaysOC'),
            ]),
          )
        }

        for (const p of inlayPaths) drawPath(p)
        for (const c of inlayCircles)
          page.drawCircle({
            x: (c.center.x - ox) * PT,
            y: (tile.height - (c.center.y - oy)) * PT,
            size: c.radiusMm * PT,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.2 * PT,
          })

        if (ocgRef) {
          page.pushOperators(PDFOperator.of(PDFOperatorNames.EndMarkedContent))
        }
      }

      for (const t of d.texts) drawText(t)
    }

    if (tile.table && d.table) {
      drawPath(tablePath(d.table))
      for (const t of d.table.texts) drawText(t)
    }

    if (paper !== 'custom') page.pushOperators(popGraphicsState())

    if (title) {
      const pageWidth = tile.width * PT,
        maxTitleSize = Math.min(16, Math.max(8, margin * PT * 0.6)),
        availableWidth = Math.max(50, pageWidth - 2 * margin * PT),
        unconstrainedWidth = titleFont.widthOfTextAtSize(title, maxTitleSize),
        titleSize =
          unconstrainedWidth > availableWidth
            ? (availableWidth / unconstrainedWidth) * maxTitleSize
            : maxTitleSize,
        titleWidth = titleFont.widthOfTextAtSize(title, titleSize),
        titleX = (pageWidth - titleWidth) / 2,
        titleY = (tile.height - margin * 0.5) * PT - titleSize * 0.35

      page.drawText(title, {
        x: titleX,
        y: titleY,
        size: titleSize,
        font: titleFont,
        color: rgb(0, 0, 0),
      })
    }

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
