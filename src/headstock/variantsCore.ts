import type { OutlineNode, ProjectDocument } from '../model/project'
import { deleteNodes } from '../geometry/outline'
import {
  HEADSTOCK_TEMPLATE_IDS,
  headstockTemplate,
  headstockTemplateDefaults,
  type HeadstockTemplateId,
} from './variants'

export type { HeadstockTemplateId }
export { HEADSTOCK_TEMPLATE_IDS, headstockTemplate }
export const supportsHeadstockTemplate = (
  definition: { supportedStrings: readonly number[] },
  strings: number,
) => definition.supportedStrings.includes(strings)
export interface HeadstockVariant {
  version: 1
  nodes: OutlineNode[]
}
export interface HeadstockDocument {
  version: 3
  activeTemplateId: HeadstockTemplateId
  variants: Record<HeadstockTemplateId, HeadstockVariant>
}

export const headstockTemplateConstants = {
  version: 3 as const,
  ids: HEADSTOCK_TEMPLATE_IDS,
  names: Object.fromEntries(
    HEADSTOCK_TEMPLATE_IDS.map((id) => [id, headstockTemplate(id).name]),
  ) as Record<HeadstockTemplateId, string>,
}
export function createHeadstockVariants(): HeadstockDocument {
  return {
    version: 3,
    activeTemplateId: 'inline',
    variants: Object.fromEntries(
      HEADSTOCK_TEMPLATE_IDS.map((id) => [
        id,
        { version: 1, nodes: headstockTemplateDefaults(id) },
      ]),
    ) as HeadstockDocument['variants'],
  }
}
export function activeHeadstockNodes(
  document: Pick<ProjectDocument, 'neck'> | HeadstockDocument,
): OutlineNode[] {
  const value = 'variants' in document ? document : document.neck?.headstock
  return value?.variants[value.activeTemplateId]?.nodes ?? []
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const index = (nodes: OutlineNode[], id: string) => nodes.findIndex((n) => n.id === id)
const active = (document: Pick<ProjectDocument, 'neck'>) => document.neck!.headstock
const finite = (node: OutlineNode) =>
  [
    node.x,
    node.y,
    ...(node.inHandle ? [node.inHandle.dx, node.inHandle.dy] : []),
    ...(node.outHandle ? [node.outHandle.dx, node.outHandle.dy] : []),
  ].every((n) => Number.isFinite(n) && Math.abs(n) <= 1_000_000)
const definition = (headstock: HeadstockDocument) => headstockTemplate(headstock.activeTemplateId)

export function isProtectedHeadstockNode(id: string, headstock?: HeadstockDocument) {
  return definition(headstock ?? createHeadstockVariants()).protectedPositionIds.includes(id)
}
export function isProtectedHeadstockHandle(
  _nodes: OutlineNode[],
  id: string,
  side: 'inHandle' | 'outHandle',
  headstock?: HeadstockDocument,
) {
  const d = definition(headstock ?? createHeadstockVariants())
  if (id === d.editableArc.startId && side === 'outHandle') return false
  // Inline seam direction is derived in world space. Its length remains canonical data.
  if (id === d.editableArc.endId && side === 'inHandle') return d.id === 'inline'
  return isProtectedHeadstockNode(id, headstock)
}
function validateVariant(templateId: HeadstockTemplateId, variant: HeadstockVariant) {
  const d = headstockTemplate(templateId),
    base = d.nodes,
    nodes = variant?.nodes
  if (
    !variant ||
    variant.version !== 1 ||
    !Array.isArray(nodes) ||
    nodes.length > 128 ||
    nodes.length < 3
  )
    throw new Error('The headstock structure or profile version is invalid.')
  if (
    new Set(nodes.map((n) => n.id)).size !== nodes.length ||
    nodes.some(
      (n) =>
        typeof n.id !== 'string' ||
        !n.id ||
        !finite(n) ||
        !['smooth', 'corner'].includes(n.kind) ||
        !['line', 'cubicBezier'].includes(n.outgoing),
    )
  )
    throw new Error('The headstock nodes are invalid.')
  const a = index(nodes, d.editableArc.startId),
    b = index(nodes, d.editableArc.endId),
    baseA = index(base, d.editableArc.startId),
    baseB = index(base, d.editableArc.endId)
  if (
    a < 0 ||
    b - a < 2 ||
    !same(
      nodes.slice(0, a + 1).map((n) => n.id),
      base.slice(0, baseA + 1).map((n) => n.id),
    ) ||
    !same(
      nodes.slice(b).map((n) => n.id),
      base.slice(baseB).map((n) => n.id),
    )
  )
    throw new Error('The protected headstock node chain is invalid.')
  for (const lockedId of d.protectedPositionIds) {
    const current = nodes.find((n) => n.id === lockedId),
      original = base.find((n) => n.id === lockedId)!
    if (
      !current ||
      current.x !== original.x ||
      current.y !== original.y ||
      current.kind !== original.kind ||
      current.outgoing !== original.outgoing
    )
      throw new Error('The protected headstock joint or tuner edge cannot be modified.')
  }
  const draft = {
    version: 3 as const,
    activeTemplateId: templateId,
    variants: {} as HeadstockDocument['variants'],
  }
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i],
      original = base.find((v) => v.id === n.id)
    if (
      i < nodes.length - 1 &&
      n.outgoing === 'cubicBezier' &&
      (!n.outHandle || !nodes[i + 1].inHandle)
    )
      throw new Error('The headstock curve segment is missing a handle.')
    if (n.kind === 'smooth') {
      const u = n.inHandle,
        v = n.outHandle
      if (
        !u ||
        !v ||
        u.dx * v.dx + u.dy * v.dy >= 0 ||
        Math.abs(u.dx * v.dy - u.dy * v.dx) > 1e-8 * Math.hypot(u.dx, u.dy) * Math.hypot(v.dx, v.dy)
      )
        throw new Error('The smooth headstock-node handles are not opposing.')
    }
    if (!original) continue
    for (const side of ['inHandle', 'outHandle'] as const) {
      if (templateId === 'inline' && n.id === d.editableArc.endId && side === 'inHandle') {
        const u = n[side],
          v = original[side]!,
          length = u ? Math.hypot(u.dx, u.dy) : 0,
          limit = Math.hypot(v.dx, v.dy)
        if (
          !u ||
          length <= 0 ||
          length > limit + 1e-9 ||
          u.dx * v.dx + u.dy * v.dy <= 0 ||
          Math.abs(u.dx * v.dy - u.dy * v.dx) > 1e-8 * length * limit
        )
          throw new Error('The direction of the protected headstock seam cannot be modified.')
      } else if (
        isProtectedHeadstockHandle(nodes, n.id, side, draft) &&
        !same(n[side], original[side])
      )
        throw new Error('The protected headstock handle cannot be modified.')
    }
  }
}
export function validateHeadstockVariants(headstock: HeadstockDocument) {
  if (
    !headstock ||
    headstock.version !== 3 ||
    !HEADSTOCK_TEMPLATE_IDS.includes(headstock.activeTemplateId) ||
    !headstock.variants ||
    Object.keys(headstock.variants).length !== HEADSTOCK_TEMPLATE_IDS.length ||
    HEADSTOCK_TEMPLATE_IDS.some((id) => !(id in headstock.variants))
  )
    throw new Error('The headstock structure or profile version is invalid.')
  for (const id of HEADSTOCK_TEMPLATE_IDS) validateVariant(id, headstock.variants[id])
}
function canEdit(document: Pick<ProjectDocument, 'neck'>, id: string, remove: boolean) {
  try {
    const h = active(document)
    validateHeadstockVariants(h)
    const d = definition(h),
      nodes = activeHeadstockNodes(document),
      i = index(nodes, id),
      a = index(nodes, d.editableArc.startId),
      b = index(nodes, d.editableArc.endId)
    return remove ? i > a && i < b && b - a - 1 > 1 : i >= a && i < b
  } catch {
    return false
  }
}
export const canSplitHeadstockSegment = (document: Pick<ProjectDocument, 'neck'>, id: string) =>
  canEdit(document, id, false)
export const canDeleteHeadstockNode = (document: Pick<ProjectDocument, 'neck'>, id: string) =>
  canEdit(document, id, true)
export function deleteHeadstockNodes(
  document: Pick<ProjectDocument, 'neck'>,
  ids: Set<string>,
): OutlineNode[] {
  if (!ids.size || [...ids].some((id) => !canDeleteHeadstockNode(document, id)))
    throw new Error('A protected or final free headstock node cannot be deleted.')
  const nodes = deleteNodes(activeHeadstockNodes(document), ids),
    headstock = structuredClone(active(document))
  headstock.variants[headstock.activeTemplateId] = { version: 1, nodes }
  validateHeadstockVariants(headstock)
  return nodes
}
