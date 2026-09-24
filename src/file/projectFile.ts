import { deriveNeckPocket } from '../geometry/neckPocket'
import {
  BODY_TEXTURE_OPTIONS,
  DEFAULT_BODY_COLOR,
  MAX_BYTES,
  MAX_NODES,
  MAX_PICKUP_CAVITIES,
  validNumber,
  type NeckDocument,
  type NeckJointBoundary,
  type NeckParams,
  type NeckPocketParams,
  type OutlineNode,
  type PickupCavity,
  type RearElectronicsCavity,
  type ProjectDocument,
  type Handedness,
  type Vec,
} from '../model/project'
import { calculateNeck, validateNeckParams } from '../neck/fretfactoryGeometry'
import { automaticPocket, physicalFretboard, physicalHeel } from '../neck/automaticPocket'
import {
  pickupDefaults,
  pickupPlacementError,
  pickupProfile,
  validPickupTransform,
} from '../pickup/profiles'
import {
  HEADSTOCK_TEMPLATE_IDS,
  validateHeadstock,
  type HeadstockTemplateId,
  type HeadstockDocument,
} from '../headstock/template'
import { isBassTemplate, validateInstrumentPolicy } from '../headstock/bass'
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('The file structure is not a GTRfactory project.')
  return value as Record<string, unknown>
}
function handle(value: unknown): Vec | null {
  if (value === null) return null
  const v = object(value)
  if (!validNumber(v.dx) || !validNumber(v.dy)) throw new Error('The neck values are invalid.')
  return { dx: v.dx, dy: v.dy }
}
const smoothValid = (a: Vec, b: Vec) =>
  Math.abs(a.dx * b.dy - a.dy * b.dx) <= 1e-8 * Math.hypot(a.dx, a.dy) * Math.hypot(b.dx, b.dy) &&
  a.dx * b.dx + a.dy * b.dy < 0
