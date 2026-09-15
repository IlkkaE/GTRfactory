import { describe, expect, it } from 'vitest'
import { deriveNeckPocket, type NeckPocketGeometry } from '../geometry/neckPocket'
import type { OutlineNode } from '../model/project'
import { assertFretInsideHeel } from './heelClearance'

const node = (id: string, x: number, y: number): OutlineNode => ({
  id,
  x,
  y,
  kind: 'corner',
  outgoing: 'cubicBezier',
  inHandle: null,
  outHandle: null,
})
function asymmetricHeel() {
  const left = node('left', -21, 10),
    center = node('center', 0, 0),
    right = node('right', 25, 10)
  right.outHandle = { dx: -25 / 3, dy: -10 / 3 }
  center.inHandle = { dx: 25 / 3, dy: 10 / 3 }
  center.outHandle = { dx: -7, dy: 10 / 3 }
  left.inHandle = { dx: 7, dy: -10 / 3 }
  return deriveNeckPocket({
    mouth: { left, center, right },
    mouthWinding: 'right-to-left',
    leftSide: { a: -0.1, b: -20 },
    rightSide: { a: 0.5, b: 20 },
    endY: 100,
    fitAllowanceMm: 0,
    radiusMm: 10,
  })
}
describe('continuous fret / rounded heel clearance', () => {
  it('accepts a curved fret rejected by the former global tangent-Y test, including side contact', () => {
    const heel = asymmetricHeel(),
      points = [
        { x: -28, y: 80 },
        { x: 0, y: 88 },
        { x: 62, y: 84 },
      ]
    expect(88).toBeGreaterThan(Math.min(heel.leftSideTangent.y, heel.rightSideTangent.y))
    expect(() => assertFretInsideHeel(points, heel)).not.toThrow()
    const mirror = (p: { x: number; y: number }) => ({ x: -p.x, y: p.y })
    const mirrored: NeckPocketGeometry = {
      ...heel,
      adjustedLeftSide: { a: -heel.adjustedRightSide.a, b: -heel.adjustedRightSide.b },
      adjustedRightSide: { a: -heel.adjustedLeftSide.a, b: -heel.adjustedLeftSide.b },
      leftCorner: mirror(heel.rightCorner),
      rightCorner: mirror(heel.leftCorner),
      leftSideTangent: mirror(heel.rightSideTangent),
      rightSideTangent: mirror(heel.leftSideTangent),
      leftEndTangent: mirror(heel.rightEndTangent),
      rightEndTangent: mirror(heel.leftEndTangent),
    }
    expect(() => assertFretInsideHeel(points.map(mirror).reverse(), mirrored)).not.toThrow()
  })
  it('rejects rounded-cap contact and an intermediate fret point beyond the end', () => {
    const h = asymmetricHeel()
    expect(() => assertFretInsideHeel([h.leftSideTangent, h.rightSideTangent], h)).toThrow(
      'does not fit',
    )
    expect(() =>
      assertFretInsideHeel(
        [
          { x: -28, y: 80 },
          { x: 0, y: 101 },
          { x: 62, y: 84 },
        ],
        h,
      ),
    ).toThrow('does not fit')
    expect(() =>
      assertFretInsideHeel(
        [
          { x: -28, y: 80 },
          { x: 0, y: 100 },
          { x: 62, y: 84 },
        ],
        { ...h, radiusMm: 0 },
      ),
    ).toThrow('does not fit')
  })
})
