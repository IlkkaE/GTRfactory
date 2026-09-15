import { describe, expect, it } from 'vitest'
import hulls from './source-hulls.json' with { type: 'json' }
import {
  PICKUP_PROFILES,
  bridgeCenterY,
  firstPickupPosition,
  pickupPlacementError,
  pickupProfile,
  polygonContains,
  polygonFits,
  polygonsOverlap,
} from './profiles'
import { useAppStore } from '../store'
import { transformPoint } from '../neck/fretfactoryGeometry'
import type { Point } from '../geometry/outline'
const fixture = () => {
  const d = structuredClone(useAppStore.getState().document)
  d.pickupCavities = []
  return d
}
const cavity = (id: string, y: number, profileId = 'sh12-humbucker') => ({
  id,
  centerYmm: y,
  profileId,
  profileVersion: 1,
})
const move = (points: Point[], y: number) => points.map((p) => ({ x: p.x, y: p.y + y }))
function pointToSegment(p: Point, a: Point, b: Point) {
  const ux = b.x - a.x,
    uy = b.y - a.y,
    t = Math.max(0, Math.min(1, ((p.x - a.x) * ux + (p.y - a.y) * uy) / (ux * ux + uy * uy)))
  return Math.hypot(p.x - a.x - t * ux, p.y - a.y - t * uy)
}
describe('pickup profiles and full outline placement', () => {
  it('retains physical dimensions and all twelve SH12 R3 corners', () => {
    const sh = pickupProfile('sh12-humbucker', 1)!
    expect(sh.path.match(/ A 3 3 /g) || []).toHaveLength(12)
    expect(sh.widthMm).toBeCloseTo(86, 7)
    expect(sh.lengthMm).toBeCloseTo(40, 7)
    const p90 = pickupProfile('sp90-sgz-p90', 1)!
    expect(p90.widthMm).toBeCloseTo(87.5, 7)
    expect(p90.lengthMm).toBeCloseTo(36.5, 7)
    expect(p90.path.match(/ A 7.35 7.35 /g) || []).toHaveLength(4)
    expect(PICKUP_PROFILES).toHaveLength(9)
  })
  it('registers the four named 7/8-string design envelopes with source dimensions and rounded corners', () => {
    const expected = [
      ['sd-hb7-uncovered', 7, 99.98, 41.5092, 2.5, 12],
      ['sd-hb8-uncovered', 8, 107.092, 41.814, 2.5, 12],
      ['emg-707-soapbar', 7, 90.9, 40.1, 4.175, 4],
      ['emg-808-soapbar', 8, 103.6, 40.1, 4.175, 4],
    ] as const
    for (const [id, strings, width, length, radius, corners] of expected) {
      const p = pickupProfile(id, 1)!
      expect(p.stringCount).toBe(strings)
      expect(p.widthMm).toBeCloseTo(width, 4)
      expect(p.lengthMm).toBeCloseTo(length, 4)
      expect(p.path.match(new RegExp(` A ${radius} ${radius} `, 'g')) || []).toHaveLength(corners)
      expect(p.path.endsWith(' Z')).toBe(true)
      expect(p.samples.length).toBeGreaterThan(corners)
    }
  })
  it('contains each source body and mounting-ear envelope inside the new SD/EMG profiles', () => {
    const envelopes = [
      [
        'sd-hb7-uncovered',
        [
          [-39.0017, 39.0017, -17.7546, 17.7546],
          [-46.99, 46.99, -6.5024, 6.5024],
        ],
      ],
      [
        'sd-hb8-uncovered',
        [
          [-45.4152, 45.4152, -17.907, 17.907],
          [-50.546, 50.546, -6.985, 6.985],
        ],
      ],
    ] as const
    for (const [id, boxes] of envelopes) {
      const route = pickupProfile(id, 1)!.samples
      for (const [minX, maxX, minY, maxY] of boxes)
        for (const point of [
          { x: minX, y: minY },
          { x: maxX, y: minY },
          { x: maxX, y: maxY },
          { x: minX, y: maxY },
        ])
          expect(polygonContains(route, point), id).toBe(true)
    }
    for (const [id, width] of [
      ['emg-707-soapbar', 88.9],
      ['emg-808-soapbar', 101.6],
    ] as const) {
      const route = pickupProfile(id, 1)!.samples,
        r = 3.175,
        half = width / 2,
        halfY = 19.05
      for (const point of [
        { x: -half + r, y: -halfY },
        { x: half - r, y: -halfY },
        { x: half, y: -halfY + r },
        { x: half, y: halfY - r },
        { x: half - r, y: halfY },
        { x: -half + r, y: halfY },
        { x: -half, y: halfY - r },
        { x: -half, y: -halfY + r },
        ...[-1, 1].flatMap((sx) =>
          [-1, 1].map((sy) => ({
            x: sx * (half - r) + sx * r * Math.SQRT1_2,
            y: sy * (halfY - r) + sy * r * Math.SQRT1_2,
          })),
        ),
      ])
        expect(polygonContains(route, point), id).toBe(true)
    }
  })
  it('contains the complete independent SH12 part envelopes after corner rounding', () => {
    const route = pickupProfile('sh12-humbucker', 1)!.samples
    for (const [xmin, xmax, ymin, ymax] of [
      [-34.29, 34.29, -18.2245, 18.2245],
      [-42.164, 42.164, -6.35, 6.35],
    ])
      for (let i = 0; i <= 100; i++) {
        const x = xmin + ((xmax - xmin) * i) / 100,
          y = ymin + ((ymax - ymin) * i) / 100
        for (const p of [
          { x, y: ymin },
          { x, y: ymax },
          { x: xmin, y },
          { x: xmax, y },
        ])
          expect(polygonContains(route, p)).toBe(true)
      }
  })
  it('preserves the full 3 mm circular allowance of source hulls including rotated Tele', () => {
    for (const [key, id, deg] of [
      ['ssl1', 'ssl1-strat', 0],
      ['str1', 'str1-tele-neck', 0],
      ['stl1b', 'stl1b-tele-bridge', 17],
    ] as const) {
      const model = pickupProfile(id, 1)!,
        angle = (deg * Math.PI) / 180
      for (const q of hulls[key].sourceHullMm) {
        const p = {
          x: q.x * Math.cos(angle) - q.y * Math.sin(angle),
          y: q.x * Math.sin(angle) + q.y * Math.cos(angle),
        }
        expect(polygonContains(model.samples, p)).toBe(true)
        let distance = Infinity
        for (let i = 0; i < model.samples.length; i++)
          distance = Math.min(
            distance,
            pointToSegment(p, model.samples[i], model.samples[(i + 1) % model.samples.length]),
          )
        expect(distance).toBeGreaterThanOrEqual(2.988)
      }
    }
  })
  it('accepts normal containment but detects an inward notch crossing between route vertices', () => {
    const route = move(pickupProfile('sp90-sgz-p90', 1)!.samples, 50),
      rectangle = [
        { x: -60, y: 0 },
        { x: 60, y: 0 },
        { x: 60, y: 100 },
        { x: -60, y: 100 },
      ]
    expect(polygonFits(rectangle, route)).toBe(true)
    const notch = [
      { x: -60, y: 0 },
      { x: 12, y: 0 },
      { x: 12, y: 55 },
      { x: 13, y: 55 },
      { x: 13, y: 0 },
      { x: 60, y: 0 },
      { x: 60, y: 100 },
      { x: -60, y: 100 },
    ]
    expect(route.every((p) => polygonContains(notch, p))).toBe(true)
    expect(polygonFits(notch, route)).toBe(false)
  })
  it('does not confuse overlapping bounding boxes with overlapping rotated cavities', () => {
    const p = pickupProfile('stl1b-tele-bridge', 1)!
    expect(polygonsOverlap(p.samples, p.samples)).toBe(true)
    let found = false
    for (let dy = p.lengthMm - 0.1; dy > p.lengthMm - 10; dy -= 0.1)
      if (!polygonsOverlap(p.samples, move(p.samples, dy))) {
        found = true
        break
      }
    expect(found).toBe(true)
  })
  it('finds a real position for each complete profile in the default guitar', () => {
    const d = fixture()
    for (const p of PICKUP_PROFILES) {
      const y = firstPickupPosition(d, p.id, p.version)
      expect(y, p.name).not.toBeNull()
      expect(pickupPlacementError(d, cavity('test', y!, p.id)), p.name).toBeNull()
    }
  })
  it('inserts multiple non-overlapping cavities and returns no-fit when the available intervals are full', () => {
    const d = fixture()
    for (let i = 0; i < 10; i++) {
      const y = firstPickupPosition(d)
      if (y === null) break
      const c = cavity('p' + i, y)
      expect(pickupPlacementError(d, c)).toBeNull()
      d.pickupCavities.push(c)
    }
    expect(d.pickupCavities.length).toBeGreaterThanOrEqual(2)
    expect(d.pickupCavities.length).toBeLessThan(10)
    expect(firstPickupPosition(d)).toBeNull()
    for (const c of d.pickupCavities) expect(pickupPlacementError(d, c, c.id)).toBeNull()
  })
  it('computes the center from the PCHIP cubic rather than linear interpolation', () => {
    const d = fixture(),
      n = d.neck!,
      datum = d.body.outline.nodes.find((v) => v.id === d.body.neckJointBoundary!.anchorIds[1])!
    n.snapshot.bridge = [
      { x: -30, y: 100 },
      { x: -10, y: 125 },
      { x: 10, y: 120 },
      { x: 30, y: 90 },
    ]
    const t = (10 - datum.x) / 20,
      y =
        (2 * t ** 3 - 3 * t * t + 1) * 125 +
        (-2 * t ** 3 + 3 * t * t) * 120 +
        (t ** 3 - t * t) * 20 * (-3 / 7)
    const expected = transformPoint({ x: -datum.x, y }, n.placement, n.snapshot, datum).y
    expect(bridgeCenterY(d)).toBeCloseTo(expected, 9)
    expect(
      Math.abs(
        bridgeCenterY(d)! - transformPoint({ x: 0, y: 122.5 }, n.placement, n.snapshot, datum).y,
      ),
    ).toBeGreaterThan(1)
  })
  it('keeps wider mounting ears legal beyond the drawn string span and rejects crossing the bridge', () => {
    const d = fixture(),
      by = bridgeCenterY(d)!
    expect(pickupPlacementError(d, cavity('good', by - 50))).toBeNull()
    expect(pickupPlacementError(d, cavity('bad', by - 10))).toMatch(/bridge/)
    const y = firstPickupPosition(d, 'sh12-humbucker', 1, 50)
    expect(y).toBeCloseTo(by - 50, 8)
  })
})
