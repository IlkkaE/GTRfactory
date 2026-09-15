import type { OutlineNode, Vec } from '../model/project'

export type Point = { x: number; y: number }

/** A neck side in the canonical body coordinate system: x(y) = a * y + b. */
export type NeckSideLine = { a: number; b: number }

/**
 * The semantic order is deliberate. The source outline may store these three
 * nodes in its winding order, but callers must identify left, fixed centre and
 * right rather than relying on that order.
 */
export type NeckPocketMouth = {
  left: OutlineNode
  center: OutlineNode
  right: OutlineNode
}

export type NeckPocketInput = {
  mouth: NeckPocketMouth
  /** Current protected body boundary order: right → centre → left. */
  mouthWinding: 'right-to-left'
  leftSide: NeckSideLine
  rightSide: NeckSideLine
  /** The virtual horizontal line through the closed end of the pocket. */
  endY: number
  /** Total widening/narrowing of the pocket; each side receives half. */
  fitAllowanceMm: number
  /** One shared true circular radius for both closed-end corners. */
  radiusMm: number
}

export type NeckPocketGeometry = {
  mouth: NeckPocketMouth
  adjustedLeftSide: NeckSideLine
  adjustedRightSide: NeckSideLine
  leftCorner: Point
  rightCorner: Point
  leftSideTangent: Point
  leftEndTangent: Point
  rightEndTangent: Point
  rightSideTangent: Point
  maxRadiusMm: number
  radiusMm: number
  /** An open U: left mouth → left side → end → right side → right mouth. */
  pathD: string
}

const EPSILON = 1e-9

const xAt = (line: NeckSideLine, y: number) => line.a * y + line.b
const length = (vector: Point) => Math.hypot(vector.x, vector.y)
const subtract = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y })
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y })
const multiply = (vector: Point, scalar: number): Point => ({
  x: vector.x * scalar,
  y: vector.y * scalar,
})

function assertFinite(name: string, value: number) {
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number.`)
}

function assertNode(name: string, node: OutlineNode) {
  assertFinite(`${name}.x`, node.x)
  assertFinite(`${name}.y`, node.y)
  for (const [handleName, handle] of [
    ['inHandle', node.inHandle],
    ['outHandle', node.outHandle],
  ] as const) {
    if (handle !== null && (!Number.isFinite(handle.dx) || !Number.isFinite(handle.dy))) {
      throw new Error(`${name}.${handleName} contains an invalid coordinate.`)
    }
  }
}

function scaledHandle(handle: Vec | null, scaleX: number): Vec | null {
  return handle === null ? null : { dx: handle.dx * scaleX, dy: handle.dy }
}

function pointOnSide(line: NeckSideLine, y: number): Point {
  return { x: xAt(line, y), y }
}

function cubicAt(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const oneMinusT = 1 - t
  return {
    x:
      oneMinusT ** 3 * p0.x +
      3 * oneMinusT ** 2 * t * p1.x +
      3 * oneMinusT * t ** 2 * p2.x +
      t ** 3 * p3.x,
    y:
      oneMinusT ** 3 * p0.y +
      3 * oneMinusT ** 2 * t * p1.y +
      3 * oneMinusT * t ** 2 * p2.y +
      t ** 3 * p3.y,
  }
}

function validateFittedMouth(
  mouth: NeckPocketMouth,
  leftLine: NeckSideLine,
  rightLine: NeckSideLine,
) {
  const { left, center, right } = mouth
  if (!right.outHandle || !center.inHandle || !center.outHandle || !left.inHandle) {
    throw new Error('Both halves of the neck-pocket mouth must be cubic Bézier segments.')
  }
  const halves: Array<{
    name: string
    points: [Point, Point, Point, Point]
    side: NeckSideLine
    direction: 'left' | 'right'
  }> = [
    {
      name: 'right',
      points: [
        right,
        { x: right.x + right.outHandle.dx, y: right.y + right.outHandle.dy },
        { x: center.x + center.inHandle.dx, y: center.y + center.inHandle.dy },
        center,
      ],
      side: rightLine,
      direction: 'right',
    },
    {
      name: 'left',
      points: [
        center,
        { x: center.x + center.outHandle.dx, y: center.y + center.outHandle.dy },
        { x: left.x + left.inHandle.dx, y: left.y + left.inHandle.dy },
        left,
      ],
      side: leftLine,
      direction: 'left',
    },
  ]
  for (const half of halves) {
    let previousX = half.points[0].x
    for (let sample = 1; sample <= 32; sample += 1) {
      const point = cubicAt(...half.points, sample / 32)
      const sideX = xAt(half.side, point.y)
      if (
        (half.direction === 'left' &&
          (point.x > previousX + EPSILON || point.x < sideX - EPSILON)) ||
        (half.direction === 'right' && (point.x > previousX + EPSILON || point.x > sideX + EPSILON))
      ) {
        throw new Error(
          `The neck pocket's ${half.name} the mouth curve folds or crosses the centre reference.`,
        )
      }
      previousX = point.x
    }
  }
}

