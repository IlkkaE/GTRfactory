import { describe, expect, it } from 'vitest'
import { asCubic, bounds, geometryWarning, moveNodes, splitSegment } from './outline'
import { createStarterDocument, type OutlineNode } from '../model/project'
describe('outline geometry', () => {
  it('keeps exact bounds after de Casteljau split', () => {
    const n = createStarterDocument().body.outline.nodes
    const before = bounds(n),
      after = bounds(splitSegment(n, 1, 0.37))
    expect(after.minX).toBeCloseTo(before.minX, 8)
    expect(after.maxY).toBeCloseTo(before.maxY, 8)
  })
  it('converts an explicit line fixture to a geometrically identical cubic', () => {
    const n: OutlineNode[] = [
      { id: 'a', x: 0, y: 0, kind: 'corner', inHandle: null, outHandle: null, outgoing: 'line' },
      { id: 'b', x: 100, y: 0, kind: 'corner', inHandle: null, outHandle: null, outgoing: 'line' },
      { id: 'c', x: 0, y: 10, kind: 'corner', inHandle: null, outHandle: null, outgoing: 'line' },
    ]
    const b = bounds(n),
      changed = asCubic(n, 0, true)
    expect(bounds(changed).width).toBeCloseTo(b.width, 8)
  })
  it('moves only selected nodes and detects a crossing', () => {
    const n = createStarterDocument().body.outline.nodes,
      changed = moveNodes(n, new Set([n[2].id]), 10, 5)
    expect(changed[2].x).toBe(n[2].x + 10)
    expect(changed[1]).toEqual(n[1])
    expect(
      geometryWarning([
        { id: 'a', x: 0, y: 0, kind: 'corner', inHandle: null, outHandle: null, outgoing: 'line' },
        {
          id: 'b',
          x: 10,
          y: 10,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
        { id: 'c', x: 0, y: 10, kind: 'corner', inHandle: null, outHandle: null, outgoing: 'line' },
        { id: 'd', x: 10, y: 0, kind: 'corner', inHandle: null, outHandle: null, outgoing: 'line' },
      ]),
    ).toContain('self-intersects')
  })
})
