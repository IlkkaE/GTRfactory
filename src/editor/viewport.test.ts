import { describe, expect, it } from 'vitest'
import {
  DIMENSION_INSET,
  fitTransform,
  formatDimension,
  pxToWorld,
  ticks,
  worldToPx,
  worldMatrix,
} from './viewport'
const b = { minX: -100, maxX: 100, minY: -20, maxY: 300, width: 200, height: 320 }
describe('neck-right viewport transform', () => {
  for (const view of ['front', 'back', 'pocket'] as const)
    for (const zoom of [0.2, 1, 20]) {
      it(`keeps mm and pixel inverses and ruler alignment: ${view}, zoom ${zoom}`, () => {
        const size = { width: 600, height: 500 },
          t = fitTransform(b, size, view, { zoom, panX: 15, panY: -7 }),
          p = { x: 43, y: 91 }
        const round = pxToWorld(worldToPx(p, t), t)
        expect(round.x).toBeCloseTo(p.x, 9)
        expect(round.y).toBeCloseTo(p.y, 9)
        for (const unit of ['mm', 'in'] as const)
          for (const axis of ['x', 'y'] as const) {
            const marks = ticks(t, size, unit, axis)
            expect(marks.length).toBeGreaterThan(1)
            for (const tick of marks) {
              const world = pxToWorld(axis === 'x' ? { x: tick.px, y: 0 } : { x: 0, y: tick.px }, t)
              expect(world[axis === 'x' ? 'y' : 'x']).toBeCloseTo(tick.mm, 8)
              expect(tick.mm).toBeCloseTo(tick.value * (unit === 'in' ? 25.4 : 1), 8)
            }
          }
      })
    }
  it('maps the RH neck right and the LH neck left while preserving the physical back mirror', () => {
    const front = fitTransform(b, { width: 600, height: 500 }, 'front', {
      zoom: 1,
      panX: 0,
      panY: 0,
    })
    const back = fitTransform(b, { width: 600, height: 500 }, 'back', { zoom: 1, panX: 0, panY: 0 })
    const left = fitTransform(
      b,
      { width: 600, height: 500 },
      'front',
      { zoom: 1, panX: 0, panY: 0 },
      false,
      undefined,
      'left',
    )
    expect(worldToPx({ x: 0, y: -50 }, front).x).toBeGreaterThan(
      worldToPx({ x: 0, y: 50 }, front).x,
    )
    expect(worldToPx({ x: 0, y: -50 }, back).x).toBeGreaterThan(worldToPx({ x: 0, y: 50 }, back).x)
    expect(worldToPx({ x: 0, y: -50 }, left).x).toBeLessThan(worldToPx({ x: 0, y: 50 }, left).x)
    expect(worldToPx({ x: 40, y: 0 }, front).y).toBeGreaterThan(
      worldToPx({ x: -40, y: 0 }, front).y,
    )
    expect(worldToPx({ x: 40, y: 0 }, back).y).toBeLessThan(worldToPx({ x: -40, y: 0 }, back).y)
    expect(worldMatrix(front)).toMatch(/^matrix\(0 [^ ]+ -[^ ]+ 0 /)
    expect(worldMatrix(back)).toMatch(/^matrix\(0 -/)
  })
})
describe('dimension presentation', () => {
  it('reserves room without changing the canonical mm transform', () => {
    const normal = fitTransform(b, { width: 600, height: 500 }, 'front', {
      zoom: 1,
      panX: 0,
      panY: 0,
    })
    const annotated = fitTransform(
      b,
      { width: 600, height: 500 },
      'front',
      { zoom: 1, panX: 0, panY: 0 },
      true,
    )
    expect(annotated.scale).toBeLessThan(normal.scale)
    expect(worldToPx({ x: b.maxX, y: b.maxY }, annotated).x).toBeGreaterThan(
      DIMENSION_INSET.left - 1,
    )
    expect(worldToPx({ x: b.maxX, y: b.minY }, annotated).x).toBeLessThan(
      600 - DIMENSION_INSET.right + 1,
    )
    expect(formatDimension(322.404, 'mm')).toBe('322.4')
    expect(formatDimension(322.404, 'in')).toBe('12.693')
  })
})

it('uses back XOR handedness plus a left presentation turn, and keeps inverses exact', () => {
  const size = { width: 600, height: 500 },
    camera = { zoom: 1, panX: 0, panY: 0 },
    point = { x: 42, y: 71 }
  const rightFront = fitTransform(b, size, 'front', camera, false, undefined, 'right')
  const leftFront = fitTransform(b, size, 'front', camera, false, undefined, 'left')
  const leftBack = fitTransform(b, size, 'back', camera, false, undefined, 'left')
  expect(leftFront.mirror).toBe(true)
  expect(leftBack.mirror).toBe(false)
  expect(leftFront.direction).toBe(-1)
  for (const handedness of ['right', 'left'] as const)
    for (const view of ['front', 'back', 'pocket'] as const)
      for (const zoom of [0.2, 1, 20]) {
        const t = fitTransform(
          b,
          size,
          view,
          { zoom, panX: 15, panY: -7 },
          false,
          undefined,
          handedness,
        )
        const round = pxToWorld(worldToPx(point, t), t)
        expect(round.x).toBeCloseTo(point.x, 9)
        expect(round.y).toBeCloseTo(point.y, 9)
      }
  expect(worldToPx({ x: 0, y: -71 }, rightFront).x).toBeGreaterThan(
    worldToPx({ x: 0, y: 71 }, rightFront).x,
  )
  expect(worldToPx({ x: 0, y: -71 }, leftFront).x).toBeLessThan(
    worldToPx({ x: 0, y: 71 }, leftFront).x,
  )
})