function sideUnit(line: NeckSideLine): Point {
  const magnitude = Math.hypot(line.a, 1)
  return { x: line.a / magnitude, y: 1 / magnitude }
}

function tangentFactor(rayA: Point, rayB: Point): number {
  const cosine = Math.max(-1, Math.min(1, rayA.x * rayB.x + rayA.y * rayB.y))
  const angle = Math.acos(cosine)
  if (angle <= EPSILON || Math.PI - angle <= EPSILON) {
    throw new Error('The neck-pocket side and closed-end line do not form a roundable corner.')
  }
  return 1 / Math.tan(angle / 2)
}

function scaleMouth(
  mouth: NeckPocketMouth,
  leftLine: NeckSideLine,
  rightLine: NeckSideLine,
): NeckPocketMouth {
  const { left, center, right } = mouth
  const targetLeftX = xAt(leftLine, left.y)
  const targetRightX = xAt(rightLine, right.y)
  const leftDenominator = left.x - center.x
  const rightDenominator = right.x - center.x
  if (leftDenominator >= -EPSILON || rightDenominator <= EPSILON) {
    throw new Error(
      'The neck-pocket mouth side nodes must be on opposite sides of the centre reference.',
    )
  }
  const leftScale = (targetLeftX - center.x) / leftDenominator
  const rightScale = (targetRightX - center.x) / rightDenominator
  if (
    !Number.isFinite(leftScale) ||
    !Number.isFinite(rightScale) ||
    leftScale <= EPSILON ||
    rightScale <= EPSILON
  ) {
    throw new Error(
      'Fitting the neck-pocket mouth would fold its curve across the centre reference.',
    )
  }

  // Only the handles that belong to the two locked mouth segments move. The
  // endpoint handles toward the editable body are intentionally preserved.
  return {
    left: {
      ...structuredClone(left),
      x: targetLeftX,
      inHandle: scaledHandle(left.inHandle, leftScale),
    },
    center: {
      ...structuredClone(center),
      inHandle: scaledHandle(center.inHandle, rightScale),
      outHandle: scaledHandle(center.outHandle, leftScale),
    },
    right: {
      ...structuredClone(right),
      x: targetRightX,
      outHandle: scaledHandle(right.outHandle, rightScale),
    },
  }
}

/**
 * Creates the pocket cut geometry without changing the body outline. The
 * centre mouth node is copied byte-for-byte in its coordinate fields.
 */
