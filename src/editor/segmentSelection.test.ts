import { describe, expect, it } from 'vitest'
import { cubicAt, segmentPoints, splitSegment } from '../geometry/outline'
import type { OutlineNode } from '../model/project'
import { canSplitSegmentAt, nearestSegmentParameter, segmentPoint } from './segmentSelection'
const curve = (scale = 1): OutlineNode[] => [
  {
    id: 'a',
    x: 10 * scale,
    y: 10 * scale,
    kind: 'corner',
    inHandle: null,
    outHandle: { dx: 130 * scale, dy: -90 * scale },
    outgoing: 'cubicBezier',
  },
  {
    id: 'b',
    x: 120 * scale,
    y: 90 * scale,
    kind: 'corner',
    inHandle: { dx: -210 * scale, dy: 80 * scale },
    outHandle: null,
    outgoing: 'line',
  },
]
describe('segment selection parameter', () => {
  it('projects a line linearly and keeps exact endpoints instead of nudging them inward', () => {
    const nodes = curve()
    nodes[0] = { ...nodes[0], x: 0, y: 0, outgoing: 'line', outHandle: null }
    nodes[1] = { ...nodes[1], x: 100, y: 0, inHandle: null }
    expect(nearestSegmentParameter(nodes, 0, { x: 20, y: 12 })).toBe(0.2)
    expect(segmentPoint(nodes, 0, 0.2)).toEqual({ x: 20, y: 0 })
    expect(nearestSegmentParameter(nodes, 0, { x: -5, y: 10 })).toBe(0)
    expect(nearestSegmentParameter(nodes, 0, { x: 105, y: -10 })).toBe(1)
    expect(canSplitSegmentAt(nodes, 0, 0)).toBe(false)
    expect(canSplitSegmentAt(nodes, 0, 1)).toBe(false)
  })
  it.each([0.001, 0.07, 0.27, 0.63, 0.94, 0.999])('finds an asymmetric cubic at t=%s', (t) => {
    const nodes = curve(),
      target = segmentPoint(nodes, 0, t)
    expect(nearestSegmentParameter(nodes, 0, target)).toBeCloseTo(t, 9)
  })
  it('compares all distance minima on a returning curve and remains accurate at large coordinates', () => {
    const nodes = curve(5000)
    for (const target of [
      { x: 0, y: 0 },
      { x: 300000, y: 250000 },
      { x: 600000, y: 50000 },
    ]) {
      const t = nearestSegmentParameter(nodes, 0, target),
        p = segmentPoint(nodes, 0, t),
        distance = (q: { x: number; y: number }) => Math.hypot(q.x - target.x, q.y - target.y)
      let sampled = Infinity
      for (let i = 0; i <= 20000; i++)
        sampled = Math.min(sampled, distance(segmentPoint(nodes, 0, i / 20000)))
      expect(distance(p)).toBeLessThanOrEqual(sampled + 1e-6)
    }
  })
  it('does not split a zero-length line or cubic, and can split the interior of a loop', () => {
    const nodes = curve()
    nodes[1] = { ...nodes[1], x: 10, y: 10, inHandle: null }
    nodes[0].outHandle = null
    for (const kind of ['line', 'cubicBezier'] as const) {
      nodes[0].outgoing = kind
      const t = nearestSegmentParameter(nodes, 0, { x: 30, y: 80 })
      expect(Number.isFinite(t)).toBe(true)
      expect(canSplitSegmentAt(nodes, 0, t)).toBe(false)
    }
    nodes[0].outHandle = { dx: 60, dy: 80 }
    nodes[1].inHandle = { dx: -60, dy: 80 }
    expect(canSplitSegmentAt(nodes, 0, 0.35)).toBe(true)
  })
  it.each([0.13, 0.41, 0.88])(
    'places a split exactly at the marker and preserves both curve halves (%s)',
    (t) => {
      const nodes = curve(),
        divided = splitSegment(nodes, 0, t)
      expect({ x: divided[1].x, y: divided[1].y }).toEqual(segmentPoint(nodes, 0, t))
      for (let i = 0; i <= 50; i++) {
        const u = i / 50,
          p = segmentPoint(nodes, 0, u),
          part = u <= t ? 0 : 1,
          local = u <= t ? u / t : (u - t) / (1 - t),
          s = segmentPoints(divided, part),
          q = cubicAt(s.p0, s.p1, s.p2, s.p3, local)
        expect(q.x).toBeCloseTo(p.x, 10)
        expect(q.y).toBeCloseTo(p.y, 10)
      }
    },
  )
})
