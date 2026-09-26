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
  type PDFRef,
  type PDFPage as PdfLibPage,
  type PDFFont,
} from 'pdf-lib'
import type { ExportDrawing, ExportPath, ExportText, ExportCircle } from './model'
import { planPdfPages, type Paper, type PdfPage } from './pages'
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

  const parts = d.parts ?? []
  const partPathSet = new Set(parts.flatMap((p) => p.paths))
  const partCircleSet = new Set(parts.flatMap((p) => p.circles))

  const calPaths = d.paths.filter((p) => !partPathSet.has(p))
  const calCircles = d.circles.filter((c) => !partCircleSet.has(c))
  const calTexts = d.texts.filter(
    (t) => !parts.some((pt) => pt.name === t.text) && t.text.includes('calibration'),
  )

  const hasInlays =
    d.paths.some((p) => p.role === 'ROUTE_INLAY') || d.circles.some((c) => c.role === 'ROUTE_INLAY')
  const hasCalibration = calPaths.length > 0 || calCircles.length > 0 || calTexts.length > 0
  const hasTable = !!d.table

  // Luodaan OCG-tasot jokaiselle kitaran osalle
  const partOcgMap = new Map<string, PDFRef>()
  const partOcgRefs: PDFRef[] = []

  for (const part of parts) {
    const partOcgDict = doc.context.obj({
      Type: 'OCG',
      Name: PDFString.of(part.name),
    })
    const ref = doc.context.register(partOcgDict)
    partOcgMap.set(part.id, ref)
    partOcgRefs.push(ref)
  }

  let inlaysOcgRef: PDFRef | null = null
  if (hasInlays) {
    const ocgDict = doc.context.obj({
      Type: 'OCG',
      Name: PDFString.of('Fretboard inlays'),
    })
    inlaysOcgRef = doc.context.register(ocgDict)
  }

  let tableOcgRef: PDFRef | null = null
  if (hasTable) {
    const ocgDict = doc.context.obj({
      Type: 'OCG',
      Name: PDFString.of('Dimensions'),
    })
    tableOcgRef = doc.context.register(ocgDict)
  }

  let calOcgRef: PDFRef | null = null
  if (hasCalibration) {
    const ocgDict = doc.context.obj({
      Type: 'OCG',
      Name: PDFString.of('Calibration reference'),
    })
    calOcgRef = doc.context.register(ocgDict)
  }

  // Tekninen kehys ja nimiö OCG-taso
  const frameOcgDict = doc.context.obj({
    Type: 'OCG',
    Name: PDFString.of('Technical frame & title block'),
  })
  const frameOcgRef = doc.context.register(frameOcgDict)

  const allOcgRefs: PDFRef[] = [
    ...partOcgRefs,
    ...(inlaysOcgRef ? [inlaysOcgRef] : []),
    ...(tableOcgRef ? [tableOcgRef] : []),
    ...(calOcgRef ? [calOcgRef] : []),
    frameOcgRef,
  ]

  if (allOcgRefs.length > 0) {
    const ocgArray = doc.context.obj(allOcgRefs)
    const defaultView = doc.context.obj({
      BaseState: 'ON',
      ON: allOcgRefs,
      Order: allOcgRefs,
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

    const drawCircle = (c: ExportCircle) =>
      page.drawCircle({
        x: (c.center.x - ox) * PT,
        y: (tile.height - (c.center.y - oy)) * PT,
        size: c.radiusMm * PT,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.2 * PT,
      })

    const drawText = (t: ExportText) =>
      page.drawText(t.text, {
        x: (t.x - ox) * PT,
        y: (tile.height - (t.y - oy)) * PT,
        size: t.size * PT,
        font,
        color: rgb(0, 0, 0),
      })

    // Rekisteröidään OCG-ominaisuudet sivun Resources-sanakirjaan
    if (allOcgRefs.length > 0) {
      const res = page.node.Resources() || doc.context.obj({})
      let props = res.get(PDFName.of('Properties'))
      if (!props || !(props instanceof PDFDict)) {
        props = doc.context.obj({})
        res.set(PDFName.of('Properties'), props)
      }
      const propsDict = props as PDFDict
      for (const [partId, ref] of partOcgMap.entries()) {
        propsDict.set(PDFName.of('PartOC_' + partId), ref)
      }
      if (inlaysOcgRef) propsDict.set(PDFName.of('InlaysOC'), inlaysOcgRef)
      if (tableOcgRef) propsDict.set(PDFName.of('TableOC'), tableOcgRef)
      if (calOcgRef) propsDict.set(PDFName.of('CalOC'), calOcgRef)
      propsDict.set(PDFName.of('FrameOC'), frameOcgRef)
    }

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
      const handledTexts = new Set<ExportText>()

      // Piirretään jokainen kitaran osa omalle tasolleen
      for (const part of parts) {
        const partOcgRef = partOcgMap.get(part.id)
        if (partOcgRef) {
          page.pushOperators(
            PDFOperator.of(PDFOperatorNames.BeginMarkedContentSequence, [
              PDFName.of('OC'),
              PDFName.of('PartOC_' + part.id),
            ]),
          )
        }

        const nonInlayPaths = part.paths.filter((p) => p.role !== 'ROUTE_INLAY')
        const inlayPaths = part.paths.filter((p) => p.role === 'ROUTE_INLAY')
        const nonInlayCircles = part.circles.filter((c) => c.role !== 'ROUTE_INLAY')
        const inlayCircles = part.circles.filter((c) => c.role === 'ROUTE_INLAY')

        for (const p of nonInlayPaths) drawPath(p)
        for (const c of nonInlayCircles) drawCircle(c)

        if (inlayPaths.length > 0 || inlayCircles.length > 0) {
          if (inlaysOcgRef) {
            page.pushOperators(
              PDFOperator.of(PDFOperatorNames.BeginMarkedContentSequence, [
                PDFName.of('OC'),
                PDFName.of('InlaysOC'),
              ]),
            )
          }

          for (const p of inlayPaths) drawPath(p)
          for (const c of inlayCircles) drawCircle(c)

          if (inlaysOcgRef) {
            page.pushOperators(PDFOperator.of(PDFOperatorNames.EndMarkedContent))
          }
        }

        const nameText = d.texts.find((t) => t.text === part.name)
        if (nameText) {
          drawText(nameText)
          handledTexts.add(nameText)
        }

        if (partOcgRef) {
          page.pushOperators(PDFOperator.of(PDFOperatorNames.EndMarkedContent))
        }
      }

      // Kalibrointiviivain
      if (hasCalibration) {
        if (calOcgRef) {
          page.pushOperators(
            PDFOperator.of(PDFOperatorNames.BeginMarkedContentSequence, [
              PDFName.of('OC'),
              PDFName.of('CalOC'),
            ]),
          )
        }
        for (const p of calPaths) drawPath(p)
        for (const c of calCircles) drawCircle(c)
        for (const t of calTexts) {
          drawText(t)
          handledTexts.add(t)
        }
        if (calOcgRef) {
          page.pushOperators(PDFOperator.of(PDFOperatorNames.EndMarkedContent))
        }
      }

      // Muut mahdolliset tekstit
      for (const t of d.texts) {
        if (!handledTexts.has(t)) drawText(t)
      }
    }

    if (tile.table && d.table) {
      if (tableOcgRef) {
        page.pushOperators(
          PDFOperator.of(PDFOperatorNames.BeginMarkedContentSequence, [
            PDFName.of('OC'),
            PDFName.of('TableOC'),
          ]),
        )
      }
      drawPath(tablePath(d.table))
      for (const t of d.table.texts) drawText(t)
      if (tableOcgRef) {
        page.pushOperators(PDFOperator.of(PDFOperatorNames.EndMarkedContent))
      }
    }

    if (paper !== 'custom') page.pushOperators(popGraphicsState())

    // Konepiirustuksen tekninen kehys, vyöhykkeet, nimiö ja tarkistusviivain
    page.pushOperators(
      PDFOperator.of(PDFOperatorNames.BeginMarkedContentSequence, [
        PDFName.of('OC'),
        PDFName.of('FrameOC'),
      ]),
    )

    drawTechnicalFrameAndGrid(page, tile, margin, font)
    drawTitleBlock(page, tile, margin, d, index, plan.pages.length, font)
    drawGraphicVerificationScale(page, tile, margin, font)
    if (paper !== 'custom') {
      drawTilingRegistrationMarks(page, tile, margin, index, plan.pages.length, plan.overlap, font)
    }

    page.pushOperators(PDFOperator.of(PDFOperatorNames.EndMarkedContent))

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
  }

  return doc.save()
}

