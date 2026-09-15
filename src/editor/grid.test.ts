import { describe, expect, it } from 'vitest'
import { gridPath, nextGridSize, snappedDelta } from './grid'

describe('body editing grid', () => {
  it('cycles Off → 10 → 5 → 1 mm → Off', () => {
    expect(nextGridSize(0)).toBe(10)
    expect(nextGridSize(10)).toBe(5)
    expect(nextGridSize(5)).toBe(1)
    expect(nextGridSize(1)).toBe(0)
  })

  it('snaps negative coordinates and half-way values from the dragged anchor', () => {
    expect(snappedDelta({ x: -4, y: 4 }, { x: -1.1, y: 1.1 }, 5)).toEqual({ x: -1, y: 1 })
    expect(snappedDelta({ x: 0, y: 0 }, { x: 2.5, y: 2.6 }, 5)).toEqual({ x: 5, y: 5 })
    expect(snappedDelta({ x: 2, y: 3 }, { x: 0.25, y: 0.25 }, 0)).toEqual({ x: 0.25, y: 0.25 })
  })

  it('keeps a visible, bounded grid at 1 mm while zoomed out', () => {
    const path = gridPath(
      { minX: -500, maxX: 500, minY: -500, maxY: 500, width: 1000, height: 1000 },
      1,
    )
    expect(path).not.toBe('')
    expect(path.match(/M/g)?.length).toBeLessThanOrEqual(1200)
  })
})
