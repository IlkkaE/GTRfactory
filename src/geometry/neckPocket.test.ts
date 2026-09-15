import { describe, expect, it } from 'vitest'
import { createStarterDocument, type OutlineNode } from '../model/project'
import { deriveNeckPocket, pocketContainmentWarning, type NeckPocketInput } from './neckPocket'

const node = (id: string, x: number, y: number): OutlineNode => ({
  id,
  x,
  y,
  kind: 'corner',
  inHandle: null,
  outHandle: null,
  outgoing: 'line',
})
const trapezoid = (radiusMm = 6): NeckPocketInput => ({
  mouth: {
    left: { ...node('left', -28, 0), inHandle: { dx: 10, dy: -2 }, outgoing: 'cubicBezier' },
    center: {
      ...node('centre', 0, -5),
      inHandle: { dx: 10, dy: 0 },
      outHandle: { dx: -10, dy: 0 },
      outgoing: 'cubicBezier',
    },
    right: { ...node('right', 28, 0), outHandle: { dx: -10, dy: -2 }, outgoing: 'cubicBezier' },
  },
  mouthWinding: 'right-to-left',
  leftSide: { a: -0.1, b: -28 },
  rightSide: { a: 0.1, b: 28 },
  endY: 76,
  fitAllowanceMm: 0,
  radiusMm,
})
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

