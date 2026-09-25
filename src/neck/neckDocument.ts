import {
  cloneDocument,
  type NeckDocument,
  type NeckEnd,
  type NeckParams,
  type NeckPlacement,
  type ProjectDocument,
} from '../model/project'
import { createHeadstock } from '../headstock/template'
import { validateInstrumentPolicy } from '../headstock/bass'
import { automaticPocket, physicalHeel } from './automaticPocket'
import { calculateNeck, DEFAULT_JOIN_FRET, DEFAULT_NECK } from './fretfactoryGeometry'

export type NeckChange = {
  params: NeckParams
  placement: NeckPlacement
  end: NeckEnd
}

export type NeckDerivation =
  | { kind: 'fresh' }
  | { kind: 'import'; params: NeckParams }
  | { kind: 'params'; params: NeckParams }
  | { kind: 'placement'; placement: NeckPlacement }
  | { kind: 'end'; end: NeckEnd }
  | { kind: 'whole'; change: NeckChange }

export const DEFAULT_NECK_END: NeckEnd = {
  endMarginMm: 10,
  fretboardEndMarginMm: 16.35,
  radiusMm: 6,
  fitAllowanceMm: 0,
}

type NeckReference = NeckDocument['referenceBoundaryNodes']

function neckReference(document: ProjectDocument): NeckReference | null {
  const boundary = document.body.neckJointBoundary
  if (!boundary) return null
  const [rightId, centerId, leftId] = boundary.anchorIds
  const find = (id: string) => document.body.outline.nodes.find((node) => node.id === id)
  const right = find(rightId)
  const center = find(centerId)
  const left = find(leftId)
  if (!right || !center || !left) return null
  return {
    left: structuredClone(left),
    center: structuredClone(center),
    right: structuredClone(right),
  }
}

function freshPlacement(params: NeckParams): NeckPlacement {
  return { joinFret: Math.min(DEFAULT_JOIN_FRET, params.frets), offsetMm: 0 }
}

function calculated(
  params: NeckParams,
  placement: NeckPlacement,
  end: NeckEnd,
  headstock: NeckDocument['headstock'],
  referenceBoundaryNodes: NeckReference,
  physicalProfile: NeckDocument['physicalProfile'] = null,
): NeckDocument {
  if (physicalProfile)
    physicalProfile = { ...physicalProfile, nutWidthMm: params.stringSpanNut + 2 * params.overhang }
  return {
    calculationVersion: 'fretfactory-89f94c0e',
    params: structuredClone(params),
    placement: { ...placement },
    end: { ...end },
    snapshot: calculateNeck(params, end.endMarginMm, end.fretboardEndMarginMm, physicalProfile),
    headstock: structuredClone(headstock),
    physicalProfile: structuredClone(physicalProfile),
    referenceBoundaryNodes: structuredClone(referenceBoundaryNodes),
  }
}

function freshNeck(document: ProjectDocument): NeckDocument | null {
  const reference = neckReference(document)
  if (!reference) return null
  const params = structuredClone(DEFAULT_NECK)
  return calculated(params, freshPlacement(params), DEFAULT_NECK_END, createHeadstock(), reference)
}

function applyAutomaticMouth(document: ProjectDocument) {
  const neck = document.neck
  const boundary = document.body.neckJointBoundary
  if (!neck || !boundary) throw new Error('The neck pocket requires a locked joint.')
  if ([7, 8].includes(neck.params.strings) && neck.headstock.activeTemplateId !== 'headless')
    neck.headstock.activeTemplateId = 'inline'
  const geometry = automaticPocket(document)
  if (!geometry) throw new Error('Deriving the neck pocket failed.')
  physicalHeel(document)
  const [rightId, centerId, leftId] = boundary.anchorIds
  const live = (id: string) => document.body.outline.nodes.find((node) => node.id === id)!
  const left = live(leftId)
  const right = live(rightId)
  const replacements = new Map([
    [
      leftId,
      {
        ...geometry.mouth.left,
        outgoing: left.outgoing,
        outHandle: structuredClone(left.outHandle),
      },
    ],
    [centerId, geometry.mouth.center],
    [
      rightId,
      {
        ...geometry.mouth.right,
        inHandle: structuredClone(right.inHandle),
      },
    ],
  ])
  document.body.outline.nodes = document.body.outline.nodes.map(
    (node) => replacements.get(node.id) ?? node,
  )
}

/**
 * Derives a complete, detached document for every neck mutation.
 * Store owns public preconditions, validation-message order, history and drafts.
 */
export function deriveNeckDocument(
  document: ProjectDocument,
  derivation: NeckDerivation,
): ProjectDocument | null {
  const next = cloneDocument(document)
  const existing = next.neck
  let neck: NeckDocument | null
  let clearPocket = false

  switch (derivation.kind) {
    case 'fresh':
      neck = freshNeck(next)
      clearPocket = true
      break
    case 'import': {
      const reference = existing ? existing.referenceBoundaryNodes : neckReference(next)
      if (!reference) return null
      neck = calculated(
        derivation.params,
        existing ? existing.placement : freshPlacement(derivation.params),
        existing ? existing.end : DEFAULT_NECK_END,
        existing ? existing.headstock : createHeadstock(),
        reference,
        existing?.physicalProfile ?? null,
      )
      clearPocket = true
      break
    }
    case 'params':
      if (!existing) return null
      neck = calculated(
        derivation.params,
        existing.placement,
        existing.end,
        existing.headstock,
        existing.referenceBoundaryNodes,
        existing.physicalProfile,
      )
      break
    case 'placement':
      if (!existing) return null
      neck = { ...structuredClone(existing), placement: { ...derivation.placement } }
      break
    case 'end':
      if (!existing) return null
      neck = calculated(
        existing.params,
        existing.placement,
        derivation.end,
        existing.headstock,
        existing.referenceBoundaryNodes,
        existing.physicalProfile,
      )
      break
    case 'whole': {
      const base = existing ?? freshNeck(next)
      if (!base) return null
      neck = calculated(
        derivation.change.params,
        derivation.change.placement,
        derivation.change.end,
        base.headstock,
        base.referenceBoundaryNodes,
        base.physicalProfile,
      )
      clearPocket = !existing
      break
    }
  }

  if (!neck) return null
  next.neck = neck
  validateInstrumentPolicy(next)
  if (next.fretboardInlays) {
    const maxFrets = neck.params.frets
    next.fretboardInlays.markedFrets = next.fretboardInlays.markedFrets.filter((f) => f <= maxFrets)
    next.fretboardInlays.doubleInlayFrets = next.fretboardInlays.doubleInlayFrets.filter(
      (f) => f <= maxFrets && next.fretboardInlays!.markedFrets.includes(f),
    )
  }
  if (clearPocket) next.body.neckPocket = null
  applyAutomaticMouth(next)
  return next
}