export function deriveNeckPocket(input: NeckPocketInput): NeckPocketGeometry {
  const { mouth, mouthWinding, leftSide, rightSide, endY, fitAllowanceMm, radiusMm } = input
  if (mouthWinding !== 'right-to-left') {
    throw new Error('The neck-pocket mouth chain must be ordered right → centre → left.')
  }
  assertNode('mouth.left', mouth.left)
  assertNode('mouth.center', mouth.center)
  assertNode('mouth.right', mouth.right)
  for (const [name, line] of [
    ['leftSide', leftSide],
    ['rightSide', rightSide],
  ] as const) {
    assertFinite(`${name}.a`, line.a)
    assertFinite(`${name}.b`, line.b)
  }
  assertFinite('endY', endY)
  assertFinite('fitAllowanceMm', fitAllowanceMm)
  assertFinite('radiusMm', radiusMm)
  if (radiusMm < 0) throw new Error('The corner radius cannot be negative.')

  const adjustedLeftSide = { ...leftSide, b: leftSide.b - fitAllowanceMm / 2 }
  const adjustedRightSide = { ...rightSide, b: rightSide.b + fitAllowanceMm / 2 }
  const fittedMouth = scaleMouth(mouth, adjustedLeftSide, adjustedRightSide)
  const { left, center, right } = fittedMouth
  if (left.x >= center.x - EPSILON || right.x <= center.x + EPSILON) {
    throw new Error('The fitted neck-pocket mouth must not cross the centre reference.')
  }
  validateFittedMouth(fittedMouth, adjustedLeftSide, adjustedRightSide)
  if (endY <= left.y + EPSILON || endY <= right.y + EPSILON) {
    throw new Error("The neck pocket's closed end must be below both mouth points.")
  }

  const leftCorner = pointOnSide(adjustedLeftSide, endY)
  const rightCorner = pointOnSide(adjustedRightSide, endY)
  if (rightCorner.x <= leftCorner.x + EPSILON) {
    throw new Error('The neck-pocket sides intersect before the closed end.')
  }
  // The separation between the two linear sides is linear, so endpoint checks
  // prove they do not cross on their shared interval.
  const sharedStartY = Math.max(left.y, right.y)
  if (xAt(adjustedRightSide, sharedStartY) <= xAt(adjustedLeftSide, sharedStartY) + EPSILON) {
    throw new Error('The neck-pocket sides intersect between the mouth and closed end.')
  }

  const leftUnit = sideUnit(adjustedLeftSide)
  const rightUnit = sideUnit(adjustedRightSide)
  const leftFactor = tangentFactor(multiply(leftUnit, -1), { x: 1, y: 0 })
  const rightFactor = tangentFactor({ x: -1, y: 0 }, multiply(rightUnit, -1))
  const leftSideLength = length(subtract(leftCorner, left))
  const rightSideLength = length(subtract(rightCorner, right))
  const endLength = rightCorner.x - leftCorner.x
  const maxRadiusMm = Math.min(
    leftSideLength / leftFactor,
    rightSideLength / rightFactor,
    endLength / (leftFactor + rightFactor),
  )
  if (radiusMm > maxRadiusMm + EPSILON) {
    throw new Error(
      `Corner radius ${radiusMm} mm exceeds the largest possible radius ${maxRadiusMm} mm.`,
    )
  }

  const leftDistance = radiusMm * leftFactor
  const rightDistance = radiusMm * rightFactor
  const leftSideTangent = add(leftCorner, multiply(leftUnit, -leftDistance))
  const leftEndTangent = { x: leftCorner.x + leftDistance, y: endY }
  const rightEndTangent = { x: rightCorner.x - rightDistance, y: endY }
  const rightSideTangent = add(rightCorner, multiply(rightUnit, -rightDistance))
  const arc = radiusMm > EPSILON ? ` A ${radiusMm} ${radiusMm} 0 0 0` : ''
  const pathD =
    radiusMm > EPSILON
      ? `M ${left.x} ${left.y} L ${leftSideTangent.x} ${leftSideTangent.y}${arc} ${leftEndTangent.x} ${leftEndTangent.y} L ${rightEndTangent.x} ${rightEndTangent.y}${arc} ${rightSideTangent.x} ${rightSideTangent.y} L ${right.x} ${right.y}`
      : `M ${left.x} ${left.y} L ${leftCorner.x} ${leftCorner.y} L ${rightCorner.x} ${rightCorner.y} L ${right.x} ${right.y}`

  return {
    mouth: fittedMouth,
    adjustedLeftSide,
    adjustedRightSide,
    leftCorner,
    rightCorner,
    leftSideTangent,
    leftEndTangent,
    rightEndTangent,
    rightSideTangent,
    maxRadiusMm,
    radiusMm,
    pathD,
  }
}

function cubicPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t
  return {
    x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
  }
}
function bodyPolygon(nodes: OutlineNode[]) {
  const points: Point[] = []
  for (let i = 0; i < nodes.length; i++) {
    const source = nodes[i],
      target = nodes[(i + 1) % nodes.length]
    if (source.outgoing === 'line') {
      points.push({ x: source.x, y: source.y })
      continue
    }
    const p0 = { x: source.x, y: source.y },
      p1 = { x: source.x + (source.outHandle?.dx ?? 0), y: source.y + (source.outHandle?.dy ?? 0) },
      p2 = { x: target.x + (target.inHandle?.dx ?? 0), y: target.y + (target.inHandle?.dy ?? 0) },
      p3 = { x: target.x, y: target.y }
    for (let sample = 0; sample < 24; sample++) points.push(cubicPoint(p0, p1, p2, p3, sample / 24))
  }
  return points
}
function containsPoint(polygon: Point[], point: Point) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j]
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside
  }
  return inside
}
/** Draft-only warning: a valid routing shape can still leave a user-shaped body. */
export function pocketContainmentWarning(
  nodes: OutlineNode[],
  pocket: NeckPocketGeometry,
): string | null {
  const polygon = bodyPolygon(nodes),
    samples: Point[] = []
  const addLine = (from: Point, to: Point) => {
    for (let i = 1; i < 24; i++)
      samples.push({
        x: from.x + ((to.x - from.x) * i) / 24,
        y: from.y + ((to.y - from.y) * i) / 24,
      })
  }
  addLine(pocket.mouth.left, pocket.leftSideTangent)
  addLine(pocket.leftEndTangent, pocket.rightEndTangent)
  addLine(pocket.rightSideTangent, pocket.mouth.right)
  // The rounded corners stay between their tangent lines; sampling their
  // endpoints plus all straight portions catches an exit from the body without
  // turning this draft warning into a manufacturing boolean operation.
  for (const point of [
    ...samples,
    pocket.leftSideTangent,
    pocket.leftEndTangent,
    pocket.rightEndTangent,
    pocket.rightSideTangent,
  ])
    if (!containsPoint(polygon, point))
      return 'The neck pocket extends outside the body. Check the pocket dimensions or body shape.'
  return null
}