describe('neck pocket geometry', () => {
  it('keeps the actual starter centre and IDs exactly while fitting only its locked mouth halves', () => {
    const nodes = createStarterDocument().body.outline.nodes
    const center = nodes.find((n) => n.id === 'starter-01')!
    const left = nodes.find((n) => n.id === 'starter-02')!
    const right = nodes.find((n) => n.id === 'starter-21')!
    const before = structuredClone({ center, left, right })
    const pocket = deriveNeckPocket({
      mouth: { left, center, right },
      leftSide: { a: 0.08, b: -40 },
      rightSide: { a: -0.04, b: 35 },
      mouthWinding: 'right-to-left',
      endY: 100,
      fitAllowanceMm: 1,
      radiusMm: 4,
    })
    expect(pocket.mouth.center.id).toBe(center.id)
    expect(pocket.mouth.center.x).toBe(center.x)
    expect(pocket.mouth.center.y).toBe(center.y)
    expect(pocket.mouth.left.x).toBeCloseTo(-40 + 0.08 * left.y - 0.5, 12)
    expect(pocket.mouth.right.x).toBeCloseTo(35 - 0.04 * right.y + 0.5, 12)
    expect(pocket.mouth.left.outHandle).toEqual(before.left.outHandle)
    expect(pocket.mouth.right.inHandle).toEqual(before.right.inHandle)
    expect({ center, left, right }).toEqual(before)
  })

  it('creates a 56 mm wide, 76 mm long open U with true shared six-millimetre arcs', () => {
    const pocket = deriveNeckPocket(trapezoid())
    expect(pocket.maxRadiusMm).toBeGreaterThan(6)
    const leftAngle = Math.acos(0.1 / Math.hypot(-0.1, 1))
    const rightAngle = Math.acos(0.1 / Math.hypot(0.1, 1))
    expect(distance(pocket.leftSideTangent, pocket.leftEndTangent)).toBeCloseTo(
      2 * 6 * Math.cos(leftAngle / 2),
      10,
    )
    expect(distance(pocket.rightEndTangent, pocket.rightSideTangent)).toBeCloseTo(
      2 * 6 * Math.cos(rightAngle / 2),
      10,
    )
    expect(pocket.pathD).toContain('A 6 6 0 0 0')
    expect(pocket.pathD).not.toMatch(/[Zz]/)
    expect(pocket.pathD.match(/ A /g)).toHaveLength(2)
  })

  it('uses the total fit allowance as a half-width adjustment on each side', () => {
    const pocket = deriveNeckPocket({ ...trapezoid(0), fitAllowanceMm: 2 })
    expect(pocket.mouth.left.x).toBe(-29)
    expect(pocket.mouth.right.x).toBe(29)
    expect(pocket.adjustedRightSide.b - pocket.adjustedLeftSide.b).toBe(58)
  })

  it('calculates the asymmetric trapezoid maximum radius from both side lengths and end span', () => {
    const input: NeckPocketInput = {
      mouth: {
        left: { ...node('l', -31, 4), inHandle: { dx: 9, dy: -2 }, outgoing: 'cubicBezier' },
        center: {
          ...node('c', 0, 0),
          inHandle: { dx: 8, dy: 3 },
          outHandle: { dx: -9, dy: 2 },
          outgoing: 'cubicBezier',
        },
        right: { ...node('r', 26, 11), outHandle: { dx: -8, dy: -3 }, outgoing: 'cubicBezier' },
      },
      mouthWinding: 'right-to-left',
      leftSide: { a: -0.08, b: -30.68 },
      rightSide: { a: 0.12, b: 24.68 },
      endY: 70,
      fitAllowanceMm: 0,
      radiusMm: 0,
    }
    const zero = deriveNeckPocket(input)
    const leftUnitLength = Math.hypot(input.leftSide.a, 1)
    const rightUnitLength = Math.hypot(input.rightSide.a, 1)
    const leftFactor = 1 / Math.tan(Math.acos(-input.leftSide.a / leftUnitLength) / 2)
    const rightFactor = 1 / Math.tan(Math.acos(input.rightSide.a / rightUnitLength) / 2)
    const expected = Math.min(
      ((input.endY - input.mouth.left.y) * leftUnitLength) / leftFactor,
      ((input.endY - input.mouth.right.y) * rightUnitLength) / rightFactor,
      (zero.rightCorner.x - zero.leftCorner.x) / (leftFactor + rightFactor),
    )
    expect(zero.maxRadiusMm).toBeCloseTo(expected, 10)
    const atMax = deriveNeckPocket({ ...input, radiusMm: zero.maxRadiusMm })
    expect(atMax.pathD).toContain(' A ')
    expect(() => deriveNeckPocket({ ...input, radiusMm: zero.maxRadiusMm + 0.000001 })).toThrow(
      'exceeds',
    )
  })

  it('rejects invalid radii, a reversed side pair, an early end and a folded mouth', () => {
    expect(() => deriveNeckPocket({ ...trapezoid(), radiusMm: -1 })).toThrow('negative')
    expect(() => deriveNeckPocket({ ...trapezoid(), radiusMm: Number.NaN })).toThrow('finite')
    expect(() => deriveNeckPocket({ ...trapezoid(), endY: 0 })).toThrow('below')
    expect(() => deriveNeckPocket({ ...trapezoid(), rightSide: { a: -1, b: 28 } })).toThrow(
      'intersect',
    )
    expect(() =>
      deriveNeckPocket({
        ...trapezoid(),
        mouth: { ...trapezoid().mouth, left: node('bad', 2, 0) },
      }),
    ).toThrow('opposite sides')
    expect(() =>
      deriveNeckPocket({ ...trapezoid(), mouthWinding: 'left-to-right' as never }),
    ).toThrow('mouth chain')
    expect(() =>
      deriveNeckPocket({
        ...trapezoid(),
        mouth: {
          ...trapezoid().mouth,
          center: { ...trapezoid().mouth.center, outHandle: { dx: 8, dy: 0 } },
        },
      }),
    ).toThrow('mouth curve')
  })
  it('warns when an otherwise valid draft pocket exits its shaped body', () => {
    const body: OutlineNode[] = [
      node('a', -100, -10),
      node('b', 100, -10),
      node('c', 100, 100),
      node('d', -100, 100),
    ]
    expect(pocketContainmentWarning(body, deriveNeckPocket(trapezoid()))).toBeNull()
    expect(
      pocketContainmentWarning(body, deriveNeckPocket({ ...trapezoid(), endY: 150 })),
    ).toContain('outside')
  })
})
