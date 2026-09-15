import type { Bounds, Point } from '../geometry/outline'

export type GridSizeMm = 0 | 10 | 5 | 1

export const gridSizes: readonly GridSizeMm[] = [0, 10, 5, 1]

export function nextGridSize(current: GridSizeMm): GridSizeMm {
  return gridSizes[(gridSizes.indexOf(current) + 1) % gridSizes.length]
}

export function snapValue(value: number, gridMm: GridSizeMm): number {
  return gridMm === 0 ? value : Math.round(value / gridMm) * gridMm
}

/** Snaps a dragged point, then returns the delta from its original world position. */
export function snappedDelta(anchor: Point, delta: Point, gridMm: GridSizeMm): Point {
  if (gridMm === 0) return delta
  return {
    x: snapValue(anchor.x + delta.x, gridMm) - anchor.x,
    y: snapValue(anchor.y + delta.y, gridMm) - anchor.y,
  }
}

/** A bounded world-space SVG path; it stays aligned when the canvas is panned or mirrored. */
export function gridPath(world: Bounds, gridMm: GridSizeMm, maxLines = 1200): string {
  if (gridMm === 0) return ''
  let step = gridMm
  let minX = Math.floor(world.minX / step) * step,
    maxX = Math.ceil(world.maxX / step) * step,
    minY = Math.floor(world.minY / step) * step,
    maxY = Math.ceil(world.maxY / step) * step,
    vertical = Math.round((maxX - minX) / step) + 1,
    horizontal = Math.round((maxY - minY) / step) + 1
  // Keep the snap resolution exact, but draw every nth grid line when zoomed out.
  if (vertical + horizontal > maxLines) {
    step *= Math.ceil((vertical + horizontal) / maxLines)
    minX = Math.floor(world.minX / step) * step
    maxX = Math.ceil(world.maxX / step) * step
    minY = Math.floor(world.minY / step) * step
    maxY = Math.ceil(world.maxY / step) * step
    vertical = Math.round((maxX - minX) / step) + 1
    horizontal = Math.round((maxY - minY) / step) + 1
  }
  const commands: string[] = []
  for (let x = minX; x <= maxX; x += step) commands.push(`M${x} ${minY}V${maxY}`)
  for (let y = minY; y <= maxY; y += step) commands.push(`M${minX} ${y}H${maxX}`)
  return commands.join('')
}
