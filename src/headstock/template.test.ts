import { pchipToBezierSegments } from '../neck/vendor/pchip'
import { describe, it, expect } from 'vitest'
import { useAppStore } from '../store'
import { calculateNeck, transformPoint } from '../neck/fretfactoryGeometry'
import { parseProject, serializeProject } from '../file/projectFile'
import {
  canonicalHeadstockPoint,
  headstockFit,
  headstockGeometry,
  headstockWorldNodes,
  validateHeadstock,
  createHeadstock,
} from './template'
import { cross, distance, dot, sub } from './math'
const example = (n: number) => {
  const d = structuredClone(useAppStore.getState().document)
  d.pickupCavities = []
  d.neck!.params = {
    ...d.neck!.params,
    strings: n,
    ...(n === 6 ? {} : { stringSpanNut: (n - 1) * 7, stringSpanBridge: (n - 1) * 10.5 }),
  }
  d.neck!.snapshot = calculateNeck(d.neck!.params, 10, 16.35)
  return d
}
describe('measured headstock geometry', () => {
  it.each([
    [6, 151.31498868214953, 0.7301683602572108],
    [7, 174.9744481043342, 1.335314],
    [8, 198.63390752651884, 1.475914638],
  ])('preserves measured dimensions and M6 fit for %i strings', (n, length, angle) => {
    const d = example(n),
      before = JSON.stringify(d.neck!.snapshot),
      g = headstockGeometry(d)!,
      f = headstockFit(d)
    expect(f.errors).toEqual([])
    expect(g.edgeLengthMm).toBeCloseTo(length, 8)
    expect(g.maxAngleDeg).toBeCloseTo(angle, 5)
    expect(f.minBodyGapMm).toBeCloseTo(0.859459422, 7)
    expect(f.minButtonGapMm).toBeCloseTo(3.807759243, 7)
    expect(g.holes).toHaveLength(n)
    g.holes.forEach((p, i) => {
      expect(p.r).toBe(5)
      expect(dot(sub(p, g.A), g.n)).toBeCloseTo(12.999420166, 7)
      if (i) expect(distance(p, g.holes[i - 1])).toBeCloseTo(23.659459422, 7)
    })
    expect(cross(g.e, g.n)).toBeCloseTo(1, 10)
    g.strings.forEach((s) => {
      expect(distance(s.C, s.T!)).toBeCloseTo(3, 9)
      expect(dot(sub(s.T!, s.S), sub(s.T!, s.C))).toBeCloseTo(0, 7)
      expect(cross(sub(s.C, s.S), sub(s.T!, s.S))).toBeGreaterThan(0)
    })
    expect(JSON.stringify(d.neck!.snapshot)).toBe(before)
  })
  it('places the seam on actual nut endpoints with continuous neck-side directions', () => {
    const d = example(6),
      g = headstockGeometry(d)!,
      nodes = g.nodes,
      first = nodes[0],
      last = nodes.at(-1)!,
      s = d.neck!.snapshot
    const datum = d.body.outline.nodes.find((n) => n.id === d.body.neckJointBoundary!.anchorIds[1])!
    expect(first.x).toBeCloseTo(transformPoint(s.nut[0], d.neck!.placement, s, datum).x, 10)
    expect(last.x).toBeCloseTo(transformPoint(s.nut.at(-1)!, d.neck!.placement, s, datum).x, 10)
    expect(
      cross({ x: first.outHandle!.dx, y: first.outHandle!.dy }, sub(s.nut[0], s.bridge[0])),
    ).toBeCloseTo(0, 8)
    expect(
      cross({ x: last.inHandle!.dx, y: last.inHandle!.dy }, sub(s.nut.at(-1)!, s.bridge.at(-1)!)),
    ).toBeCloseTo(0, 8)
  })
  it('inverse transforms free points and never accumulates scaling', () => {
    const d = example(6),
      canonical = JSON.stringify(d.neck!.headstock),
      before = headstockWorldNodes(d)
    for (const n of before.filter((n) => n.id.includes('free') || n.id === 'headstock-tip')) {
      const p = canonicalHeadstockPoint(d, n),
        base = d.neck!.headstock.variants.inline.nodes.find((v) => v.id === n.id)!
      expect(p.x).toBeCloseTo(base.x, 9)
      expect(p.y).toBeCloseTo(base.y, 9)
    }
    const eight = example(8)
    eight.neck!.headstock = d.neck!.headstock
    headstockGeometry(eight)
    expect(JSON.stringify(d.neck!.headstock)).toBe(canonical)
    expect(headstockWorldNodes(d)).toEqual(before)
  })
  it('rejects locked geometry, hardware collisions and self-intersection including curved handles', () => {
    const d = example(6),
      locked = structuredClone(d.neck!.headstock)
    locked.variants.inline.nodes[1].x += 1
    expect(() => validateHeadstock(d, locked)).toThrow('protected')
    const bad = structuredClone(d.neck!.headstock)
    bad.variants.inline.nodes[7].x = -100
    bad.variants.inline.nodes[7].y = -80
    expect(() => validateHeadstock(d, bad)).toThrow()
    const curved = structuredClone(d.neck!.headstock)
    curved.variants.inline.nodes[6].outHandle = { dx: -300, dy: 40 }
    expect(() => validateHeadstock(d, curved)).toThrow()
  })
  it('validates canonical structure also while unsupported counts preserve the neck', () => {
    const d = example(5)
    expect(headstockGeometry(d)).toBeNull()
    expect(headstockFit(d).supported).toBe(false)
    expect(() => validateHeadstock(d, d.neck!.headstock)).not.toThrow()
    const bad = createHeadstock()
    bad.variants.inline.nodes[1].y += 1
    expect(() => validateHeadstock(d, bad)).toThrow()
  })
  it('round trips default v8 and rejects tampered protected nodes before replacement', () => {
    const d = structuredClone(useAppStore.getState().document)
    expect(parseProject(serializeProject(d))).toEqual(d)
    d.neck!.headstock.variants.inline.nodes[1].x += 1
    expect(() => parseProject(serializeProject(d))).toThrow('protected')
    const version = structuredClone(useAppStore.getState().document) as any
    version.neck.headstock.version = 4
    expect(() => parseProject(serializeProject(version))).toThrow('headstock structure')
  })
})

