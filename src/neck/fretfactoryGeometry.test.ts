import { describe, expect, it } from 'vitest'
import fixtures from './fretfactory-reference-fixtures.json'
import oracle from './neck-placement-oracle.json'
import { calculateNeck, transformPoint, translatedSides } from './fretfactoryGeometry'

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 10)
describe('pinned FretFactory calculation adapter', () => {
  it('matches the five independently generated source fixtures', () => {
    for (const fixture of fixtures.cases) {
      const n = calculateNeck(fixture.params, 10)
      for (const [index, row] of fixture.rows.entries())
        for (const [pointIndex, point] of row.pts.entries()) {
          close(n.frets[index].points[pointIndex].x, point.x)
          close(n.frets[index].points[pointIndex].y, point.y)
        }
      for (const [index, point] of fixture.nb.nut.pts.entries()) {
        close(n.nut[index].x, point.x)
        close(n.nut[index].y, point.y)
      }
      for (const [index, point] of fixture.nb.bridge.pts.entries()) {
        close(n.bridge[index].x, point.x)
        close(n.bridge[index].y, point.y)
      }
    }
  })
  it('keeps heel and fretboard ends independent without changing fret geometry', () => {
    const p = fixtures.cases[0].params,
      a = calculateNeck(p, 10, 16.35),
      b = calculateNeck(p, 12, 16.35)
    expect(a.frets).toEqual(b.frets)
    expect(a.heelEndY).not.toBe(b.heelEndY)
    expect(a.fretboardEndY).toBe(b.fretboardEndY)
    expect(() => calculateNeck(p, 16.35, 16.35)).toThrow('greater')
  })
  it('uses PCHIP x=0 placement and affine side translation', () => {
    for (const item of oracle) {
      const source = fixtures.cases.find((f) => f.name === item.name)!
      const n = calculateNeck(source.params, 10)
      const placement = { joinFret: item.joinFret, offsetMm: item.offsetMm },
        datum = { x: 0.0008800000000235286, y: 0 }
      const sides = translatedSides(n, placement, datum)
      close(sides.left.b, item.left.b)
      close(sides.right.b, item.right.b)
      const nut = transformPoint(n.nut[0], placement, n, datum)
      close(nut.x, item.nut[0].x)
      close(nut.y, item.nut[0].y)
      close(nut.x, sides.left.a * nut.y + sides.left.b)
    }
  })
})
