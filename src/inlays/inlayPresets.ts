import type { InlayDocument, InlayShape, InlayShapePresetId, OutlineNode } from '../model/project'

const K_CIRCLE = 0.5522847 * 0.5 // ~0.276142 for radius 0.5

export function createPresetNodes(presetId: InlayShapePresetId): OutlineNode[] {
  switch (presetId) {
    case 'circle':
      return [
        {
          id: 'inlay-circle-top',
          x: 0.5,
          y: 0,
          kind: 'smooth',
          inHandle: { dx: -K_CIRCLE, dy: 0 },
          outHandle: { dx: K_CIRCLE, dy: 0 },
          outgoing: 'cubicBezier',
        },
        {
          id: 'inlay-circle-right',
          x: 1,
          y: 0.5,
          kind: 'smooth',
          inHandle: { dx: 0, dy: -K_CIRCLE },
          outHandle: { dx: 0, dy: K_CIRCLE },
          outgoing: 'cubicBezier',
        },
        {
          id: 'inlay-circle-bottom',
          x: 0.5,
          y: 1,
          kind: 'smooth',
          inHandle: { dx: K_CIRCLE, dy: 0 },
          outHandle: { dx: -K_CIRCLE, dy: 0 },
          outgoing: 'cubicBezier',
        },
        {
          id: 'inlay-circle-left',
          x: 0,
          y: 0.5,
          kind: 'smooth',
          inHandle: { dx: 0, dy: K_CIRCLE },
          outHandle: { dx: 0, dy: -K_CIRCLE },
          outgoing: 'cubicBezier',
        },
      ]

    case 'diamond':
      return [
        {
          id: 'inlay-diamond-top',
          x: 0.5,
          y: 0,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
        {
          id: 'inlay-diamond-right',
          x: 1,
          y: 0.5,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
        {
          id: 'inlay-diamond-bottom',
          x: 0.5,
          y: 1,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
        {
          id: 'inlay-diamond-left',
          x: 0,
          y: 0.5,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
      ]

    case 'block':
      return [
        {
          id: 'inlay-block-tl',
          x: 0,
          y: 0,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
        {
          id: 'inlay-block-tr',
          x: 1,
          y: 0,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
        {
          id: 'inlay-block-br',
          x: 1,
          y: 1,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
        {
          id: 'inlay-block-bl',
          x: 0,
          y: 1,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
      ]

    case 'trapezoid':
      return [
        {
          id: 'inlay-trap-tl',
          x: 0.1,
          y: 0,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
        {
          id: 'inlay-trap-tr',
          x: 0.9,
          y: 0,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
        {
          id: 'inlay-trap-br',
          x: 1,
          y: 1,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
        {
          id: 'inlay-trap-bl',
          x: 0,
          y: 1,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
      ]

    case 'star': {
      const nodes: OutlineNode[] = []
      const points = 5
      const outerR = 0.5
      const innerR = 0.2
      for (let i = 0; i < points * 2; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI) / points
        const r = i % 2 === 0 ? outerR : innerR
        const x = Math.round((0.5 + r * Math.cos(angle)) * 10000) / 10000
        const y = Math.round((0.5 + r * Math.sin(angle)) * 10000) / 10000
        nodes.push({
          id: `inlay-star-${i}`,
          x,
          y,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        })
      }
      return nodes
    }

    case 'custom':
    default:
      return createPresetNodes('circle')
  }
}

export function createPresetShape(presetId: InlayShapePresetId): InlayShape {
  return {
    presetId,
    nodes: createPresetNodes(presetId),
  }
}

export const CLASSIC_DOT_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]

export function createDefaultInlayDocument(): InlayDocument {
  return {
    version: 1,
    enabled: true,
    shape: createPresetShape('circle'),
    markedFrets: [...CLASSIC_DOT_FRETS],
    doubleInlayFrets: [12, 24],
    doubleInlaySpacingMm: 15,
    scalingMode: 'fixedMm',
    fixedDiameterMm: 6.0,
    fillPercentage: 60,
    widthPercentage: 70,
    heightPercentage: 70,
    blockMargins: { fretMm: 2.0, edgeMm: 3.5 },
    style: {
      fillColor: '#ffffff',
      strokeColor: '#000000',
      strokeWidthMm: 0.2,
    },
  }
}
