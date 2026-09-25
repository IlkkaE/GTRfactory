import { describe, it, expect } from 'vitest'
import { calculateNeck, DEFAULT_NECK } from '../neck/fretfactoryGeometry'
import { createDefaultInlayDocument, createPresetShape } from './inlayPresets'
import { computeInlays } from './inlayGeometry'
import type { NeckDocument, OutlineNode } from '../model/project'

function createMockNeck(frets = 22): NeckDocument {
  const params = { ...DEFAULT_NECK, frets }
  const snapshot = calculateNeck(params, 4.0)
  const centerNode: OutlineNode = {
    id: 'center-datum',
    x: 0,
    y: 150,
    kind: 'corner',
    inHandle: null,
    outHandle: null,
    outgoing: 'line',
  }
  return {
    calculationVersion: 'fretfactory-89f94c0e',
    params,
    placement: { joinFret: 17, offsetMm: 0 },
    end: { endMarginMm: 4.0, fretboardEndMarginMm: 10.35, radiusMm: 0, fitAllowanceMm: 0 },
    snapshot,
    headstock: { version: 3, activeTemplateId: 'inline', variants: {} as any },
    physicalProfile: null,
    referenceBoundaryNodes: {
      left: { ...centerNode, id: 'left-node', x: -28 },
      center: centerNode,
      right: { ...centerNode, id: 'right-node', x: 28 },
    },
  }
}

describe('inlayGeometry', () => {
  it('returns empty array when inlays are disabled', () => {
    const neck = createMockNeck()
    const inlays = createDefaultInlayDocument()
    inlays.enabled = false
    const placed = computeInlays(neck, inlays)
    expect(placed).toEqual([])
  })

  it('places classic dot inlays with single and double frets in fixedMm mode', () => {
    const neck = createMockNeck()
    const inlays = createDefaultInlayDocument()
    inlays.scalingMode = 'fixedMm'
    inlays.fixedDiameterMm = 6.0
    inlays.doubleInlaySpacingMm = 18.0

    const placed = computeInlays(neck, inlays)
    // CLASSIC_DOT_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21] (fret 24 is filtered out as maxFrets is 22)
    // Single frets: 3, 5, 7, 9, 15, 17, 19, 21 (8 frets)
    // Double frets: 12 (1 fret -> 2 inlays)
    // Total inlays = 8 + 2 = 10
    expect(placed.length).toBe(10)

    // Check single fret (e.g. fret 3)
    const fret3 = placed.filter((p) => p.fretIndex === 3)
    expect(fret3.length).toBe(1)
    expect(fret3[0].isDouble).toBe(false)
    expect(fret3[0].centerMm.x).toBeCloseTo(0, 3)
    expect(fret3[0].widthMm).toBe(6.0)
    expect(fret3[0].heightMm).toBe(6.0)
    expect(fret3[0].nodes.length).toBe(4) // Circle preset has 4 nodes

    // Check double fret (fret 12)
    const fret12 = placed.filter((p) => p.fretIndex === 12)
    expect(fret12.length).toBe(2)
    const bass = fret12.find((p) => p.side === 'bass')!
    const treble = fret12.find((p) => p.side === 'treble')!
    expect(bass).toBeDefined()
    expect(treble).toBeDefined()
    expect(bass.centerMm.x).toBeCloseTo(-9.0, 2)
    expect(treble.centerMm.x).toBeCloseTo(9.0, 2)
    expect(treble.centerMm.x - bass.centerMm.x).toBeCloseTo(18.0, 2)
    expect(bass.centerMm.y).toBeCloseTo(treble.centerMm.y, 3)
    expect(bass.widthMm).toBe(6.0)
  })

  it('scales inlays proportionally with independent width and height percentages', () => {
    const neck = createMockNeck()
    const inlays = createDefaultInlayDocument()
    inlays.scalingMode = 'proportionalPercent'
    inlays.widthPercentage = 75
    inlays.heightPercentage = 60

    const placed = computeInlays(neck, inlays)
    const fret3 = placed.find((p) => p.fretIndex === 3)!
    const fret21 = placed.find((p) => p.fretIndex === 21)!

    // Frets get shorter towards bridge, so fret 3 height > fret 21 height
    expect(fret3.heightMm).toBeGreaterThan(fret21.heightMm)
    // Fretboard widens towards bridge, so fret 21 width > fret 3 width (proper block/trapezoid behaviour)
    expect(fret21.widthMm).toBeGreaterThan(fret3.widthMm)
  })

  it('stretches block inlays according to margins in stretchBlock mode', () => {
    const neck = createMockNeck()
    const inlays = createDefaultInlayDocument()
    inlays.shape = createPresetShape('block')
    inlays.scalingMode = 'stretchBlock'
    inlays.blockMargins = { fretMm: 2.0, edgeMm: 4.0 }

    const placed = computeInlays(neck, inlays)
    const fret3 = placed.find((p) => p.fretIndex === 3)!
    expect(fret3).toBeDefined()
    expect(fret3.nodes.length).toBe(4) // 4 corners for block
    // Width should span most of the neck width minus 2 * 4mm = 8mm
    expect(fret3.widthMm).toBeGreaterThan(25)
    expect(fret3.heightMm).toBeGreaterThan(5)
  })

  it('correctly handles multiscale curved frets', () => {
    const params = {
      ...DEFAULT_NECK,
      scaleTreble: 635,
      scaleBass: 673,
      anchorFret: 8,
      curvedExponent: 1.2,
    }
    const snapshot = calculateNeck(params, 4.0)
    const centerNode: OutlineNode = {
      id: 'center-datum',
      x: 0,
      y: 150,
      kind: 'corner',
      inHandle: null,
      outHandle: null,
      outgoing: 'line',
    }
    const neck: NeckDocument = {
      calculationVersion: 'fretfactory-89f94c0e',
      params,
      placement: { joinFret: 16, offsetMm: 0 },
      end: { endMarginMm: 4.0, fretboardEndMarginMm: 10.35, radiusMm: 0, fitAllowanceMm: 0 },
      snapshot,
      headstock: { version: 3, activeTemplateId: 'inline', variants: {} as any },
      physicalProfile: null,
      referenceBoundaryNodes: {
        left: { ...centerNode, id: 'l', x: -28 },
        center: centerNode,
        right: { ...centerNode, id: 'r', x: 28 },
      },
    }

    const inlays = createDefaultInlayDocument()
    const placed = computeInlays(neck, inlays)
    expect(placed.length).toBeGreaterThan(0)
    for (const p of placed) {
      expect(Number.isFinite(p.centerMm.x)).toBe(true)
      expect(Number.isFinite(p.centerMm.y)).toBe(true)
      expect(Number.isFinite(p.widthMm)).toBe(true)
      expect(p.widthMm).toBeGreaterThan(0)
    }
  })
})
