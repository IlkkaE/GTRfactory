import type { ExportDrawing, ExportPath, ExportSegment, ExportRole } from './model'
import { tablePath } from './layout'
import { arcCubics } from './math'
export const num = (v: number) => Number(v.toFixed(6)).toString()
export const escapeXml = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!,
  )
export function pathData(path: ExportPath, cubicArcs = false) {
  if (!path.segments.length) return ''
  let out = 'M ' + num(path.segments[0].from.x) + ' ' + num(path.segments[0].from.y)
  const segments = path.segments.flatMap((s) =>
    cubicArcs && s.type === 'circularArc' ? arcCubics(s) : [s],
  )
  for (const s of segments) out += command(s)
  return out + (path.closed ? ' Z' : '')
}
function command(s: ExportSegment) {
  if (s.type === 'line') return ' L ' + num(s.to.x) + ' ' + num(s.to.y)
  if (s.type === 'circularArc')
    return (
      ' A ' +
      num(s.radiusMm) +
      ' ' +
      num(s.radiusMm) +
      ' 0 ' +
      (s.largeArc ?? 0) +
      ' ' +
      s.sweep +
      ' ' +
      num(s.to.x) +
      ' ' +
      num(s.to.y)
    )
  return (
    ' C ' +
    num(s.control1.x) +
    ' ' +
    num(s.control1.y) +
    ' ' +
    num(s.control2.x) +
    ' ' +
    num(s.control2.y) +
    ' ' +
    num(s.to.x) +
    ' ' +
    num(s.to.y)
  )
}

export const ROLE_LABELS: Record<string, string> = {
  CUT_OUTER: 'Outer outline',
  ROUTE_NECK_POCKET: 'Neck pocket route',
  ROUTE_PICKUP: 'Pickup routes',
  ROUTE_REAR_INNER: 'Rear cavity inner route',
  ROUTE_REAR_RECESS: 'Rear cavity recess',
  DRILL_TUNER: 'Tuner holes',
  REFERENCE_CENTERLINE: 'Centerlines',
  REFERENCE: 'Reference markers',
  FRET_GUIDE: 'Fret guides',
  ROUTE_INLAY: 'Fretboard inlays',
  REFERENCE_DIMENSIONS: 'Dimensions',
}

export const LAYER_ORDER: ExportRole[] = [
  'CUT_OUTER',
  'ROUTE_NECK_POCKET',
  'ROUTE_PICKUP',
  'ROUTE_REAR_RECESS',
  'ROUTE_REAR_INNER',
  'DRILL_TUNER',
  'REFERENCE_CENTERLINE',
  'REFERENCE',
  'FRET_GUIDE',
  'ROUTE_INLAY',
  'REFERENCE_DIMENSIONS',
]

export function svgExport(d: ExportDrawing, margin = 10) {
  const b = d.bounds,
    w = b.width + 2 * margin,
    h = b.height + 2 * margin
  const paths = [...d.paths, ...(d.table ? [tablePath(d.table)] : [])],
    texts = [...d.texts, ...(d.table?.texts ?? [])]
  const roleRank = (r: string) => {
    const idx = LAYER_ORDER.indexOf(r as ExportRole)
    return idx === -1 ? 999 : idx
  }
  const roles = [
    ...new Set([
      ...paths.map((p) => p.role),
      ...d.circles.map((c) => c.role),
      ...texts.map((t) => t.role),
    ]),
  ].sort((a, b) => roleRank(a) - roleRank(b))

  let out =
    '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="' +
    num(w) +
    'mm" height="' +
    num(h) +
    'mm" viewBox="' +
    [b.minX - margin, b.minY - margin, w, h].map(num).join(' ') +
    '"><title>' +
    escapeXml(d.name) +
    '</title>'
  for (const role of roles) {
    const label = escapeXml(ROLE_LABELS[role] ?? role)
    out +=
      '<g id="' +
      role +
      '" data-role="' +
      role +
      '" inkscape:groupmode="layer" inkscape:label="' +
      label +
      '" fill="none" stroke="#111" stroke-width="0.2">'
    for (const p of paths.filter((p) => p.role === role))
      out +=
        '<path' +
        (p.role === 'REFERENCE_CENTERLINE' ? ' stroke-dasharray="6 3"' : '') +
        ' d="' +
        pathData(p) +
        '"/>'
    for (const c of d.circles.filter((c) => c.role === role))
      out +=
        '<circle cx="' +
        num(c.center.x) +
        '" cy="' +
        num(c.center.y) +
        '" r="' +
        num(c.radiusMm) +
        '"/>'
    for (const t of texts.filter((t) => t.role === role))
      out +=
        '<text x="' +
        num(t.x) +
        '" y="' +
        num(t.y) +
        '" font-family="Courier New, monospace" font-size="' +
        num(t.size) +
        '" fill="#111" stroke="none">' +
        escapeXml(t.text) +
        '</text>'
    out += '</g>'
  }
  return out + '</svg>'
}