/**
 * Piirtää ISO 5457 -standardia noudattavan sisäkehyksen, keskitysmerkit ja vyöhykekoordinaatiston.
 */
function drawTechnicalFrameAndGrid(
  page: PdfLibPage,
  tile: PdfPage,
  margin: number,
  font: PDFFont,
) {
  const fx = margin * PT
  const fy = margin * PT
  const fw = (tile.width - 2 * margin) * PT
  const fh = (tile.height - 2 * margin) * PT

  if (fw <= 10 || fh <= 10) return

  // 1. Sisäkehys (Drawing frame, 0.5 mm)
  page.drawRectangle({
    x: fx,
    y: fy,
    width: fw,
    height: fh,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5 * PT,
  })

  // 2. Keskitysmerkit (Centring marks) 4 sivun puolivälissä
  const markLen = 3 * PT
  const halfW = fx + fw / 2
  const halfH = fy + fh / 2

  // Ylä- ja alareuna
  page.drawLine({
    start: { x: halfW, y: fy + fh - markLen },
    end: { x: halfW, y: fy + fh + markLen },
    thickness: 0.35 * PT,
  })
  page.drawLine({
    start: { x: halfW, y: fy - markLen },
    end: { x: halfW, y: fy + markLen },
    thickness: 0.35 * PT,
  })
  // Vasen ja oikea reuna
  page.drawLine({
    start: { x: fx - markLen, y: halfH },
    end: { x: fx + markLen, y: halfH },
    thickness: 0.35 * PT,
  })
  page.drawLine({
    start: { x: fx + fw - markLen, y: halfH },
    end: { x: fx + fw + markLen, y: halfH },
    thickness: 0.35 * PT,
  })

  // 3. Vyöhykekoordinaatisto (ISO 5457 grid references)
  // Vaakavyöhykkeet (1, 2, 3...) n. 50 mm välein
  const widthMm = tile.width - 2 * margin
  const heightMm = tile.height - 2 * margin
  const cols = Math.max(2, Math.min(16, Math.round(widthMm / 50)))
  const rows = Math.max(2, Math.min(12, Math.round(heightMm / 50)))
  const colW = fw / cols
  const rowH = fh / rows
  const tickLen = 1.5 * PT

  // Vaakavyöhykkeet: numerot ja jakoviivat
  for (let c = 0; c < cols; c++) {
    const colCenterX = fx + (c + 0.5) * colW
    const numText = String(c + 1)
    const textW = font.widthOfTextAtSize(numText, 5)

    // Numerot ylä- ja alamarginaaliin
    if (margin * PT >= 6) {
      page.drawText(numText, {
        x: colCenterX - textW / 2,
        y: fy + fh + 1.2 * PT,
        size: 5,
        font,
      })
      page.drawText(numText, {
        x: colCenterX - textW / 2,
        y: fy - 4.5 * PT,
        size: 5,
        font,
      })
    }

    // Jakoviivat kehyksen reunalla (ei reunoihin)
    if (c > 0) {
      const tickX = fx + c * colW
      page.drawLine({
        start: { x: tickX, y: fy + fh },
        end: { x: tickX, y: fy + fh + tickLen },
        thickness: 0.25 * PT,
      })
      page.drawLine({
        start: { x: tickX, y: fy },
        end: { x: tickX, y: fy - tickLen },
        thickness: 0.25 * PT,
      })
    }
  }

  // Pystyvyöhykkeet: kirjaimet A, B, C... ylhäältä alas ja jakoviivat
  for (let r = 0; r < rows; r++) {
    const rowCenterY = fy + fh - (r + 0.5) * rowH
    const letterText = String.fromCharCode(65 + r)
    const textH = 5

    // Kirjaimet vasempaan ja oikeaan marginaaliin
    if (margin * PT >= 6) {
      page.drawText(letterText, {
        x: fx - 5 * PT,
        y: rowCenterY - textH / 2 + 1,
        size: 5,
        font,
      })
      page.drawText(letterText, {
        x: fx + fw + 1.8 * PT,
        y: rowCenterY - textH / 2 + 1,
        size: 5,
        font,
      })
    }

    // Jakoviivat kehyksen reunalla
    if (r > 0) {
      const tickY = fy + fh - r * rowH
      page.drawLine({
        start: { x: fx, y: tickY },
        end: { x: fx - tickLen, y: tickY },
        thickness: 0.25 * PT,
      })
      page.drawLine({
        start: { x: fx + fw, y: tickY },
        end: { x: fx + fw + tickLen, y: tickY },
        thickness: 0.25 * PT,
      })
    }
  }
}