export const serializeProject = (project: ProjectDocument) => JSON.stringify(project, null, 2)
function boundary(value: unknown, nodes: OutlineNode[]): NeckJointBoundary | null {
  if (value === null) return null
  const b = object(value)
  if (
    !Array.isArray(b.anchorIds) ||
    !Array.isArray(b.segmentStartIds) ||
    b.anchorIds.length < 2 ||
    b.segmentStartIds.length !== b.anchorIds.length - 1 ||
    !b.anchorIds.every((v) => typeof v === 'string') ||
    !b.segmentStartIds.every((v) => typeof v === 'string')
  )
    throw new Error('The neck-joint metadata is invalid.')
  const anchorIds = b.anchorIds as string[],
    segmentStartIds = b.segmentStartIds as string[],
    ids = new Set(nodes.map((n) => n.id))
  if (
    new Set(anchorIds).size !== anchorIds.length ||
    new Set(segmentStartIds).size !== segmentStartIds.length ||
    !anchorIds.every((id) => ids.has(id) && nodes.find((n) => n.id === id)?.kind === 'corner') ||
    !segmentStartIds.every((id) => ids.has(id))
  )
    throw new Error('The neck-joint identifiers are invalid.')
  for (let i = 0; i < segmentStartIds.length; i++) {
    const index = nodes.findIndex((n) => n.id === segmentStartIds[i])
    if (
      index < 0 ||
      nodes[(index + 1) % nodes.length].id !== anchorIds[i + 1] ||
      segmentStartIds[i] !== anchorIds[i]
    )
      throw new Error('The neck-joint chain is not continuous.')
  }
  return { anchorIds: [...anchorIds], segmentStartIds: [...segmentStartIds] }
}
function pocket(
  value: unknown,
  nodes: OutlineNode[],
  joint: NeckJointBoundary | null,
): NeckPocketParams | null {
  if (value === null) return null
  if (!joint || joint.anchorIds.length !== 3)
    throw new Error('The neck pocket requires a locked three-node neck joint.')
  const p = object(value),
    number = (key: string) => {
      if (!validNumber(p[key])) throw new Error(`The neck pocket's ${key}value is invalid.`)
      return p[key] as number
    }
  if (
    typeof p.datumNodeId !== 'string' ||
    p.datumNodeId !== joint.anchorIds[1] ||
    p.mouthWinding !== 'right-to-left'
  )
    throw new Error('The neck pocket centre reference or mouth chain is invalid.')
  const refs = object(p.referenceBoundaryNodes),
    readNode = (key: 'left' | 'center' | 'right') => {
      const raw = object(refs[key]),
        found = nodes.find((n) => n.id === raw.id)
      if (
        !found ||
        typeof raw.id !== 'string' ||
        !validNumber(raw.x) ||
        !validNumber(raw.y) ||
        !['corner', 'smooth'].includes(raw.kind as string) ||
        !['line', 'cubicBezier'].includes(raw.outgoing as string)
      )
        throw new Error('The neck pocket master reference is invalid.')
      return {
        id: raw.id,
        x: raw.x,
        y: raw.y,
        kind: raw.kind as OutlineNode['kind'],
        inHandle: handle(raw.inHandle),
        outHandle: handle(raw.outHandle),
        outgoing: raw.outgoing as OutlineNode['outgoing'],
      }
    }
  const referenceBoundaryNodes = {
    left: readNode('left'),
    center: readNode('center'),
    right: readNode('right'),
  }
  if (
    referenceBoundaryNodes.left.id !== joint.anchorIds[2] ||
    referenceBoundaryNodes.center.id !== joint.anchorIds[1] ||
    referenceBoundaryNodes.right.id !== joint.anchorIds[0]
  )
    throw new Error('The neck pocket master reference does not match the locked neck joint.')
  const result = {
    datumNodeId: p.datumNodeId,
    referenceBoundaryNodes,
    mouthWinding: 'right-to-left' as const,
    mouthWidthMm: number('mouthWidthMm'),
    heelWidthMm: number('heelWidthMm'),
    lengthMm: number('lengthMm'),
    fitAllowanceMm: number('fitAllowanceMm'),
    radiusMm: number('radiusMm'),
  }
  if (result.mouthWidthMm <= 0 || result.heelWidthMm <= 0 || result.lengthMm <= 0)
    throw new Error('The neck pocket widths and length must be positive.')
  const datum = nodes.find((n) => n.id === result.datumNodeId)!,
    a = (result.heelWidthMm - result.mouthWidthMm) / (2 * result.lengthMm)
  const leftSide = { a: -a, b: datum.x - result.mouthWidthMm / 2 + a * datum.y },
    rightSide = { a, b: datum.x + result.mouthWidthMm / 2 - a * datum.y }
  if (referenceBoundaryNodes.center.x !== datum.x || referenceBoundaryNodes.center.y !== datum.y)
    throw new Error("The neck pocket centre reference does not match the body's fixed centre node.")
  const fitted = deriveNeckPocket({
    mouth: referenceBoundaryNodes,
    mouthWinding: result.mouthWinding,
    leftSide,
    rightSide,
    endY: datum.y + result.lengthMm,
    fitAllowanceMm: result.fitAllowanceMm,
    radiusMm: result.radiusMm,
  })
  const sameVec = (a: Vec | null, b: Vec | null) =>
    a === null ? b === null : b !== null && a.dx === b.dx && a.dy === b.dy
  const bodyNode = (id: string) => nodes.find((n) => n.id === id)!
  const sameAnchor = (
    actual: OutlineNode,
    expected: OutlineNode,
    handles: ('inHandle' | 'outHandle')[],
    checkOutgoing = true,
  ) =>
    actual.x === expected.x &&
    actual.y === expected.y &&
    actual.kind === expected.kind &&
    (!checkOutgoing || actual.outgoing === expected.outgoing) &&
    handles.every((key) => sameVec(actual[key], expected[key]))
  if (
    !sameAnchor(bodyNode(joint.anchorIds[2]), fitted.mouth.left, ['inHandle'], false) ||
    !sameAnchor(bodyNode(joint.anchorIds[1]), fitted.mouth.center, ['inHandle', 'outHandle']) ||
    !sameAnchor(bodyNode(joint.anchorIds[0]), fitted.mouth.right, ['outHandle'])
  )
    throw new Error("The saved neck-pocket mouth does not match the body's locked geometry chain.")
  return result
}
const NECK_SNAPSHOT_NUMBER_TOLERANCE = 1e-10
function sameNeckSnapshot(actual: unknown, expected: unknown): boolean {
  if (typeof expected === 'number')
    return (
      typeof actual === 'number' &&
      Number.isFinite(actual) &&
      Number.isFinite(expected) &&
      Math.abs(actual - expected) <= NECK_SNAPSHOT_NUMBER_TOLERANCE
    )
  if (expected === null || typeof expected !== 'object') return actual === expected
  if (Array.isArray(expected))
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((value, index) => sameNeckSnapshot(actual[index], value))
    )
  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) return false
  const actualRecord = actual as Record<string, unknown>
  const expectedRecord = expected as Record<string, unknown>
  const actualKeys = Object.keys(actualRecord)
  const expectedKeys = Object.keys(expectedRecord)
  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every(
      (key) =>
        Object.hasOwn(actualRecord, key) &&
        sameNeckSnapshot(actualRecord[key], expectedRecord[key]),
    )
  )
}
function neck(value: unknown, allowLegacyBass5 = false): NeckDocument | null {
  if (value === null) return null
  const raw = object(value)
  if (raw.calculationVersion !== 'fretfactory-89f94c0e')
    throw new Error('The neck calculation version is unknown.')
  const p = object(raw.params),
    number = (key: string) => {
      if (!validNumber(p[key])) throw new Error(`The neck's ${key}value is invalid.`)
      return p[key] as number
    }
  const params: NeckParams = {
    strings: number('strings'),
    frets: number('frets'),
    scaleTreble: number('scaleTreble'),
    scaleBass: number('scaleBass'),
    anchorFret: number('anchorFret'),
    stringSpanNut: number('stringSpanNut'),
    stringSpanBridge: number('stringSpanBridge'),
    overhang: number('overhang'),
    curvedExponent: number('curvedExponent'),
  }
  validateNeckParams(params)
  const placement = object(raw.placement),
    end = object(raw.end)
  if (
    !validNumber(placement.joinFret) ||
    !validNumber(placement.offsetMm) ||
    !validNumber(end.endMarginMm) ||
    !validNumber(end.radiusMm) ||
    !validNumber(end.fitAllowanceMm) ||
    !validNumber(end.fretboardEndMarginMm)
  )
    throw new Error('The neck placement or end is invalid.')
  const fretboardEndMarginMm = end.fretboardEndMarginMm as number
  if (
    !Number.isInteger(placement.joinFret) ||
    placement.joinFret < 1 ||
    placement.joinFret > params.frets ||
    end.endMarginMm < 0 ||
    fretboardEndMarginMm <= end.endMarginMm ||
    end.radiusMm < 0
  )
    throw new Error('The neck placement or end is outside the permitted area.')
  if (!Object.prototype.hasOwnProperty.call(raw, 'physicalProfile'))
    throw new Error('The physical neck profile is required for version 10 projects.')
  const physicalProfile =
    raw.physicalProfile === null
      ? null
      : (() => {
          const p = object(raw.physicalProfile)
          if (
            !validNumber(p.nutWidthMm) ||
            !validNumber(p.widthAt12thMm) ||
            p.nutWidthMm <= 0 ||
            p.widthAt12thMm <= 0
          )
            throw new Error('The physical neck profile is invalid.')
          return {
            nutWidthMm: p.nutWidthMm,
            widthAt12thMm: p.nutWidthMm === p.widthAt12thMm ? p.widthAt12thMm : p.widthAt12thMm,
          }
        })()
  const expected = calculateNeck(params, end.endMarginMm, fretboardEndMarginMm, physicalProfile)
  // Snapshot is data, never executable SVG. Floating-point calculation differs slightly between engines.
  const snapshot = object(raw.snapshot)
  if (!sameNeckSnapshot(snapshot, expected))
    throw new Error(
      'The neck geometry snapshot does not match its parameters and calculation version.',
    )
  const refs = object(raw.referenceBoundaryNodes),
    read = (key: 'left' | 'center' | 'right') => {
      const n = object(refs[key])
      if (
        typeof n.id !== 'string' ||
        !validNumber(n.x) ||
        !validNumber(n.y) ||
        !['corner', 'smooth'].includes(n.kind as string) ||
        !['line', 'cubicBezier'].includes(n.outgoing as string)
      )
        throw new Error('The neck joint reference is invalid.')
      return {
        id: n.id,
        x: n.x,
        y: n.y,
        kind: n.kind as OutlineNode['kind'],
        inHandle: handle(n.inHandle),
        outHandle: handle(n.outHandle),
        outgoing: n.outgoing as OutlineNode['outgoing'],
      }
    }
  const rawHeadstock = object(raw.headstock),
    rawVariants = object(rawHeadstock.variants)
  if (!('headless' in rawVariants)) rawVariants['headless'] = { version: 1, nodes: [] }
  const variantKeys = Object.keys(rawVariants),
    legacyBass5Key = 'bass-5-inline',
    activeTemplateId = rawHeadstock.activeTemplateId as string,
    currentVariantsPresent = HEADSTOCK_TEMPLATE_IDS.every((id) => id in rawVariants),
    allowedVariantKeys = variantKeys.every(
      (id) =>
        HEADSTOCK_TEMPLATE_IDS.includes(id as HeadstockTemplateId) ||
        (allowLegacyBass5 && id === legacyBass5Key),
    )
  if (activeTemplateId === legacyBass5Key)
    throw new Error('Five-string bass headstocks are no longer supported.')
  if (
    rawHeadstock.version !== 3 ||
    !HEADSTOCK_TEMPLATE_IDS.includes(activeTemplateId as HeadstockTemplateId) ||
    !currentVariantsPresent ||
    !allowedVariantKeys ||
    variantKeys.length < HEADSTOCK_TEMPLATE_IDS.length ||
    variantKeys.length > HEADSTOCK_TEMPLATE_IDS.length + (allowLegacyBass5 ? 1 : 0)
  )
    throw new Error('The headstock structure or profile version is invalid.')
  const variants = Object.fromEntries(
    HEADSTOCK_TEMPLATE_IDS.map((id) => {
      const variant = object(rawVariants[id])
      if (id === 'headless') {
        if (variant.version !== 1 || !Array.isArray(variant.nodes) || variant.nodes.length !== 0)
          throw new Error('The headstock structure or profile version is invalid.')
        return [id, { version: 1 as const, nodes: [] }]
      }
      if (variant.version !== 1 || !Array.isArray(variant.nodes) || variant.nodes.length > 128)
        throw new Error('The headstock structure or profile version is invalid.')
      const nodes = variant.nodes.map((v) => {
        const n = object(v)
        if (
          typeof n.id !== 'string' ||
          !validNumber(n.x) ||
          !validNumber(n.y) ||
          !['smooth', 'corner'].includes(n.kind as string) ||
          !['line', 'cubicBezier'].includes(n.outgoing as string)
        )
          throw new Error('The headstock node is invalid.')
        return {
          id: n.id,
          x: n.x,
          y: n.y,
          kind: n.kind as OutlineNode['kind'],
          inHandle: handle(n.inHandle),
          outHandle: handle(n.outHandle),
          outgoing: n.outgoing as OutlineNode['outgoing'],
        }
      })
      return [id, { version: 1 as const, nodes }]
    }),
  ) as HeadstockDocument['variants']
  const headstock: HeadstockDocument = {
    version: 3,
    activeTemplateId: activeTemplateId as HeadstockTemplateId,
    variants,
  }
  if (
    ([7, 8].includes(params.strings) &&
      headstock.activeTemplateId !== 'inline' &&
      headstock.activeTemplateId !== 'headless') ||
    (isBassTemplate(headstock.activeTemplateId) && params.strings !== 4)
  )
    throw new Error('The active headstock template does not match the neck string count.')
  const result: NeckDocument = {
    calculationVersion: 'fretfactory-89f94c0e',
    params,
    placement: { joinFret: placement.joinFret, offsetMm: placement.offsetMm },
    end: {
      endMarginMm: end.endMarginMm,
      fretboardEndMarginMm,
      radiusMm: end.radiusMm,
      fitAllowanceMm: end.fitAllowanceMm,
    },
    snapshot: expected,
    headstock,
    physicalProfile,
    referenceBoundaryNodes: { left: read('left'), center: read('center'), right: read('right') },
  }
  validateInstrumentPolicy({ neck: result } as ProjectDocument)
  return result
}
export function parseProject(text: string): ProjectDocument {
  if (new TextEncoder().encode(text).byteLength > MAX_BYTES)
    throw new Error('The file exceeds the 2 MiB technical limit.')
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('The file is not valid GTRfactory JSON.')
  }
  const d = object(raw)
  if (d.format !== 'gtrfactory-project')
    throw new Error('The file format, unit, or coordinate system is invalid.')
  if (d.version !== 10 && d.version !== 11 && d.version !== 12 && d.version !== 13)
    throw new Error(
      'This project version is not supported. The supported versions are 10, 11, 12 and 13.',
    )
  const importedVersion = d.version
  const handedness: Handedness =
    importedVersion === 10
      ? (() => {
          if (Object.hasOwn(d, 'handedness') && d.handedness !== 'right')
            throw new Error('Version 10 projects cannot declare left-handedness.')
          return 'right' as const
        })()
      : d.handedness === 'right' || d.handedness === 'left'
        ? (d.handedness as Handedness)
        : (() => {
            throw new Error(`Version ${importedVersion} projects require handedness right or left.`)
          })()
  if (
    d.format !== 'gtrfactory-project' ||
    d.units !== 'mm' ||
    d.coordinateSystem !== 'centerline-neck-joint-mouth-down'
  )
    throw new Error('The file format, unit, or coordinate system is invalid.')
  if (typeof d.name !== 'string') throw new Error('The project is missing a name.')
  const starter = object(d.starter)
  if (starter.id !== 'gtr-strat-v1' || ![1, 2].includes(starter.version as number))
    throw new Error('The starter-shape metadata is invalid.')
  const body = object(d.body),
    outline = object(body.outline)
  if (
    outline.closed !== true ||
    !Array.isArray(outline.nodes) ||
    outline.nodes.length < 3 ||
    outline.nodes.length > MAX_NODES
  )
    throw new Error('The outline closure or node count is invalid.')
  const ids = new Set<string>()
  const nodes: OutlineNode[] = outline.nodes.map((rawNode) => {
    const n = object(rawNode)
    if (
      typeof n.id !== 'string' ||
      !n.id ||
      ids.has(n.id) ||
      !validNumber(n.x) ||
      !validNumber(n.y) ||
      !['smooth', 'corner'].includes(n.kind as string) ||
      !['line', 'cubicBezier'].includes(n.outgoing as string)
    )
      throw new Error('The node values or identifier are invalid.')
    ids.add(n.id)
    const inHandle = handle(n.inHandle),
      outHandle = handle(n.outHandle)
    if (n.kind === 'smooth' && (!inHandle || !outHandle || !smoothValid(inHandle, outHandle)))
      throw new Error('A smooth node must have two opposing tangent handles.')
    return {
      id: n.id,
      x: n.x,
      y: n.y,
      kind: n.kind as OutlineNode['kind'],
      inHandle,
      outHandle,
      outgoing: n.outgoing as OutlineNode['outgoing'],
    }
  })
  nodes.forEach((source, i) => {
    if (
      source.outgoing === 'cubicBezier' &&
      (!source.outHandle || !nodes[(i + 1) % nodes.length].inHandle)
    )
      throw new Error('The Bézier segment is missing a source or target handle.')
  })
  if (!Object.hasOwn(body, 'neckJointBoundary'))
    throw new Error('The neck-joint metadata is missing.')
  const neckJointBoundary = boundary(body.neckJointBoundary, nodes)
  if (!Object.hasOwn(body, 'neckPocket'))
    throw new Error('The project neck-pocket field is missing.')
  const neckPocket = pocket(body.neckPocket, nodes, neckJointBoundary)
  const rawRear = body.rearElectronicsCavity
  let rearElectronicsCavity: RearElectronicsCavity | null = null
  if (rawRear !== null) {
    const c = object(rawRear)
    if (
      c.profileId !== 'potero-v1' ||
      c.profileVersion !== 1 ||
      !validNumber(c.centerXmm) ||
      !validNumber(c.centerYmm) ||
      !validNumber(c.horizontalMm) ||
      !validNumber(c.verticalMm) ||
      c.horizontalMm <= 0 ||
      c.verticalMm <= 0
    )
      throw new Error('The electronics-cavity structure is invalid.')
    rearElectronicsCavity = {
      profileId: 'potero-v1',
      profileVersion: 1,
      centerXmm: c.centerXmm,
      centerYmm: c.centerYmm,
      horizontalMm: c.horizontalMm,
      verticalMm: c.verticalMm,
    }
  }
  const importedNeck = neck(d.neck, importedVersion === 10)
  if (importedNeck && neckPocket)
    throw new Error('A project cannot contain both a neck and a legacy manual pocket.')
  const rawCavities = d.pickupCavities
  if (!Array.isArray(rawCavities)) throw new Error("The project's pickup cavities are missing.")
  if ((rawCavities as unknown[]).length > MAX_PICKUP_CAVITIES)
    throw new Error('The project contains more than 64 pickup cavities.')
  const pickupIds = new Set<string>()
  const pickupCavities: PickupCavity[] = (rawCavities as unknown[]).map((raw) => {
    const p = object(raw)
    if (
      typeof p.id !== 'string' ||
      !p.id ||
      pickupIds.has(p.id) ||
      typeof p.profileId !== 'string' ||
      !Number.isInteger(p.profileVersion) ||
      !validNumber(p.centerYmm)
    )
      throw new Error('The pickup-cavity values are invalid.')
    const profileVersion = p.profileVersion as number
    if (!pickupProfile(p.profileId, profileVersion))
      throw new Error('The pickup-cavity profile or version is unknown.')
    const profile = pickupProfile(p.profileId, profileVersion)!
    const hasTransform =
      Object.hasOwn(p, 'angleDeg') || Object.hasOwn(p, 'widthMm') || Object.hasOwn(p, 'lengthMm')
    if (importedVersion < 12 && hasTransform)
      throw new Error('Older project versions cannot contain pickup-cavity transform values.')
    const transform =
      importedVersion >= 12
        ? (() => {
            if (
              !Object.hasOwn(p, 'angleDeg') ||
              !Object.hasOwn(p, 'widthMm') ||
              !Object.hasOwn(p, 'lengthMm')
            )
              throw new Error('Version 12 pickup cavities require angle and dimensions.')
            const next = {
              angleDeg: p.angleDeg as number,
              widthMm: p.widthMm as number,
              lengthMm: p.lengthMm as number,
            }
            if (
              !validPickupTransform({
                id: p.id as string,
                profileId: p.profileId as string,
                profileVersion,
                centerYmm: p.centerYmm as number,
                ...next,
              })
            )
              throw new Error('The pickup-cavity transform values are invalid.')
            return next
          })()
        : pickupDefaults(profile)
    pickupIds.add(p.id)
    return {
      id: p.id,
      profileId: p.profileId,
      profileVersion,
      centerYmm: p.centerYmm,
      ...transform,
    }
  })
  const rawColor = body.color
  let bodyColor: string = DEFAULT_BODY_COLOR
  if (typeof rawColor === 'string') {
    const isHex = /^#[0-9a-fA-F]{6}$/.test(rawColor)
    const isTexture =
      rawColor.startsWith('texture:') &&
      BODY_TEXTURE_OPTIONS.some((t) => `texture:${t.id}` === rawColor)
    if (!isHex && !isTexture) {
      throw new Error('The body finish must be a valid hex color or wood texture.')
    }
    bodyColor = rawColor
  } else if (rawColor !== undefined) {
    throw new Error('The body finish must be a valid hex color or wood texture.')
  }
  const result: ProjectDocument = {
    format: 'gtrfactory-project',
    version: 13,
    handedness,
    units: 'mm',
    name: d.name,
    coordinateSystem: 'centerline-neck-joint-mouth-down',
    starter: { id: 'gtr-strat-v1', version: starter.version as 1 | 2 },
    body: {
      outline: { closed: true, nodes },
      neckJointBoundary,
      neckPocket,
      rearElectronicsCavity,
      color: bodyColor,
    },
    neck: importedNeck,
    pickupCavities,
  }
  if (importedNeck) {
    validateHeadstock(result, importedNeck.headstock)
    const ids = neckJointBoundary?.anchorIds
    if (
      !ids ||
      ids.length !== 3 ||
      importedNeck.referenceBoundaryNodes.right.id !== ids[0] ||
      importedNeck.referenceBoundaryNodes.center.id !== ids[1] ||
      importedNeck.referenceBoundaryNodes.left.id !== ids[2]
    )
      throw new Error('The neck joint reference does not match the locked chain.')
    const fitted = automaticPocket(result)!
    physicalHeel(result)
    physicalFretboard(result)
    const actual = (id: string) => nodes.find((n) => n.id === id)!
    const sameVec = (a: Vec | null, b: Vec | null) =>
      a === null ? b === null : b !== null && a.dx === b.dx && a.dy === b.dy
    const same = (
      a: OutlineNode,
      b: OutlineNode,
      handles: ('inHandle' | 'outHandle')[],
      outgoing = true,
    ) =>
      a.x === b.x &&
      a.y === b.y &&
      a.kind === b.kind &&
      (!outgoing || a.outgoing === b.outgoing) &&
      handles.every((k) => sameVec(a[k], b[k]))
    if (
      !same(actual(ids[0]), fitted.mouth.right, ['outHandle']) ||
      !same(actual(ids[1]), fitted.mouth.center, ['inHandle', 'outHandle']) ||
      !same(actual(ids[2]), fitted.mouth.left, ['inHandle'], false)
    )
      throw new Error('The derived neck joint does not match the body nodes.')
  }
  for (const cavity of pickupCavities) {
    const error = pickupPlacementError(result, cavity, cavity.id)
    if (error) throw new Error(error)
  }
  return result
}
export interface NativeWritable {
  write(value: string): Promise<void>
  close(): Promise<void>
  abort?(): Promise<void>
}
export interface SaveHandle {
  createWritable(): Promise<NativeWritable>
}
export interface SaveDialog {
  showSaveFilePicker(options: unknown): Promise<SaveHandle>
}
export interface OpenFile {
  size: number
  text(): Promise<string>
}
export interface OpenHandle extends SaveHandle {
  getFile(): Promise<OpenFile>
}
export interface OpenDialog {
  showOpenFilePicker(options: unknown): Promise<OpenHandle[]>
}
export interface DownloadAdapter {
  download(name: string, text: string): void
}
const fileName = (name: string) =>
  (name
    .replace(/\.gtrfactory$/i, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .trim() || 'My guitar') + '.gtrfactory'
export const savePickerOptions = (suggestedName: string) => ({
  suggestedName: fileName(suggestedName),
  types: [{ description: 'GTRfactory project', accept: { 'application/json': ['.gtrfactory'] } }],
})
export const openPickerOptions = {
  multiple: false,
  types: [{ description: 'GTRfactory project', accept: { 'application/json': ['.gtrfactory'] } }],
}
export const browserSaveDialog = (): SaveDialog | null => {
  const picker = (window as Window & Partial<SaveDialog>).showSaveFilePicker
  return picker ? { showSaveFilePicker: picker.bind(window) } : null
}
export const browserOpenDialog = (): OpenDialog | null => {
  const picker = (window as Window & Partial<OpenDialog>).showOpenFilePicker
  return picker ? { showOpenFilePicker: picker.bind(window) } : null
}
export async function writeProject(handle: SaveHandle, project: ProjectDocument) {
  const writer = await handle.createWritable()
  try {
    await writer.write(serializeProject(project))
    await writer.close()
  } catch (error) {
    try {
      await writer.abort?.()
    } catch {
      // The original write failure is the useful error.
    }
    throw error
  }
}
export async function saveWithDialog(
  dialog: SaveDialog,
  project: ProjectDocument,
  suggestedName: string,
) {
  const handle = await dialog.showSaveFilePicker(savePickerOptions(suggestedName))
  await writeProject(handle, project)
}
export const forceDownload = (
  adapter: DownloadAdapter,
  project: ProjectDocument,
  suggestedName: string,
) => adapter.download(fileName(suggestedName), serializeProject(project))
const browserDownload: DownloadAdapter = {
  download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const a = globalThis.document.createElement('a')
    a.href = url
    a.download = name
    globalThis.document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
}
export const downloadProject = (project: ProjectDocument, suggestedName: string) =>
  forceDownload(browserDownload, project, suggestedName)
