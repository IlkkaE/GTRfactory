import { bounds, pathD, type Bounds } from '../geometry/outline'
import { deriveNeckPocket, type NeckPocketGeometry } from '../geometry/neckPocket'
import type { ProjectDocument } from '../model/project'
import { automaticPocket } from '../neck/automaticPocket'
import { pocketTemplateGeometry } from '../templates/templateGeometry'
import { frontBounds, neckView } from '../neck/neckView'
import type { ViewId } from '../store'

const pathCommand = (nodes: Parameters<typeof pathD>[0], index: number) => {
  const source = nodes[index],
    target = nodes[(index + 1) % nodes.length]
  return source.outgoing === 'line'
    ? `L ${target.x} ${target.y}`
    : `C ${source.x + (source.outHandle?.dx ?? 0)} ${source.y + (source.outHandle?.dy ?? 0)} ${target.x + (target.inHandle?.dx ?? 0)} ${target.y + (target.inHandle?.dy ?? 0)} ${target.x} ${target.y}`
}

function manualPocketGeometry(
  nodes: ProjectDocument['body']['outline']['nodes'],
  pocket: NonNullable<ProjectDocument['body']['neckPocket']>,
): NeckPocketGeometry | null {
  try {
    const datum = nodes.find((node) => node.id === pocket.datumNodeId)
    if (!datum) return null
    const a = (pocket.heelWidthMm - pocket.mouthWidthMm) / (2 * pocket.lengthMm)
    return deriveNeckPocket({
      mouth: pocket.referenceBoundaryNodes,
      mouthWinding: pocket.mouthWinding,
      leftSide: { a: -a, b: datum.x - pocket.mouthWidthMm / 2 + a * datum.y },
      rightSide: { a, b: datum.x + pocket.mouthWidthMm / 2 - a * datum.y },
      endY: datum.y + pocket.lengthMm,
      fitAllowanceMm: pocket.fitAllowanceMm,
      radiusMm: pocket.radiusMm,
    })
  } catch {
    return null
  }
}

function pocketBodyPath(
  nodes: ProjectDocument['body']['outline']['nodes'],
  pocket: NeckPocketGeometry,
  boundary: ProjectDocument['body']['neckJointBoundary'],
) {
  if (!boundary) return pathD(nodes)
  const leftId = boundary.anchorIds[2],
    rightId = boundary.anchorIds[0],
    leftIndex = nodes.findIndex((node) => node.id === leftId),
    rightIndex = nodes.findIndex((node) => node.id === rightId)
  if (leftIndex < 0 || rightIndex < 0) return pathD(nodes)
  let d = `M ${nodes[leftIndex].x} ${nodes[leftIndex].y}`,
    index = leftIndex
  while (index !== rightIndex) {
    d += ` ${pathCommand(nodes, index)}`
    index = (index + 1) % nodes.length
  }
  const left = pocket.mouth.left
  if (pocket.radiusMm === 0)
    return `${d} L ${pocket.rightCorner.x} ${pocket.rightCorner.y} L ${pocket.leftCorner.x} ${pocket.leftCorner.y} L ${left.x} ${left.y} Z`
  return `${d} L ${pocket.rightSideTangent.x} ${pocket.rightSideTangent.y} A ${pocket.radiusMm} ${pocket.radiusMm} 0 0 1 ${pocket.rightEndTangent.x} ${pocket.rightEndTangent.y} L ${pocket.leftEndTangent.x} ${pocket.leftEndTangent.y} A ${pocket.radiusMm} ${pocket.radiusMm} 0 0 1 ${pocket.leftSideTangent.x} ${pocket.leftSideTangent.y} L ${left.x} ${left.y} Z`
}

export function prepareCanvasGeometry(
  document: ProjectDocument,
  template: ProjectDocument | null,
  view: ViewId,
  small: boolean,
  fitBounds: Bounds,
) {
  const nodes = document.body.outline.nodes
  let automatic: NeckPocketGeometry | null = null
  if (view === 'pocket') {
    try {
      automatic = automaticPocket(document)
    } catch {
      automatic = null
    }
  }
  const pocketTemplate = view === 'pocket' ? pocketTemplateGeometry(document) : null
  const neckDrawing = view === 'front' ? neckView(template ?? document) : null
  const legacyPocket =
    view === 'pocket' && document.body.neckPocket
      ? manualPocketGeometry(nodes, document.body.neckPocket)
      : null
  const activePocket = view === 'pocket' ? (automatic ?? legacyPocket) : null
  const visualPath =
    pocketTemplate?.cutPath ??
    (activePocket
      ? pocketBodyPath(nodes, activePocket, document.body.neckJointBoundary)
      : pathD(nodes))
  const shapeBounds = bounds(nodes)
  const drawingBounds = small
    ? view === 'front'
      ? frontBounds(template ?? document)
      : shapeBounds
    : fitBounds
  const pocketBottom =
    pocketTemplate?.cutY ??
    (activePocket
      ? Math.max(activePocket.leftCorner.y, activePocket.rightCorner.y) + 20
      : undefined)
  const corners = activePocket
    ? (['left', 'right'] as const).map((side) => {
        const start = side === 'left' ? activePocket.leftEndTangent : activePocket.rightSideTangent
        const end = side === 'left' ? activePocket.leftSideTangent : activePocket.rightEndTangent
        const corner = side === 'left' ? activePocket.leftCorner : activePocket.rightCorner,
          r = activePocket.radiusMm
        return {
          side,
          corner,
          d: r > 0 ? `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}` : null,
        }
      })
    : []
  const showDimensions = !small && view !== 'pocket'

  return {
    nodes,
    automatic,
    neckDrawing,
    legacyPocket,
    activePocket,
    pocketTemplate,
    visualPath,
    shapeBounds,
    drawingBounds,
    pocketBottom,
    corners,
    showDimensions,
  }
}