it('closes the actual curved multiscale nut inside the focus bounds', () => {
  const d = example(7)
  d.neck!.params.scaleBass = 685.8
  d.neck!.params.curvedExponent = 0.7
  d.neck!.snapshot = calculateNeck(d.neck!.params, 10, 16.35)
  const datum = d.body.outline.nodes.find((n) => n.id === d.body.neckJointBoundary!.anchorIds[1])!,
    nut = d.neck!.snapshot.nut.map((p) =>
      transformPoint(p, d.neck!.placement, d.neck!.snapshot, datum),
    ),
    segments = pchipToBezierSegments(nut),
    g = headstockGeometry(d)!
  const reverse = segments.at(-1)!,
    pair = (p: { x: number; y: number }) => `${p.x} ${p.y}`
  expect(g.path).toContain(`C ${pair(reverse.c2)} ${pair(reverse.c1)} ${pair(reverse.p0)}`)
  for (const s of segments)
    for (let i = 0; i <= 100; i++) {
      const t = i / 100,
        u = 1 - t,
        x = u ** 3 * s.p0.x + 3 * u * u * t * s.c1.x + 3 * u * t * t * s.c2.x + t ** 3 * s.p1.x,
        y = u ** 3 * s.p0.y + 3 * u * u * t * s.c1.y + 3 * u * t * t * s.c2.y + t ** 3 * s.p1.y
      expect(x).toBeGreaterThanOrEqual(g.bounds.minX)
      expect(x).toBeLessThanOrEqual(g.bounds.maxX)
      expect(y).toBeGreaterThanOrEqual(g.bounds.minY)
      expect(y).toBeLessThanOrEqual(g.bounds.maxY)
    }
})
