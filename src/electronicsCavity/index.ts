import type { ProjectDocument, RearElectronicsCavity } from '../model/project'
import { frontTemplateGeometry } from '../templates/templateGeometry'
import {
  containment,
  flattenContour,
  flattenOutline,
  type ContainmentResult,
} from '../geometry/containment'
export type Segment = {
  type: 'line' | 'cubicBezier'
  from: { x: number; y: number }
  to: { x: number; y: number }
  control1?: { x: number; y: number }
  control2?: { x: number; y: number }
}
export type CavityPath = {
  role: 'outer-recess-boundary' | 'inner-cavity-boundary'
  segments: Segment[]
  d: string
}
const outer =
  'M 62.90852 106.92464 C 60.977274 107.41176 53.613391 105.55413 50.009977 100.04106 L 27.481942 65.575278 C 28.371615 60.488977 28.384714 53.882872 32.904383 48.86349 L 53.119855 31.829121 C 59.199767 26.932848 66.141517 26.03397 69.749551 26.037357 L 182.33491 26.145448 C 198.92088 28.498308 203.93634 41.899627 203.52584 54.306498 C 193.81267 77.583057 136.83913 111.83859 62.90852 106.92464 Z'
const inner =
  'M 64.979185 103.70455 C 61.752997 104.01881 57.652943 102.06118 55.137743 99.539133 C 50.993839 95.384043 37.11528 72.452434 36.781622 71.207058 C 35.879464 67.840041 38.458234 48.834491 40.224416 47.781838 L 53.738486 36.795068 C 54.187148 36.45619 54.918598 35.700293 57.177116 35.979093 C 63.228913 36.726206 67.221899 39.821407 73.579871 33.210528 C 74.484605 32.269811 77.369093 29.497542 79.438664 29.506503 L 112.05589 29.648188 C 114.07237 31.359413 114.33796 34.237897 118.10533 34.781862 L 124.44658 29.702012 C 142.40795 30.040376 161.57146 29.832705 179.94311 29.91322 C 185.17872 30.279333 187.75615 36.044957 188.065 36.679674 L 195.55638 52.073803 C 196.84437 56.08471 196.55883 60.471854 194.0527 62.787699 C 178.42634 79.307935 148.04117 93.487864 114.97711 100.10265 C 112.09671 100.6789 108.17462 95.653261 105.26153 96.111233 C 101.56677 96.692095 98.873511 102.71953 95.155332 103.09751 C 85.012874 104.12857 74.843909 104.3786 64.979185 103.70455 Z'
