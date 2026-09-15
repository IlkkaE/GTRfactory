import { describe, expect, it } from 'vitest'
import { pathD } from '../geometry/outline'
import { createStarterDocument, type OutlineNode } from '../model/project'
import { deriveNeckDocument } from '../neck/neckDocument'
import {
  backTemplateGeometry,
  frontTemplateGeometry,
  pocketTemplateGeometry,
  serializeTemplatePath,
  validateTemplateContour,
} from './templateGeometry'

function withNeck() {
  return deriveNeckDocument(createStarterDocument(), { kind: 'fresh' })!
}

function contiguous(
  segments: NonNullable<ReturnType<typeof pocketTemplateGeometry>['cut']>['segments'],
) {
  return segments.every((segment, index) => {
    const next = segments[(index + 1) % segments.length]
    return Math.hypot(segment.to.x - next.from.x, segment.to.y - next.from.y) < 1e-6
  })
}

describe('template geometry', () => {
  it('keeps the front source exact and mirrors every back coordinate', () => {
    const document = createStarterDocument()
    const front = frontTemplateGeometry(document.body.outline.nodes)
    const back = backTemplateGeometry(document.body.outline.nodes)
    expect(front.cutPath).toBe(pathD(document.body.outline.nodes))
    expect(back.cutPath).toBe(pathD(document.body.outline.nodes, true))
    expect(backTemplateGeometry(document.body.outline.nodes).cutPath).toBe(back.cutPath)
  })

  it('fails closed for invalid or near-touch front and back outlines, including empty input', () => {
    const node = (id: string, x: number, y: number): OutlineNode => ({
      id,
      x,
      y,
      kind: 'corner',
      outgoing: 'line',
      inHandle: null,
      outHandle: null,
    })
    const crossed = [node('a', 0, 0), node('b', 10, 10), node('c', 0, 10), node('d', 10, 0)]
    const front = frontTemplateGeometry(crossed)
    const back = backTemplateGeometry(crossed)
    expect(front).toMatchObject({ kind: 'front', cut: null, cutPath: null, bounds: null })
    expect(front.diagnostic).toMatchObject({ class: 'invalid', code: 'self-intersection' })
    expect(back).toMatchObject({ kind: 'back', cut: null, cutPath: null, bounds: null })
    expect(back.diagnostic).toMatchObject({ class: 'invalid', code: 'self-intersection' })

    const nearTouch = [
      node('a', 0, 0),
      node('b', 10, 0),
      node('c', 10, 10),
      node('d', 5, 10),
      node('e', 5, 0.001),
      node('f', 4, 0.001),
      node('g', 4, 10),
      node('h', 0, 10),
    ]
    expect(frontTemplateGeometry(nearTouch).diagnostic).toMatchObject({
      class: 'unsupported',
      code: 'topology-near-touch',
    })
    expect(frontTemplateGeometry([])).toMatchObject({
      kind: 'front',
      cut: null,
      cutPath: null,
      bounds: null,
      diagnostic: { class: 'invalid', code: 'body-outline-empty' },
    })
  })
  it('builds one closed automatic pocket contour with an independent default cut', () => {
    const document = withNeck()
    const before = structuredClone(document)
    const result = pocketTemplateGeometry(document)
    expect(result.diagnostic).toBeNull()
    expect(result.cut).not.toBeNull()
    expect(result.cut!.closed).toBe(true)
    expect(contiguous(result.cut!.segments)).toBe(true)
    expect(
      result.cut!.segments.filter((segment) => segment.role === 'template-bottom'),
    ).toHaveLength(1)
    expect(result.cut!.segments.some((segment) => segment.type === 'circularArc')).toBe(true)
    expect(result.pocketMouth).toHaveLength(2)
    expect(result.pocketMouth!.every((segment) => segment.type === 'cubicBezier')).toBe(true)
    expect(
      result.cut!.segments.some((segment) =>
        result.pocketMouth!.some(
          (mouth) =>
            segment.from.x === mouth.from.x &&
            segment.from.y === mouth.from.y &&
            segment.to.x === mouth.to.x &&
            segment.to.y === mouth.to.y,
        ),
      ),
    ).toBe(false)
    expect(result.cutY).toBeCloseTo(
      Math.max(
        ...result
          .cut!.segments.filter((segment) => segment.role === 'neck-pocket')
          .flatMap((segment) => [segment.from.y, segment.to.y]),
      ) + 20,
      6,
    )
    expect(document).toEqual(before)
  })

  it('changes only the derived lower cut when an explicit cutY is requested', () => {
    const document = withNeck()
    const normal = pocketTemplateGeometry(document)
    const changed = pocketTemplateGeometry(document, { cutY: normal.cutY! + 10 })
    expect(changed.diagnostic).toBeNull()
    expect(changed.cutY).toBeCloseTo(normal.cutY! + 10, 10)
    expect(changed.cutPath).not.toBe(normal.cutPath)
  })

  it('fails closed without a neck and keeps a stable Finnish diagnostic', () => {
    const result = pocketTemplateGeometry(createStarterDocument())
    expect(result.cut).toBeNull()
    expect(result.diagnostic).toEqual({
      class: 'unsupported',
      code: 'neck-unavailable',
      message: 'No neck has been created.',
    })
  })

  it('keeps exact De Casteljau sub-curves when a cubic outer chain crosses twice', () => {
    const document = withNeck()
    const original = document.body.outline.nodes
    const source = (id: string) => original.find((node) => node.id === id)!
    const node = (
      id: string,
      x: number,
      y: number,
      outgoing: 'line' | 'cubicBezier',
      outHandle: OutlineNode['outHandle'] = null,
      inHandle: OutlineNode['inHandle'] = null,
    ): OutlineNode => ({ id, x, y, kind: 'corner', outgoing, outHandle, inHandle })
    document.body.outline.nodes = [
      node(
        'starter-21',
        source('starter-21').x,
        source('starter-21').y,
        'cubicBezier',
        source('starter-21').outHandle,
        source('starter-21').inHandle,
      ),
      node(
        'starter-01',
        source('starter-01').x,
        0,
        'cubicBezier',
        source('starter-01').outHandle,
        source('starter-01').inHandle,
      ),
      node(
        'starter-02',
        source('starter-02').x,
        source('starter-02').y,
        'line',
        null,
        source('starter-02').inHandle,
      ),
      node('left-top', -100, 0, 'cubicBezier', { dx: -40, dy: 0 }),
      node('left-bottom', -100, 200, 'line', null, { dx: -40, dy: 0 }),
      node('right-bottom', 100, 200, 'cubicBezier', { dx: 40, dy: 0 }),
      node('right-top', 100, 0, 'line', null, { dx: 40, dy: 0 }),
    ]
    const result = pocketTemplateGeometry(document, { cutY: 100 })
    expect(result.diagnostic).toBeNull()
    const cubics = result.cut!.segments.filter((segment) => segment.type === 'cubicBezier')
    expect(cubics[0]).toMatchObject({
      from: { x: -100, y: 0 },
      control1: { x: -120, y: 0 },
      control2: { x: -130, y: 50 },
      to: { x: -130, y: 100 },
    })
    expect(cubics.at(-1)).toMatchObject({
      from: { x: 130, y: 100 },
      control1: { x: 130, y: 50 },
      control2: { x: 120, y: 0 },
      to: { x: 100, y: 0 },
    })
  })

  it('rejects a cut which touches the pocket and serializes no open contour', () => {
    const document = withNeck()
    const result = pocketTemplateGeometry(document, { cutY: 0 })
    expect(result.cut).toBeNull()
    expect(result.diagnostic?.code).toBe('cut-enters-pocket')
    expect(serializeTemplatePath(result.cut)).toBeNull()
  })

  it('rejects an extra adjacent cubic crossing and collinear backtracking', () => {
    const cubicCross = {
      start: { x: 0, y: 0 },
      closed: true as const,
      segments: [
        {
          type: 'cubicBezier' as const,
          role: 'body-outline' as const,
          from: { x: 0, y: 0 },
          control1: { x: 30, y: 0 },
          control2: { x: 30, y: 10 },
          to: { x: 10, y: 10 },
        },
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: 10, y: 10 },
          to: { x: 10, y: -5 },
        },
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: 10, y: -5 },
          to: { x: -5, y: -5 },
        },
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: -5, y: -5 },
          to: { x: 0, y: 0 },
        },
      ],
    }
    const backtrack = {
      start: { x: 0, y: 0 },
      closed: true as const,
      segments: [
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: 0, y: 0 },
          to: { x: 10, y: 0 },
        },
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: 10, y: 0 },
          to: { x: 5, y: 0 },
        },
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: 5, y: 0 },
          to: { x: 5, y: 10 },
        },
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: 5, y: 10 },
          to: { x: 0, y: 10 },
        },
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: 0, y: 10 },
          to: { x: 0, y: 0 },
        },
      ],
    }
    expect(validateTemplateContour(cubicCross)?.class).toBe('invalid')
    expect(validateTemplateContour(backtrack)).toMatchObject({
      class: 'invalid',
      code: 'self-overlap',
    })
  })

  it('does not treat a circular arc as its chord and rejects a near touch conservatively', () => {
    const contour = (lineY: number) => ({
      start: { x: 10, y: 0 },
      closed: true as const,
      segments: [
        {
          type: 'circularArc' as const,
          role: 'neck-pocket' as const,
          from: { x: 10, y: 0 },
          to: { x: 0, y: 10 },
          radiusMm: 10,
          sweep: 1 as const,
        },
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: 0, y: 10 },
          to: { x: -1, y: lineY },
        },
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: -1, y: lineY },
          to: { x: 11, y: lineY },
        },
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: 11, y: lineY },
          to: { x: 10, y: 0 },
        },
      ],
    })
    expect(validateTemplateContour(contour(5))?.class).toBe('invalid')
    expect(validateTemplateContour(contour(10.001))).toMatchObject({
      class: 'unsupported',
      code: 'topology-near-touch',
    })
  })

  it('fails closed when cubic subdivision exceeds the bounded accuracy budget', () => {
    const contour = {
      start: { x: 0, y: 0 },
      closed: true as const,
      segments: [
        {
          type: 'cubicBezier' as const,
          role: 'body-outline' as const,
          from: { x: 0, y: 0 },
          control1: { x: 0, y: 1000000 },
          control2: { x: 1, y: -1000000 },
          to: { x: 1, y: 0 },
        },
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: 1, y: 0 },
          to: { x: 1, y: -1 },
        },
        {
          type: 'line' as const,
          role: 'body-outline' as const,
          from: { x: 1, y: -1 },
          to: { x: 0, y: 0 },
        },
      ],
    }
    expect(validateTemplateContour(contour)).toMatchObject({
      class: 'unsupported',
      code: 'topology-depth-limit',
    })
  })
})
