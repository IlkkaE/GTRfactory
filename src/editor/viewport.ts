import type { Bounds, Point } from '../geometry/outline'
import type { Camera, ViewId } from '../store'
export type Size = { width: number; height: number }
export type Transform = {
  scale: number
  offsetX: number
  offsetY: number
  mirror: boolean
  direction: 1 | -1
  world: Bounds
}
export const effectiveMirror = (view: ViewId, handedness: 'right' | 'left') =>
  (view === 'back') !== (handedness === 'left')
/** The left-handed presentation is rotated 180� after the physical mirror. */
export const presentationDirection = (handedness: 'right' | 'left'): 1 | -1 =>
  handedness === 'left' ? -1 : 1
export const presentation = (view: ViewId, handedness: 'right' | 'left') => ({
  mirror: effectiveMirror(view, handedness),
  direction: presentationDirection(handedness),
})
/** Maps a one-millimetre screen-axis delta to canonical world axes. */
export const screenDeltaToWorld = (
  delta: Point,
  transform: Pick<Transform, 'mirror' | 'direction'>,
): Point => {
  const xSign = (transform.mirror ? -1 : 1) * transform.direction
  return { x: delta.y / xSign, y: -delta.x / transform.direction }
}
export const RULER = 42
export const DIMENSION_INSET = { left: 76, right: 22, top: 22, bottom: 62 }
export function fitTransform(
  box: Bounds,
  size: Size,
  view: ViewId,
  camera: Camera,
  withDimensions = false,
  pocketBottomY?: number,
  handedness: 'right' | 'left' = 'right',
): Transform {
  const width = Math.max(1, size.width - RULER),
    height = Math.max(1, size.height - RULER)
  const pocketMaxY = Math.max(box.minY + 230, pocketBottomY ?? -Infinity)
  const world =
    view === 'pocket' ? { ...box, maxY: pocketMaxY, height: pocketMaxY - box.minY } : box
  const inset = withDimensions ? DIMENSION_INSET : { left: 22, right: 22, top: 22, bottom: 22 }
  const availableWidth = Math.max(1, width - inset.left - inset.right),
    availableHeight = Math.max(1, height - inset.top - inset.bottom)
  const scale =
    Math.max(
      0.00000001,
      Math.min(
        availableWidth / Math.max(1, world.height),
        availableHeight / Math.max(1, world.width),
      ),
    ) * camera.zoom
  const mirror = effectiveMirror(view, handedness),
    direction = presentationDirection(handedness),
    m = mirror ? -1 : 1,
    cx = (world.minX + world.maxX) / 2,
    cy = (world.minY + world.maxY) / 2
  return {
    scale,
    mirror,
    world,
    offsetX: RULER + inset.left + availableWidth / 2 + direction * cy * scale + camera.panX,
    offsetY: RULER + inset.top + availableHeight / 2 - m * direction * cx * scale + camera.panY,
    direction,
  }
}
/** RH neck points right; LH presentation reverses both display axes. */
export const worldToPx = (p: Point, t: Transform): Point => ({
  x: t.offsetX - t.direction * p.y * t.scale,
  y: t.offsetY + (t.mirror ? -1 : 1) * t.direction * p.x * t.scale,
})
export const pxToWorld = (p: Point, t: Transform): Point => ({
  x: ((p.y - t.offsetY) / t.scale) * (t.mirror ? -1 : 1) * t.direction,
  y: -((p.x - t.offsetX) / t.scale) * t.direction,
})
export const worldMatrix = (t: Transform) =>
  `matrix(0 ${(t.mirror ? -1 : 1) * t.direction * t.scale} ${-t.direction * t.scale} 0 ${t.offsetX} ${t.offsetY})`
export const formatDimension = (mm: number, unit: 'mm' | 'in') =>
  (unit === 'mm' ? mm : mm / 25.4).toFixed(unit === 'mm' ? 1 : 3)
export function ticks(t: Transform, size: Size, unit: 'mm' | 'in', axis: 'x' | 'y') {
  const unitMm = unit === 'in' ? 25.4 : 1,
    desired = (axis === 'x' ? 72 : 45) / (t.scale * unitMm)
  const power = 10 ** Math.floor(Math.log10(desired))
  const step = ([1, 2, 5, 10].find((n) => n * power >= desired) ?? 10) * power
  const worldAxis = axis === 'x' ? 'y' : 'x'
  const start =
    axis === 'x' ? pxToWorld({ x: RULER, y: 0 }, t).y : pxToWorld({ x: 0, y: RULER }, t).x
  const end =
    axis === 'x'
      ? pxToWorld({ x: size.width, y: 0 }, t).y
      : pxToWorld({ x: 0, y: size.height }, t).x
  const lo = Math.min(start, end) / unitMm,
    hi = Math.max(start, end) / unitMm
  const result: { value: number; mm: number; px: number; label: string }[] = []
  for (let i = Math.ceil(lo / step); i * step <= hi && result.length < 200; i++) {
    const value = Number((i * step).toPrecision(10)),
      mm = value * unitMm
    const label = Math.abs(value) >= 1e5 ? value.toExponential(1) : String(value)
    const p = worldAxis === 'x' ? { x: mm, y: 0 } : { x: 0, y: mm }
    result.push({ value, mm, label, px: axis === 'x' ? worldToPx(p, t).x : worldToPx(p, t).y })
  }
  return result
}
