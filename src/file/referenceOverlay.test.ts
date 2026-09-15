import { describe, expect, it } from 'vitest'
import {
  centerReference,
  MAX_REFERENCE_PIXELS,
  rasterHeader,
  referenceHeight,
  referenceTransform,
  sourceBounds,
  validRasterHeader,
  type ReferenceOverlay,
} from './referenceOverlay'
import { createStarterDocument } from '../model/project'

const png = (width: number, height: number) =>
  new Uint8Array([
    137,
    80,
    78,
    71,
    13,
    10,
    26,
    10,
    0,
    0,
    0,
    13,
    73,
    72,
    68,
    82,
    width >>> 24,
    (width >>> 16) & 255,
    (width >>> 8) & 255,
    width & 255,
    height >>> 24,
    (height >>> 16) & 255,
    (height >>> 8) & 255,
    height & 255,
  ])
describe('reference overlay safeguards and transforms', () => {
  it('recognizes PNG dimensions before display and rejects over-limit rasters', () => {
    expect(rasterHeader(png(1600, 900))).toEqual({ kind: 'png', width: 1600, height: 900 })
    expect(() => validRasterHeader({ kind: 'png', width: 8193, height: 1 })).toThrow(
      'pixel dimensions',
    )
    expect(() =>
      validRasterHeader({
        kind: 'jpeg',
        width: 5000,
        height: Math.ceil(MAX_REFERENCE_PIXELS / 5000) + 1,
      }),
    ).toThrow('pixel dimensions')
    expect(() => rasterHeader(new Uint8Array([1, 2, 3]))).toThrow('PNG')
  })
  it('keeps a project source in its mm coordinates until a user moves or scales it', () => {
    const source = { kind: 'project' as const, nodes: createStarterDocument().body.outline.nodes }
    const reference: ReferenceOverlay = {
      name: 'idea.gtrfactory',
      source,
      visible: true,
      opacity: 0.38,
      x: 0,
      y: 0,
      scale: 2,
    }
    expect(referenceTransform(reference)).toContain('translate(0 0)')
    expect(referenceHeight(reference)).toBeCloseTo(sourceBounds(source).height * 2, 8)
    const target = { minX: -100, maxX: 100, minY: 0, maxY: 300, width: 200, height: 300 }
    const centered = centerReference(reference, target)
    const sourceCenter = (sourceBounds(source).minX + sourceBounds(source).maxX) / 2
    expect(centered.x).toBeCloseTo(-sourceCenter, 8)
    expect(centered.y).not.toBe(reference.y)
  })
})
