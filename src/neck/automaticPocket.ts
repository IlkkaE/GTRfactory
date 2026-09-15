import type { ProjectDocument } from '../model/project'
import { deriveNeckPocket } from '../geometry/neckPocket'
import { transformPoint, translatedSides } from './fretfactoryGeometry'
import { assertFretInsideHeel } from './heelClearance'

export function automaticPocket(document: ProjectDocument) {
  return deriveProfile(document, true)
}
export function physicalHeel(document: ProjectDocument) {
  return deriveProfile(document, false)
}
export function physicalFretboard(document: ProjectDocument) {
  return deriveProfile(document, false, true)
}

function deriveProfile(document: ProjectDocument, withFit: boolean, fretboard = false) {
  const neck = document.neck,
    boundary = document.body.neckJointBoundary
  if (!neck || !boundary || boundary.anchorIds.length !== 3) return null
  const center = document.body.outline.nodes.find((n) => n.id === boundary.anchorIds[1])
  if (!center) throw new Error("The neck's locked joint is missing.")
  const reference = neck.referenceBoundaryNodes
  if (reference.center.x !== center.x || reference.center.y !== center.y) {
    throw new Error("The neck's fixed centre node does not match the saved joint reference.")
  }
  const sides = translatedSides(neck.snapshot, neck.placement, center)
  const endY = transformPoint(
    { x: 0, y: fretboard ? neck.snapshot.fretboardEndY : neck.snapshot.heelEndY },
    neck.placement,
    neck.snapshot,
    center,
  ).y
  const profile = deriveNeckPocket({
    mouth: reference,
    mouthWinding: 'right-to-left',
    leftSide: sides.left,
    rightSide: sides.right,
    endY,
    fitAllowanceMm: withFit ? neck.end.fitAllowanceMm : 0,
    radiusMm: neck.end.radiusMm,
  })
  // El traste pertenece al cuello; una holgura negativa no cambia su contorno.
  if (!withFit && !fretboard)
    assertFretInsideHeel(
      neck.snapshot.frets
        .at(-1)!
        .points.map((p) => transformPoint(p, neck.placement, neck.snapshot, center)),
      profile,
    )
  return profile
}