/**
 * Piirtää teknisen nimiön (Title block – ISO 7200) arkin oikeaan alakulmaan.
 */
function drawTitleBlock(
  page: PdfLibPage,
  tile: PdfPage,
  margin: number,
  d: ExportDrawing,
  index: number,
  totalPages: number,
  font: PDFFont,
) {
  const fx = margin * PT
  const fy = margin * PT
  const fw = (tile.width - 2 * margin) * PT
  const fh = (tile.height - 2 * margin) * PT

  // Nimiön mitat: leveys enintään 80 mm tai 85 % kehyksestä, korkeus 20 mm
  const tbW = Math.min(80 * PT, fw * 0.85)
  const tbH = Math.min(20 * PT, fh * 0.3)

  if (tbW < 40 * PT || tbH < 15 * PT) return

  const tbX = fx + fw - tbW
  const tbY = fy

  // 1. Valkoinen taustalaatikko ja kehys
  page.drawRectangle({
    x: tbX,
    y: tbY,
    width: tbW,
    height: tbH,
    color: rgb(1, 1, 1),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.35 * PT,
  })

  // 2. Vaakajakoviivat
  const row1Y = tbY + tbH * 0.55
  const row2Y = tbY + tbH * 0.28

  page.drawLine({
    start: { x: tbX, y: row1Y },
    end: { x: tbX + tbW, y: row1Y },
    thickness: 0.2 * PT,
  })
  page.drawLine({
    start: { x: tbX, y: row2Y },
    end: { x: tbX + tbW, y: row2Y },
    thickness: 0.2 * PT,
  })

  // Pystyjakoviivat keski- ja alariville
  const col1X = tbX + tbW * 0.48
  const col2X = tbX + tbW * 0.74

  page.drawLine({
    start: { x: col1X, y: tbY },
    end: { x: col1X, y: row1Y },
    thickness: 0.2 * PT,
  })
  page.drawLine({
    start: { x: col2X, y: tbY + tbH * 0.28 },
    end: { x: col2X, y: row1Y },
    thickness: 0.2 * PT,
  })

  // 3. Tekstit
  // Ylärivi: Projektin nimi
  const projTitle = d.name?.trim() || 'Custom Instrument'
  page.drawText('PROJECT: ' + projTitle, {
    x: tbX + 2 * PT,
    y: tbY + tbH - 3.8 * PT,
    size: 5.5,
    font,
  })

  // Keskirivi: Mittakaava, Yksiköt, Päivä
  page.drawText('SCALE: 1:1 (100 %)', {
    x: tbX + 2 * PT,
    y: row1Y - 3.5 * PT,
    size: 4.5,
    font,
  })
  page.drawText('UNITS: mm', {
    x: col1X + 2 * PT,
    y: row1Y - 3.5 * PT,
    size: 4.5,
    font,
  })
  page.drawText('REV: 1.0', {
    x: col2X + 2 * PT,
    y: row1Y - 3.5 * PT,
    size: 4.5,
    font,
  })

  // Alarivi: Arkki ja CAD-tunniste
  const sheetLabel =
    'SHEET: ' +
    (index + 1) +
    '/' +
    totalPages +
    (tile.kind === 'info' ? ' (INFO)' : ' (R' + (tile.row + 1) + ' C' + (tile.column + 1) + ')')
  page.drawText(sheetLabel, {
    x: tbX + 2 * PT,
    y: tbY + 1.8 * PT,
    size: 4.5,
    font,
  })
  page.drawText('GTRfactory CAD/CAM', {
    x: col1X + 2 * PT,
    y: tbY + 1.8 * PT,
    size: 4.5,
    font,
  })
}

