import type { ProjectDocument } from '../model/project'
import type { Point } from '../geometry/outline'
import { bassPosts } from './bass'
import { bassSourceNodes, bassSourcePoint } from './bassSource'

const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y })
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y })
const mul = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k })
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y
const unit = (p: Point) => mul(p, 1 / Math.hypot(p.x, p.y))
const source = bassSourceNodes('source'),
  A = source[2],
  B = source[3]
const e = unit(sub(B, A)),
  n = { x: -e.y, y: e.x }
const C0 = bassSourcePoint({ x: 63.913595, y: 40.823654 })
const C3 = bassSourcePoint({ x: 202.55526, y: 75.043097 })
const sourceSpan = dot(sub(C3, C0), e)
const margin = dot(sub(C0, A), e),
  offset = dot(sub(C0, A), n)

/** Affine outline transform; tuner hardware remains unscaled in world millimetres. */
export function bassOutlineTransform(document: ProjectDocument) {
  const posts = bassPosts(document)
  if (posts.length < 2) throw new Error('A bass outline requires its solved tuner row.')
  const E = posts[0].e,
    N = { x: -E.y, y: E.x }
  const k = dot(sub(posts.at(-1)!, posts[0]), E) / sourceSpan
  const origin = sub(sub(posts[0], mul(E, margin * k)), mul(N, offset))
  const delta = (p: Point) => add(mul(E, dot(p, e) * k), mul(N, dot(p, n)))
  const inverseDelta = (p: Point) => add(mul(e, dot(p, E) / k), mul(n, dot(p, N)))
  return {
    delta,
    inverseDelta,
    point: (p: Point) => add(origin, delta(sub(p, A))),
    inversePoint: (p: Point) => add(A, inverseDelta(sub(p, origin))),
    edgeLengthMm: Math.hypot(B.x - A.x, B.y - A.y) * k,
  }
}
