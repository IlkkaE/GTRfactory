import type { OutlineNode } from '../model/project'
import type { Point } from '../geometry/outline'

// User SVG in millimetres: path119, 120, 118, reversed 117, 116, 115, 114.
// Adjacent endpoints are averaged; the absolute cubic controls are retained.
export const bassSourcePoint = (p: Point): Point => ({ x: p.y - 66.1530975, y: -(p.x - 9.2859588) })
const points: Point[] = [
  { x: 8.9860978, y: 44.175043 },
  { x: 47.474151, y: 13.342267 },
  { x: 56.117206, y: 12.107544 },
  { x: 232.841225, y: 57.9333755 },
  { x: 208.88762, y: 115.85948 },
  { x: 193.17137, y: 101.21921 },
  { x: 48.073873, y: 117.79976 },
  { x: 9.5858198, y: 88.131152 },
]
const controls: (null | [Point, Point])[] = [
  [
    { x: 39.889429, y: 43.046154 },
    { x: 47.474151, y: 13.201156 },
  ],
  [
    { x: 49.449707, y: 9.0383784 },
    { x: 56.399428, y: 12.107544 },
  ],
  null,
  [
    { x: 257.48276, y: 65.306431 },
    { x: 260.55192, y: 124.07921 },
  ],
  [
    { x: 208.48192, y: 114.30726 },
    { x: 207.67054, y: 105.41727 },
  ],
  [
    { x: 164.45526, y: 95.645318 },
    { x: 93.441093, y: 99.278929 },
  ],
  [
    { x: 48.073873, y: 117.65865 },
    { x: 42.182485, y: 89.224763 },
  ],
  null,
]
const names = [
  'seam-left',
  'shoulder',
  'tuner-start',
  'tuner-end',
  'free-tip-a',
  'free-tip-b',
  'free-return',
  'seam-right',
]
export function bassSourceNodes(id: string): OutlineNode[] {
  const handle = (control: Point | undefined, p: Point) => {
    if (!control) return null
    const q = bassSourcePoint(control)
    return { dx: q.x - p.x, dy: q.y - p.y }
  }
  return points.map((point, i) => {
    const p = bassSourcePoint(point)
    return {
      id: id + '-' + names[i],
      ...p,
      kind: 'corner',
      inHandle: handle(i ? controls[i - 1]?.[1] : undefined, p),
      outHandle: handle(controls[i]?.[0], p),
      outgoing: controls[i] ? 'cubicBezier' : 'line',
    }
  })
}