/**
 * Piirtää tarkan 100 mm graafisen tarkistusviivaimen 1:1 mittatarkkuuden verifiointiin.
 */
function drawGraphicVerificationScale(
  page: PdfLibPage,
  tile: PdfPage,
  margin: number,
  font: PDFFont,
) {
  const fx = margin * PT
  const fy = margin * PT
  const fw = (tile.width - 2 * margin) * PT

  // Valitaan skaalan pituus (100 mm jos tilaa riittää, muuten 50 mm)
  const scaleMm = fw >= 120 * PT ? 100 : fw >= 65 * PT ? 50 : 0
  if (scaleMm === 0) return

  const scaleW = scaleMm * PT
  const scaleH = 2 * PT
  const scaleX = fx + 2 * PT
  const scaleY = fy + 2 * PT

  // Valkoinen pohjalaatikko
  page.drawRectangle({
    x: scaleX - 1 * PT,
    y: scaleY - 3 * PT,
    width: scaleW + 2 * PT,
    height: 7.5 * PT,
    color: rgb(1, 1, 1),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.15 * PT,
  })

  // Otsikkoteksti
  page.drawText('VERIFICATION SCALE (1:1 ACCURACY CHECK)', {
    x: scaleX,
    y: scaleY + 2.8 * PT,
    size: 3.5,
    font,
  })

  // 10 mm shakkiruutupalkit
  const blocks = scaleMm / 10
  for (let b = 0; b < blocks; b++) {
    if (b % 2 === 0) {
      page.drawRectangle({
        x: scaleX + b * 10 * PT,
        y: scaleY,
        width: 10 * PT,
        height: scaleH,
        color: rgb(0, 0, 0),
      })
    }
  }

  // Ulkoreunus
  page.drawRectangle({
    x: scaleX,
    y: scaleY,
    width: scaleW,
    height: scaleH,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.2 * PT,
  })

  // Mittatekstit: 0 ja maksimi (sekä 50 mm jos 100 mm viivain)
  page.drawText('0', { x: scaleX, y: scaleY - 2.5 * PT, size: 3.5, font })
  if (scaleMm === 100) {
    page.drawText('50', { x: scaleX + 50 * PT - 2 * PT, y: scaleY - 2.5 * PT, size: 3.5, font })
  }
  page.drawText(scaleMm + ' mm', {
    x: scaleX + scaleW - 8 * PT,
    y: scaleY - 2.5 * PT,
    size: 3.5,
    font,
  })
}