function segments(d: string): Segment[] {
  const t = d.match(/[A-Z]|-?\d*\.?\d+/g) ?? []
  let i = 0,
    p = { x: 0, y: 0 },
    start = p,
    out: Segment[] = []
  while (i < t.length) {
    const c = t[i++]
    if (c === 'M') {
      p = { x: +t[i++], y: +t[i++] }
      start = p
    } else if (c === 'L') {
      const q = { x: +t[i++], y: +t[i++] }
      out.push({ type: 'line', from: p, to: q })
      p = q
    } else if (c === 'C') {
      const a = { x: +t[i++], y: +t[i++] },
        b = { x: +t[i++], y: +t[i++] },
        q = { x: +t[i++], y: +t[i++] }
      out.push({ type: 'cubicBezier', from: p, control1: a, control2: b, to: q })
      p = q
    } else if (c === 'Z' && (p.x !== start.x || p.y !== start.y))
      out.push({ type: 'line', from: p, to: start })
  }
  return out
}
export const rearElectronicsCavityProfile = {
  id: 'potero-v1',
  version: 1 as const,
  width: 176.06686788504933,
  height: 81.36283544639431,
  minX: 27.481942,
  minY: 26.03734748455872,
  outer: segments(outer),
  inner: segments(inner),
}
function transform(c: RearElectronicsCavity, p: { x: number; y: number }) {
  const sx = c.horizontalMm / rearElectronicsCavityProfile.width,
    sy = c.verticalMm / rearElectronicsCavityProfile.height,
    cx = rearElectronicsCavityProfile.minX + rearElectronicsCavityProfile.width / 2,
    cy = rearElectronicsCavityProfile.minY + rearElectronicsCavityProfile.height / 2
  return { x: c.centerXmm + (p.y - cy) * sy, y: c.centerYmm - (p.x - cx) * sx }
}
function mapped(c: RearElectronicsCavity, s: Segment): Segment {
  return {
    ...s,
    from: transform(c, s.from),
    to: transform(c, s.to),
    ...(s.control1
      ? { control1: transform(c, s.control1), control2: transform(c, s.control2!) }
      : {}),
  }
}
function path(segments: Segment[]) {
  return segments.length
    ? `M ${segments[0].from.x} ${segments[0].from.y} ${segments.map((s) => (s.type === 'line' ? `L ${s.to.x} ${s.to.y}` : `C ${s.control1!.x} ${s.control1!.y} ${s.control2!.x} ${s.control2!.y} ${s.to.x} ${s.to.y}`)).join(' ')} Z`
    : ''
}
export type RearElectronicsCavityGeometry = {
  outer: CavityPath
  inner: CavityPath
  bounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number }
  diagnostic: CavityDiagnostic
}
export function rearElectronicsCavityGeometry(
  document: ProjectDocument,
): RearElectronicsCavityGeometry | null {
  const c = document.body.rearElectronicsCavity
  if (!c) return null
  const os = rearElectronicsCavityProfile.outer.map((s) => mapped(c, s)),
    ins = rearElectronicsCavityProfile.inner.map((s) => mapped(c, s))
  return {
    outer: { role: 'outer-recess-boundary', segments: os, d: path(os) },
    inner: { role: 'inner-cavity-boundary', segments: ins, d: path(ins) },
    bounds: {
      minX: c.centerXmm - c.verticalMm / 2,
      maxX: c.centerXmm + c.verticalMm / 2,
      minY: c.centerYmm - c.horizontalMm / 2,
      maxY: c.centerYmm + c.horizontalMm / 2,
      width: c.verticalMm,
      height: c.horizontalMm,
    },
    diagnostic: placementDiagnostic(document, c),
  }
}
export type CavityDiagnostic = ContainmentResult
export function placementDiagnostic(
  document: ProjectDocument,
  c: RearElectronicsCavity,
): CavityDiagnostic {
  try {
    if (!frontTemplateGeometry(document.body.outline.nodes).cut)
      return {
        class: 'unsupported',
        code: 'invalid-body-outline',
        message: 'The body outline cannot be checked reliably. Correct the body shape.',
      }
    return containment(
      flattenOutline(document.body.outline.nodes),
      flattenContour(rearElectronicsCavityGeometryBare(c)),
    )
  } catch {
    return {
      class: 'unsupported',
      code: 'work-budget',
      message: 'The cavity placement could not be checked reliably.',
    }
  }
}
function rearElectronicsCavityGeometryBare(c: RearElectronicsCavity) {
  return rearElectronicsCavityProfile.outer.map((s) => mapped(c, s))
}
export const movedCavity = (
  c: RearElectronicsCavity,
  dx: number,
  dy: number,
): RearElectronicsCavity => ({ ...c, centerXmm: c.centerXmm + dx, centerYmm: c.centerYmm + dy })
export function resizedCavity(
  c: RearElectronicsCavity,
  side: 'left' | 'right' | 'top' | 'bottom',
  d: number,
): RearElectronicsCavity {
  if (side === 'top') return { ...c, centerXmm: c.centerXmm + d / 2, verticalMm: c.verticalMm + d }
  if (side === 'bottom')
    return { ...c, centerXmm: c.centerXmm + d / 2, verticalMm: c.verticalMm - d }
  if (side === 'left')
    return { ...c, centerYmm: c.centerYmm + d / 2, horizontalMm: c.horizontalMm + d }
  return { ...c, centerYmm: c.centerYmm + d / 2, horizontalMm: c.horizontalMm - d }
}
