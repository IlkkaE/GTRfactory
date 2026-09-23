import { describe, expect, it } from 'vitest'
import { cubicAt, segmentPoints } from '../geometry/outline'
import { calculateNeck } from '../neck/fretfactoryGeometry'
import { createStarterDocument } from '../model/project'
import { headstockFit, headstockGeometry, splitHeadstockNodes } from './template'
import {
  HEADSTOCK_TEMPLATE_IDS,
  activeHeadstockNodes,
  canDeleteHeadstockNode,
  canSplitHeadstockSegment,
  createHeadstockVariants,
  deleteHeadstockNodes,
  validateHeadstockVariants,
} from './variantsCore'

const document = (headstock = createHeadstockVariants()) => ({ neck: { headstock } }) as any
const geometricDocument = (id: 'three-three-2' | 'three-three-3') => {
  const d = createStarterDocument() as any,
    h = createHeadstockVariants()
  h.activeTemplateId = id
  const params = {
    strings: 6,
    frets: 22,
    scaleTreble: 647.7,
    scaleBass: 647.7,
    anchorFret: 17,
    stringSpanNut: 35,
    stringSpanBridge: 52.5,
    overhang: 3,
    curvedExponent: 1,
  }
  d.neck = {
    params,
    placement: { joinFret: 17, offsetMm: 0 },
    snapshot: calculateNeck(params, 10, 16.35),
    headstock: h,
  }
  return d
}
describe('versioned headstock variant topology', () => {
  it('keeps all four independently valid definitions', () => {
    const h = createHeadstockVariants()
    expect(HEADSTOCK_TEMPLATE_IDS).toEqual([
      'inline',
      'three-three-2',
      'three-three-3',
      'bass-4-inline',
      'headless',
    ])
    validateHeadstockVariants(h)
    for (const id of HEADSTOCK_TEMPLATE_IDS) {
      h.activeTemplateId = id
      const nodes = activeHeadstockNodes(h)
      expect(nodes).toHaveLength(id === 'headless' ? 0 : id.startsWith('bass-') ? 8 : 9)
      expect(new Set(nodes.map((n) => n.id)).size).toBe(
        id === 'headless' ? 0 : id.startsWith('bass-') ? 8 : 9,
      )
    }
  })
  it('splits only the free arc with exact De Casteljau geometry', () => {
    const h = createHeadstockVariants()
    h.activeTemplateId = 'three-three-2'
    const d = geometricDocument('three-three-2'),
      nodes = activeHeadstockNodes(d),
      source = nodes[2],
      before = segmentPoints(nodes, 2),
      t = 0.37,
      at = cubicAt(before.p0, before.p1, before.p2, before.p3, t)
    expect(canSplitHeadstockSegment(d, source.id)).toBe(true)
    expect(canSplitHeadstockSegment(d, nodes[1].id)).toBe(false)
    const result = splitHeadstockNodes(d, source.id, t)
    expect(result).not.toBeInstanceOf(Error)
    const added = (result as typeof nodes)[3]
    expect(added.x).toBeCloseTo(at.x, 12)
    expect(added.y).toBeCloseTo(at.y, 12)
  })
  it('rejects protected and last-free-node removal without mutating input', () => {
    const h = createHeadstockVariants()
    h.activeTemplateId = 'three-three-3'
    const d = document(h),
      nodes = activeHeadstockNodes(d),
      before = JSON.stringify(h)
    expect(canDeleteHeadstockNode(d, nodes[2].id)).toBe(false)
    expect(() => deleteHeadstockNodes(d, new Set([nodes[2].id]))).toThrow('protected')
    expect(canDeleteHeadstockNode(d, nodes[3].id)).toBe(true)
    expect(deleteHeadstockNodes(d, new Set([nodes[3].id]))).toHaveLength(8)
    expect(JSON.stringify(h)).toBe(before)
  })
  it.each(['three-three-2', 'three-three-3'] as const)(
    'keeps measured 3+3 posts and nominal M6 fit for %s',
    (id) => {
      const g = headstockGeometry(geometricDocument(id))!
      expect(g.templateId).toBe(id)
      expect(g.holes).toHaveLength(6)
      expect(g.units.map((u) => u.branch)).toEqual([1, 1, 1, -1, -1, -1])
      expect(g.strings.map((v) => v.stringIndex)).toEqual([0, 1, 2, 3, 4, 5])
      expect(
        headstockFit(geometricDocument(id)).valid,
        headstockFit(geometricDocument(id)).errors.join(' '),
      ).toBe(true)
    },
  )
  it('validates inactive variants and refuses foreign protected-chain nodes', () => {
    const h = createHeadstockVariants()
    h.variants['three-three-2'].nodes[1].x += 1
    expect(() => validateHeadstockVariants(h)).toThrow('protected')
    const q = createHeadstockVariants()
    q.variants.inline.nodes.splice(1, 0, { ...q.variants.inline.nodes[3], id: 'foreign' })
    expect(() => validateHeadstockVariants(q)).toThrow('node chain')
  })
})