/**
 * Piirtää moniarkkitulostukseen kohdistus- ja liitosmerkit (Tiling & registration marks).
 */
function drawTilingRegistrationMarks(
  page: PdfLibPage,
  tile: PdfPage,
  margin: number,
  index: number,
  totalPages: number,
  overlap: number,
  font: PDFFont,
) {
  const fx = margin * PT
  const fy = margin * PT
  const fw = (tile.width - 2 * margin) * PT
  const fh = (tile.height - 2 * margin) * PT

  // 1. Kohdistusristit ympyrällä (⊕) sisäkehyksen neljään kulmaan
  const corners = [
    { x: fx, y: fy },
    { x: fx + fw, y: fy },
    { x: fx, y: fy + fh },
    { x: fx + fw, y: fy + fh },
  ]

  for (const { x, y } of corners) {
    // Kohdistusympyrä
    page.drawCircle({
      x,
      y,
      size: 2 * PT,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.2 * PT,
    })
    // Hiusristi
    page.drawLine({
      start: { x: x - 3.5 * PT, y },
      end: { x: x + 3.5 * PT, y },
      thickness: 0.2 * PT,
    })
    page.drawLine({
      start: { x, y: y - 3.5 * PT },
      end: { x, y: y + 3.5 * PT },
      thickness: 0.2 * PT,
    })
  }

  // 2. Paperin leikkausmerkit arkin reunoille
  const trimLen = 3 * PT
  for (const [x, y] of [
    [margin, margin],
    [tile.width - margin, margin],
    [margin, tile.height - margin],
    [tile.width - margin, tile.height - margin],
  ]) {
    page.drawLine({
      start: { x: (x - trimLen) * PT, y: y * PT },
      end: { x: (x + trimLen) * PT, y: y * PT },
      thickness: 0.2 * PT,
    })
    page.drawLine({
      start: { x: x * PT, y: (y - trimLen) * PT },
      end: { x: x * PT, y: (y + trimLen) * PT },
      thickness: 0.2 * PT,
    })
  }

  // 3. Moniarkkisen tulostuksen ohjeteksti
  if (totalPages > 1 && overlap > 0) {
    const hint =
      'PAGE ' +
      (index + 1) +
      '/' +
      totalPages +
      ' | TILE OVERLAP ' +
      overlap +
      ' mm | CUT AT FRAME BORDER AND ALIGN ADJACENT SHEETS'
    page.drawText(hint, {
      x: fx,
      y: 2 * PT,
      size: 4,
      font,
      color: rgb(0, 0, 0),
    })
  }
}
