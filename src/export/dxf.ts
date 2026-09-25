import type { ExportDrawing, ExportSegment, ExportRole } from './model'
import { arcData } from './math'
import { tablePath } from './layout'
import { num, LAYER_ORDER } from './svg'
const p = (code: number, value: string | number) => code + '\n' + value + '\n'
export function dxfExport(d: ExportDrawing) {
  let handle = 256
  const h = () => p(5, (handle++).toString(16).toUpperCase())
  const point = (code: number, q: { x: number; y: number }) =>
    p(code, num(q.x)) + p(code + 10, num(-q.y)) + p(code + 20, 0)
  const paths = [...d.paths, ...(d.table ? [tablePath(d.table)] : [])],
    texts = [...d.texts, ...(d.table?.texts ?? [])]
  const roleRank = (r: string) => {
    const idx = LAYER_ORDER.indexOf(r as ExportRole)
    return idx === -1 ? 999 : idx
  }
  const roles = [
    ...new Set([
      '0',
      ...paths.map((p) => p.role),
      ...d.circles.map((c) => c.role),
      ...texts.map((t) => t.role),
    ]),
  ].sort((a, b) => roleRank(a) - roleRank(b))
  const b = d.bounds
  let out =
    p(0, 'SECTION') +
    p(2, 'HEADER') +
    p(9, '$ACADVER') +
    p(1, 'AC1027') +
    p(9, '$INSUNITS') +
    p(70, 4) +
    p(9, '$MEASUREMENT') +
    p(70, 1) +
    p(9, '$EXTMIN') +
    point(10, { x: b.minX, y: b.maxY }) +
    p(9, '$EXTMAX') +
    point(10, { x: b.maxX, y: b.minY }) +
    p(0, 'ENDSEC')
  out += p(0, 'SECTION') + p(2, 'TABLES')
  out +=
    p(0, 'TABLE') +
    p(2, 'LTYPE') +
    h() +
    p(100, 'AcDbSymbolTable') +
    p(70, 2) +
    p(0, 'LTYPE') +
    h() +
    p(100, 'AcDbSymbolTableRecord') +
    p(100, 'AcDbLinetypeTableRecord') +
    p(2, 'CONTINUOUS') +
    p(70, 0) +
    p(3, 'Solid line') +
    p(72, 65) +
    p(73, 0) +
    p(40, 0) +
    p(0, 'LTYPE') +
    h() +
    p(100, 'AcDbSymbolTableRecord') +
    p(100, 'AcDbLinetypeTableRecord') +
    p(2, 'GTR_CENTERLINE') +
    p(70, 0) +
    p(3, '6 mm dash, 3 mm gap') +
    p(72, 65) +
    p(73, 2) +
    p(40, 9) +
    p(49, 6) +
    p(74, 0) +
    p(49, -3) +
    p(74, 0) +
    p(0, 'ENDTAB')
  out += p(0, 'TABLE') + p(2, 'LAYER') + h() + p(100, 'AcDbSymbolTable') + p(70, roles.length)
  for (const role of roles)
    out +=
      p(0, 'LAYER') +
      h() +
      p(100, 'AcDbSymbolTableRecord') +
      p(100, 'AcDbLayerTableRecord') +
      p(2, role) +
      p(70, 0) +
      p(62, role === 'ROUTE_INLAY' ? 4 : 7) +
      p(6, role === 'REFERENCE_CENTERLINE' ? 'GTR_CENTERLINE' : 'CONTINUOUS')
  out +=
    p(0, 'ENDTAB') +
    p(0, 'TABLE') +
    p(2, 'STYLE') +
    h() +
    p(100, 'AcDbSymbolTable') +
    p(70, 1) +
    p(0, 'STYLE') +
    h() +
    p(100, 'AcDbSymbolTableRecord') +
    p(100, 'AcDbTextStyleTableRecord') +
    p(2, 'STANDARD') +
    p(70, 0) +
    p(40, 0) +
    p(41, 1) +
    p(50, 0) +
    p(71, 0) +
    p(42, 2.7) +
    p(3, 'cour.ttf') +
    p(4, '') +
    p(0, 'ENDTAB') +
    p(0, 'ENDSEC')
  out += p(0, 'SECTION') + p(2, 'BLOCKS') + p(0, 'ENDSEC') + p(0, 'SECTION') + p(2, 'ENTITIES')
  const base = (type: string, role: ExportRole, sub: string) =>
    p(0, type) + h() + p(100, 'AcDbEntity') + p(8, role) + p(100, sub)
  function segment(s: ExportSegment, role: ExportRole) {
    if (s.type === 'line') {
      if (Math.hypot(s.from.x - s.to.x, s.from.y - s.to.y) < 1e-9) return ''
      return base('LINE', role, 'AcDbLine') + point(10, s.from) + point(11, s.to)
    }
    if (s.type === 'cubicBezier')
      return (
        base('SPLINE', role, 'AcDbSpline') +
        p(70, 8) +
        p(71, 3) +
        p(72, 8) +
        p(73, 4) +
        p(74, 0) +
        [0, 0, 0, 0, 1, 1, 1, 1].map((k) => p(40, k)).join('') +
        [s.from, s.control1, s.control2, s.to].map((q) => point(10, q)).join('')
      )
    const a = arcData(s),
      angle = (v: number) => ((((-v * 180) / Math.PI) % 360) + 360) % 360
    const start = s.sweep ? angle(a.start + a.delta) : angle(a.start),
      end = s.sweep ? angle(a.start) : angle(a.start + a.delta)
    return (
      base('ARC', role, 'AcDbCircle') +
      point(10, a.center) +
      p(40, num(a.r)) +
      p(100, 'AcDbArc') +
      p(50, num(start)) +
      p(51, num(end))
    )
  }
  for (const path of paths) for (const s of path.segments) out += segment(s, path.role)
  for (const c of d.circles)
    out += base('CIRCLE', c.role, 'AcDbCircle') + point(10, c.center) + p(40, num(c.radiusMm))
  for (const t of texts)
    out +=
      base('TEXT', t.role, 'AcDbText') +
      point(10, t) +
      p(40, num(t.size)) +
      p(1, t.text) +
      p(7, 'STANDARD') +
      p(100, 'AcDbText')
  return out + p(0, 'ENDSEC') + p(0, 'EOF')
}
