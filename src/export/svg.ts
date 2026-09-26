import type {
  ExportDrawing,
  ExportPath,
  ExportSegment,
  ExportRole,
  ExportCircle,
  ExportText,
} from './model'
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

  const roleRank = (r: string) => {
    const idx = LAYER_ORDER.indexOf(r as ExportRole)
    return idx === -1 ? 999 : idx
  }

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

  const usedRoleIds = new Set<string>()

  const renderRoleGroup = (
    role: ExportRole,
    paths: ExportPath[],
    circles: ExportCircle[],
    texts: ExportText[],
    partId?: string,
  ) => {
    const label = escapeXml(ROLE_LABELS[role] ?? role)
    const groupId = usedRoleIds.has(role) && partId ? `${partId}-${role}` : role
    usedRoleIds.add(groupId)

    let group =
      '<g id="' +
      groupId +
      '" data-role="' +
      role +
      '" inkscape:groupmode="layer" inkscape:label="' +
      label +
      '" fill="none" stroke="#111" stroke-width="0.2">'

    for (const p of paths)
      group +=
        '<path' +
        (p.role === 'REFERENCE_CENTERLINE' ? ' stroke-dasharray="6 3"' : '') +
        ' d="' +
        pathData(p) +
        '"/>'
    for (const c of circles)
      group +=
        '<circle cx="' +
        num(c.center.x) +
        '" cy="' +
        num(c.center.y) +
        '" r="' +
        num(c.radiusMm) +
        '"/>'
    for (const t of texts)
      group +=
        '<text x="' +
        num(t.x) +
        '" y="' +
        num(t.y) +
        '" font-family="Courier New, monospace" font-size="' +
        num(t.size) +
        '" fill="#111" stroke="none">' +
        escapeXml(t.text) +
        '</text>'

    group += '</g>'
    return group
  }

  const parts = d.parts ?? []
  const partPathSet = new Set(parts.flatMap((p) => p.paths))
  const partCircleSet = new Set(parts.flatMap((p) => p.circles))

  // 1. Jokainen erillinen kitaran osa omalle tasolleen
  for (const part of parts) {
    const partLabel = escapeXml(part.name)
    const partLayerId = `part-${part.id}`
    out +=
      '<g id="' +
      partLayerId +
      '" data-part="' +
      part.id +
      '" inkscape:groupmode="layer" inkscape:label="' +
      partLabel +
      '">'

    const nameText = d.texts.find((t) => t.text === part.name)

    const roles = [
      ...new Set([
        ...part.paths.map((p) => p.role),
        ...part.circles.map((c) => c.role),
        ...(nameText ? [nameText.role] : []),
      ]),
    ].sort((a, b) => roleRank(a) - roleRank(b))

    for (const role of roles) {
      const paths = part.paths.filter((p) => p.role === role)
      const circles = part.circles.filter((c) => c.role === role)
      const texts = nameText && nameText.role === role ? [nameText] : []
      out += renderRoleGroup(role, paths, circles, texts, part.id)
    }

    out += '</g>'
  }

  // 2. Kalibrointiviivain (jos mukana)
  const calPaths = d.paths.filter((p) => !partPathSet.has(p))
  const calCircles = d.circles.filter((c) => !partCircleSet.has(c))
  const calTexts = d.texts.filter(
    (t) => !parts.some((p) => p.name === t.text) && t.text.includes('calibration'),
  )
  if (calPaths.length || calCircles.length || calTexts.length) {
    out +=
      '<g id="layer-calibration" inkscape:groupmode="layer" inkscape:label="Calibration reference">'
    const calRoles = [
      ...new Set([
        ...calPaths.map((p) => p.role),
        ...calCircles.map((c) => c.role),
        ...calTexts.map((t) => t.role),
      ]),
    ].sort((a, b) => roleRank(a) - roleRank(b))
    for (const role of calRoles) {
      out += renderRoleGroup(
        role,
        calPaths.filter((p) => p.role === role),
        calCircles.filter((c) => c.role === role),
        calTexts.filter((t) => t.role === role),
        'calibration',
      )
    }
    out += '</g>'
  }

  // 3. Mittataulukko (jos mukana)
  if (d.table) {
    out += '<g id="layer-dimensions" inkscape:groupmode="layer" inkscape:label="Dimensions">'
    out += renderRoleGroup(
      'REFERENCE_DIMENSIONS',
      [tablePath(d.table)],
      [],
      d.table.texts,
      'dimensions',
    )
    out += '</g>'
  }

  // 4. Mahdolliset muut irralliset tekstit
  const handledTexts = new Set([
    ...parts.map((p) => p.name),
    ...calTexts.map((t) => t.text),
    ...(d.table ? d.table.texts.map((t) => t.text) : []),
  ])
  const remainingTexts = d.texts.filter((t) => !handledTexts.has(t.text))
  if (remainingTexts.length) {
    for (const t of remainingTexts) {
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
    }
  }

  return out + '</svg>'
}
