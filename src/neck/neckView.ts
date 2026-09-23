import type { ProjectDocument, NeckPoint } from '../model/project'
import { bounds, type Bounds } from '../geometry/outline'
import { physicalFretboard, physicalHeel } from './automaticPocket'
import { transformPoint } from './fretfactoryGeometry'
import { pchipToBezierPath, pchipToBezierSegments } from './vendor/pchip'
import { headstockGeometry } from '../headstock/template'

export function pointBounds(points: NeckPoint[]): Bounds {
  const minX = Math.min(...points.map((p) => p.x)),
    maxX = Math.max(...points.map((p) => p.x))
  const minY = Math.min(...points.map((p) => p.y)),
    maxY = Math.max(...points.map((p) => p.y))
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

/** Both workspaces draw this same physical outline in body millimetres. */
export function neckView(document: ProjectDocument) {
  const neck = document.neck
  if (!neck) return null
  const heel = physicalHeel(document)!,
    fretboard = physicalFretboard(document)!
  const datum = document.body.outline.nodes.find(
    (n) => n.id === document.body.neckJointBoundary!.anchorIds[1],
  )!
  const move = (p: NeckPoint) => transformPoint(p, neck.placement, neck.snapshot, datum)
  const nut = neck.snapshot.nut.map(move),
    bridge = neck.snapshot.bridge.map(move)
  const frets = neck.snapshot.frets.map((f) => ({
    n: f.n,
    points: f.points.map(move),
    path: pchipToBezierPath(f.points.map(move)),
  }))
  const pair = (p: NeckPoint) => `${p.x} ${p.y}`
  // Reverse the actual cubics, not their input points (which would trigger a polyline fallback).
  const returnAlongNut = pchipToBezierSegments(nut)
    .reverse()
    .map((c) => `C ${pair(c.c2)} ${pair(c.c1)} ${pair(c.p0)}`)
    .join(' ')
  const end = (profile: typeof heel) =>
    profile.radiusMm > 0
      ? `L ${pair(profile.leftSideTangent)} A ${profile.radiusMm} ${profile.radiusMm} 0 0 0 ${pair(profile.leftEndTangent)} L ${pair(profile.rightEndTangent)} A ${profile.radiusMm} ${profile.radiusMm} 0 0 0 ${pair(profile.rightSideTangent)}`
      : `L ${pair(profile.leftCorner)} L ${pair(profile.rightCorner)}`
  const outline = (profile: typeof heel) =>
    `M ${pair(nut[0])} ${end(profile)} L ${pair(nut.at(-1)!)} ${returnAlongNut} Z`
  const outlinePath = outline(fretboard)
  const headstock = headstockGeometry(document)
  return {
    outlinePath,
    heelPath: heel.pathD,
    nut,
    nutPath: pchipToBezierPath(nut),
    bridgePath: pchipToBezierPath(bridge),
    frets,
    strings: nut.slice(1, -1).map((from, i) => ({ from, to: bridge[i + 1] })),
    headstock,
    bounds: pointBounds([
      ...nut,
      ...frets.flatMap((f) => f.points),
      heel.leftCorner,
      heel.rightCorner,
      fretboard.leftCorner,
      fretboard.rightCorner,
    ]),
    contactBounds: pointBounds([
      ...nut,
      ...bridge,
      heel.leftCorner,
      heel.rightCorner,
      fretboard.leftCorner,
      fretboard.rightCorner,
    ]),
  }
}

export function frontBounds(document: ProjectDocument): Bounds {
  const body = bounds(document.body.outline.nodes),
    neck = neckView(document)
  if (!neck) return body
  const minX = Math.min(
      body.minX,
      neck.contactBounds.minX,
      neck.headstock?.bounds.minX ?? Infinity,
    ),
    maxX = Math.max(body.maxX, neck.contactBounds.maxX, neck.headstock?.bounds.maxX ?? -Infinity)
  const minY = Math.min(
      body.minY,
      neck.contactBounds.minY,
      neck.headstock?.bounds.minY ?? Infinity,
    ),
    maxY = Math.max(body.maxY, neck.contactBounds.maxY, neck.headstock?.bounds.maxY ?? -Infinity)
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}
