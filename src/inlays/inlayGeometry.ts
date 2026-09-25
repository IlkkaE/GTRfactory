import type { NeckDocument, NeckPoint, OutlineNode } from '../model/project'
import type { InlayDocument } from '../model/project'
import { transformPoint } from '../neck/fretfactoryGeometry'
import { pchipToBezierSegments } from '../neck/vendor/pchip'

export interface PlacedInlayShape {
  fretIndex: number
  isDouble: boolean
  side?: 'bass' | 'treble'
  centerMm: { x: number; y: number }
  widthMm: number
  heightMm: number
  /** Inlay polygon transformed to canonical right-handed mm coordinates */
  nodes: OutlineNode[]
}

/**
 * Finds the Y coordinate where a curved fret/nut intersects the centerline (x = 0).
 * Uses bisection on the cubic Bezier segment crossing x = 0.
 */
function findCenterlineY(points: NeckPoint[]): number {
  if (points.length < 2) return points[0]?.y ?? 0
  const segs = pchipToBezierSegments(points)
  const crossingSeg = segs.find((s) => (s.p0.x <= 0 && s.p1.x >= 0) || (s.p0.x >= 0 && s.p1.x <= 0))
  if (!crossingSeg) {
    // Fallback: interpolate between the two points closest to x = 0
    const sorted = [...points].sort((a, b) => Math.abs(a.x) - Math.abs(b.x))
    return (sorted[0].y + sorted[1].y) / 2
  }
  let lo = 0
  let hi = 1
  const point = (t: number) => {
    const u = 1 - t
    return {
      x:
        u ** 3 * crossingSeg.p0.x +
        3 * u * u * t * crossingSeg.c1.x +
        3 * u * t * t * crossingSeg.c2.x +
        t ** 3 * crossingSeg.p1.x,
      y:
        u ** 3 * crossingSeg.p0.y +
        3 * u * u * t * crossingSeg.c1.y +
        3 * u * t * t * crossingSeg.c2.y +
        t ** 3 * crossingSeg.p1.y,
    }
  }
  const isAscending = crossingSeg.p0.x <= crossingSeg.p1.x
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2
    const p = point(mid)
    if (isAscending) {
      if (p.x < 0) lo = mid
      else hi = mid
    } else {
      if (p.x > 0) lo = mid
      else hi = mid
    }
  }
  return point((lo + hi) / 2).y
}

/**
 * Computes canonical millimetre geometries for all enabled fretboard inlays.
 * Returns empty array if inlays are disabled.
 */
export function computeInlays(neck: NeckDocument, inlays: InlayDocument): PlacedInlayShape[] {
  if (!inlays.enabled) return []

  const snapshot = neck.snapshot
  const placement = neck.placement
  const datum = neck.referenceBoundaryNodes.center

  const maxFrets = neck.params.frets
  const marked = inlays.markedFrets.filter((f) => f >= 1 && f <= maxFrets)
  const doubleFrets = new Set(inlays.doubleInlayFrets.filter((f) => marked.includes(f)))

  const results: PlacedInlayShape[] = []

  for (const fretIndex of marked) {
    // 1-based index: fretIndex = 1 means between nut and 1st fret
    const topPoints =
      fretIndex === 1 ? snapshot.nut : snapshot.frets.find((f) => f.n === fretIndex - 1)?.points

    const bottomPoints = snapshot.frets.find((f) => f.n === fretIndex)?.points

    if (!topPoints || !bottomPoints) continue

    const yTop = findCenterlineY(topPoints)
    const yBottom = findCenterlineY(bottomPoints)
    const snapCenterY = (yTop + yBottom) / 2
    const snapHeight = Math.abs(yBottom - yTop)

    // Calculate fretboard width at snapCenterY from leftSide and rightSide
    const leftX = snapshot.leftSide.a * snapCenterY + snapshot.leftSide.b
    const rightX = snapshot.rightSide.a * snapCenterY + snapshot.rightSide.b
    const snapCenterX = (leftX + rightX) / 2
    const snapWidth = Math.abs(rightX - leftX)

    // Calculate dimensions based on scaling mode
    let widthMm: number
    let heightMm: number

    switch (inlays.scalingMode) {
      case 'fixedMm': {
        widthMm = inlays.fixedDiameterMm
        heightMm = inlays.fixedDiameterMm
        break
      }
      case 'proportionalPercent': {
        const widthFraction = (inlays.widthPercentage ?? inlays.fillPercentage) / 100
        const heightFraction = (inlays.heightPercentage ?? inlays.fillPercentage) / 100
        widthMm = snapWidth * widthFraction
        heightMm = snapHeight * heightFraction
        break
      }
      case 'stretchBlock': {
        const fretMargin = inlays.blockMargins.fretMm
        const edgeMargin = inlays.blockMargins.edgeMm
        heightMm = Math.max(1.0, snapHeight - 2 * fretMargin)
        widthMm = Math.max(1.0, snapWidth - 2 * edgeMargin)
        break
      }
    }

    const isDouble = doubleFrets.has(fretIndex)

    if (isDouble) {
      // Double inlays: place one on bass side, one on treble side
      const halfSpacing = inlays.doubleInlaySpacingMm / 2
      const positions: Array<{ side: 'bass' | 'treble'; snapX: number }> = [
        { side: 'bass', snapX: snapCenterX - halfSpacing },
        { side: 'treble', snapX: snapCenterX + halfSpacing },
      ]

      for (const pos of positions) {
        const centerWorld = transformPoint(
          { x: pos.snapX, y: snapCenterY },
          placement,
          snapshot,
          datum,
        )
        const nodes = transformInlayNodes(inlays.shape.nodes, centerWorld, widthMm, heightMm)
        results.push({
          fretIndex,
          isDouble: true,
          side: pos.side,
          centerMm: centerWorld,
          widthMm,
          heightMm,
          nodes,
        })
      }
    } else {
      // Single inlay centered at centerline
      const centerWorld = transformPoint(
        { x: snapCenterX, y: snapCenterY },
        placement,
        snapshot,
        datum,
      )
      const nodes = transformInlayNodes(inlays.shape.nodes, centerWorld, widthMm, heightMm)
      results.push({
        fretIndex,
        isDouble: false,
        centerMm: centerWorld,
        widthMm,
        heightMm,
        nodes,
      })
    }
  }

  return results
}

/**
 * Transforms normalized [0..1, 0..1] nodes into canonical world mm nodes.
 * u: 0 = bass (-x), 1 = treble (+x)
 * v: 0 = nut (-y in snapshot, but canonical y increases from nut toward bridge)
 */
function transformInlayNodes(
  shapeNodes: OutlineNode[],
  centerMm: { x: number; y: number },
  widthMm: number,
  heightMm: number,
): OutlineNode[] {
  const minX = centerMm.x - widthMm / 2
  const minY = centerMm.y - heightMm / 2

  return shapeNodes.map((n) => {
    const x = minX + n.x * widthMm
    const y = minY + n.y * heightMm

    const inHandle = n.inHandle
      ? { dx: n.inHandle.dx * widthMm, dy: n.inHandle.dy * heightMm }
      : null

    const outHandle = n.outHandle
      ? { dx: n.outHandle.dx * widthMm, dy: n.outHandle.dy * heightMm }
      : null

    return {
      ...n,
      x,
      y,
      inHandle,
      outHandle,
    }
  })
}
