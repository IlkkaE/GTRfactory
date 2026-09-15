import { describe, expect, it } from 'vitest'
import { bounds, pathD, type Bounds } from '../geometry/outline'
import { createStarterDocument, type ProjectDocument } from '../model/project'
import { automaticPocket } from '../neck/automaticPocket'
import { deriveNeckDocument } from '../neck/neckDocument'
import { frontBounds } from '../neck/neckView'
import { prepareCanvasGeometry } from './canvasGeometry'

const fitBounds: Bounds = {
  minX: -200,
  maxX: 200,
  minY: -100,
  maxY: 500,
  width: 400,
  height: 600,
}

function manualPocket(document: ProjectDocument, radiusMm: number) {
  const [rightId, centerId, leftId] = document.body.neckJointBoundary!.anchorIds
  const find = (id: string) => document.body.outline.nodes.find((node) => node.id === id)!
  document.body.neckPocket = {
    datumNodeId: centerId,
    referenceBoundaryNodes: {
      left: structuredClone(find(leftId)),
      center: structuredClone(find(centerId)),
      right: structuredClone(find(rightId)),
    },
    mouthWinding: 'right-to-left',
    mouthWidthMm: 56,
    heelWidthMm: 56,
    lengthMm: 76,
    fitAllowanceMm: 0,
    radiusMm,
  }
  return document
}

function freeze(value: unknown): void {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return
  Object.freeze(value)
  for (const child of Object.values(value as Record<string, unknown>)) freeze(child)
}

describe('canvas geometry preparation', () => {
  it.each([
    ['front', false],
    ['front', true],
    ['back', false],
    ['back', true],
    ['pocket', false],
    ['pocket', true],
  ] as const)('preserves view and thumbnail drawing bounds for %s / small=%s', (view, small) => {
    const document = createStarterDocument()
    const result = prepareCanvasGeometry(document, null, view, small, fitBounds)

    expect(result.nodes).toBe(document.body.outline.nodes)
    expect(result.visualPath).toBeTruthy()
    expect(result.drawingBounds).toEqual(
      small
        ? view === 'front'
          ? frontBounds(document)
          : bounds(document.body.outline.nodes)
        : fitBounds,
    )
    expect(result.showDimensions).toBe(!small && view !== 'pocket')
    expect(result.activePocket).toBeNull()
    expect(result.corners).toEqual([])
  })

  it('uses the front-only template without changing the rendered document or other views', () => {
    const document = createStarterDocument()
    const template = deriveNeckDocument(createStarterDocument(), { kind: 'fresh' })!
    const before = structuredClone(document)
    freeze(template)

    const front = prepareCanvasGeometry(document, template, 'front', true, fitBounds)
    const back = prepareCanvasGeometry(document, template, 'back', true, fitBounds)
    const pocket = prepareCanvasGeometry(document, template, 'pocket', true, fitBounds)

    expect(front.neckDrawing).not.toBeNull()
    expect(front.drawingBounds).toEqual(frontBounds(template))
    expect(back.neckDrawing).toBeNull()
    expect(pocket.neckDrawing).toBeNull()
    expect(document).toEqual(before)
  })

  it('keeps a valid manual pocket when there is no automatic neck pocket', () => {
    const document = manualPocket(createStarterDocument(), 6)
    const result = prepareCanvasGeometry(document, null, 'pocket', false, fitBounds)

    expect(result.automatic).toBeNull()
    expect(result.legacyPocket).not.toBeNull()
    expect(result.activePocket).toBe(result.legacyPocket)
    expect(result.visualPath).toContain(' A 6 6 ')
    expect(result.corners).toHaveLength(2)
    expect(result.corners.every((corner) => corner.d !== null)).toBe(true)
    expect(result.pocketBottom).toBe(
      Math.max(result.activePocket!.leftCorner.y, result.activePocket!.rightCorner.y) + 20,
    )
  })

  it('keeps the zero-radius manual pocket corners as straight segments', () => {
    const result = prepareCanvasGeometry(
      manualPocket(createStarterDocument(), 0),
      null,
      'pocket',
      false,
      fitBounds,
    )

    expect(result.activePocket).not.toBeNull()
    expect(result.visualPath).not.toContain(' A ')
    expect(result.corners.map((corner) => corner.d)).toEqual([null, null])
  })

  it('prefers the automatic pocket over a legacy manual pocket without mutating input', () => {
    const document = manualPocket(
      deriveNeckDocument(createStarterDocument(), { kind: 'fresh' })!,
      0,
    )
    const before = structuredClone(document)
    freeze(document)

    const result = prepareCanvasGeometry(document, null, 'pocket', false, fitBounds)

    expect(result.automatic).toEqual(automaticPocket(document))
    expect(result.legacyPocket).not.toBeNull()
    expect(result.activePocket).toBe(result.automatic)
    expect(document).toEqual(before)
  })

  it('falls back to no manual geometry when the saved draft cannot be derived', () => {
    const document = manualPocket(createStarterDocument(), 6)
    document.body.neckPocket!.lengthMm = 0

    const result = prepareCanvasGeometry(document, null, 'pocket', false, fitBounds)

    expect(result.automatic).toBeNull()
    expect(result.legacyPocket).toBeNull()
    expect(result.activePocket).toBeNull()
    expect(result.visualPath).toBe(pathD(document.body.outline.nodes))
  })
  it('uses the closed automatic template contour and exposes its physical cut bound', () => {
    const document = deriveNeckDocument(createStarterDocument(), { kind: 'fresh' })!
    const result = prepareCanvasGeometry(document, null, 'pocket', false, fitBounds)

    expect(result.pocketTemplate?.diagnostic).toBeNull()
    expect(result.pocketTemplate?.cut).not.toBeNull()
    expect(result.visualPath).toBe(result.pocketTemplate?.cutPath)
    expect(result.pocketBottom).toBe(result.pocketTemplate?.cutY)
    expect(result.visualPath.endsWith(' Z')).toBe(true)
    expect(
      result.pocketTemplate?.cut?.segments.filter((segment) => segment.role === 'template-bottom'),
    ).toHaveLength(1)
  })
})
