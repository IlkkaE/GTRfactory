import type {
  ExportDrawing,
  ExportSegment,
  ExportRole,
  ExportPath,
  ExportCircle,
  ExportText,
} from './model'
import { arcData } from './math'
import { tablePath } from './layout'
import { num, LAYER_ORDER } from './svg'
const p = (code: number, value: string | number) => code + '\n' + value + '\n'

function cleanLayerName(name: string): string {
  return name.replace(/[<>/\":;?*|=]/g, '').trim()
}

export function dxfLayerName(prefix: string, role: ExportRole): string {
  return `${cleanLayerName(prefix)} - ${role}`
}

export function dxfExport(d: ExportDrawing) {
  let handle = 256
  const h = () => p(5, (handle++).toString(16).toUpperCase())
  const point = (code: number, q: { x: number; y: number }) =>
    p(code, num(q.x)) + p(code + 10, num(-q.y)) + p(code + 20, 0)

  const parts = d.parts ?? []
  const partPathSet = new Set(parts.flatMap((pt) => pt.paths))
  const partCircleSet = new Set(parts.flatMap((pt) => pt.circles))

  type LayerItem = { name: string; role: ExportRole }
  const layerMap = new Map<string, ExportRole>()

  // Kerätään elementit ja niiden tasot
  type SourcedPath = { path: ExportPath; layer: string }
  type SourcedCircle = { circle: ExportCircle; layer: string }
  type SourcedText = { text: ExportText; layer: string }

  const sourcedPaths: SourcedPath[] = []
  const sourcedCircles: SourcedCircle[] = []
  const sourcedTexts: SourcedText[] = []

  for (const part of parts) {
    for (const path of part.paths) {
      const layer = dxfLayerName(part.name, path.role)
      layerMap.set(layer, path.role)
      sourcedPaths.push({ path, layer })
    }
    for (const circle of part.circles) {
      const layer = dxfLayerName(part.name, circle.role)
      layerMap.set(layer, circle.role)
      sourcedCircles.push({ circle, layer })
    }
    const nameText = d.texts.find((t) => t.text === part.name)
    if (nameText) {
      const layer = dxfLayerName(part.name, nameText.role)
      layerMap.set(layer, nameText.role)
      sourcedTexts.push({ text: nameText, layer })
    }
  }

  // Kalibrointi
  const calPaths = d.paths.filter((p) => !partPathSet.has(p))
  const calCircles = d.circles.filter((c) => !partCircleSet.has(c))
  const calTexts = d.texts.filter(
    (t) => !parts.some((pt) => pt.name === t.text) && t.text.includes('calibration'),
  )
  for (const path of calPaths) {
    const layer = dxfLayerName('Calibration', path.role)
    layerMap.set(layer, path.role)
    sourcedPaths.push({ path, layer })
  }
  for (const circle of calCircles) {
    const layer = dxfLayerName('Calibration', circle.role)
    layerMap.set(layer, circle.role)
    sourcedCircles.push({ circle, layer })
  }
  for (const text of calTexts) {
    const layer = dxfLayerName('Calibration', text.role)
    layerMap.set(layer, text.role)
    sourcedTexts.push({ text, layer })
  }

  // Mittataulukko
  if (d.table) {
    const tableLayer = dxfLayerName('Dimensions', 'REFERENCE_DIMENSIONS')
    layerMap.set(tableLayer, 'REFERENCE_DIMENSIONS')
    sourcedPaths.push({ path: tablePath(d.table), layer: tableLayer })
    for (const t of d.table.texts) {
      sourcedTexts.push({ text: t, layer: tableLayer })
    }
  }

  // Mahdolliset muut tekstit
  const handledTexts = new Set(sourcedTexts.map((s) => s.text))
  for (const t of d.texts) {
    if (!handledTexts.has(t)) {
      const layer = dxfLayerName('General', t.role)
      layerMap.set(layer, t.role)
      sourcedTexts.push({ text: t, layer })
    }
  }

  const roleRank = (r: ExportRole) => {
    const idx = LAYER_ORDER.indexOf(r)
    return idx === -1 ? 999 : idx
  }

  const layers: LayerItem[] = Array.from(layerMap.entries())
    .map(([name, role]) => ({ name, role }))
    .sort((a, b) => roleRank(a.role) - roleRank(b.role) || a.name.localeCompare(b.name))

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

  out += p(0, 'TABLE') + p(2, 'LAYER') + h() + p(100, 'AcDbSymbolTable') + p(70, layers.length + 1)
  out +=
    p(0, 'LAYER') +
    h() +
    p(100, 'AcDbSymbolTableRecord') +
    p(100, 'AcDbLayerTableRecord') +
    p(2, '0') +
    p(70, 0) +
    p(62, 7) +
    p(6, 'CONTINUOUS')

  for (const layer of layers)
    out +=
      p(0, 'LAYER') +
      h() +
      p(100, 'AcDbSymbolTableRecord') +
      p(100, 'AcDbLayerTableRecord') +
      p(2, layer.name) +
      p(70, 0) +
      p(62, layer.role === 'ROUTE_INLAY' ? 4 : 7) +
      p(6, layer.role === 'REFERENCE_CENTERLINE' ? 'GTR_CENTERLINE' : 'CONTINUOUS')

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

  const base = (type: string, layer: string, sub: string) =>
    p(0, type) + h() + p(100, 'AcDbEntity') + p(8, layer) + p(100, sub)

  function segment(s: ExportSegment, layer: string) {
    if (s.type === 'line') {
      if (Math.hypot(s.from.x - s.to.x, s.from.y - s.to.y) < 1e-9) return ''
      return base('LINE', layer, 'AcDbLine') + point(10, s.from) + point(11, s.to)
    }
    if (s.type === 'cubicBezier')
      return (
        base('SPLINE', layer, 'AcDbSpline') +
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
      base('ARC', layer, 'AcDbCircle') +
      point(10, a.center) +
      p(40, num(a.r)) +
      p(100, 'AcDbArc') +
      p(50, num(start)) +
      p(51, num(end))
    )
  }

  for (const item of sourcedPaths) for (const s of item.path.segments) out += segment(s, item.layer)

  for (const item of sourcedCircles)
    out +=
      base('CIRCLE', item.layer, 'AcDbCircle') +
      point(10, item.circle.center) +
      p(40, num(item.circle.radiusMm))

  for (const item of sourcedTexts)
    out +=
      base('TEXT', item.layer, 'AcDbText') +
      point(10, item.text) +
      p(40, num(item.text.size)) +
      p(1, item.text.text) +
      p(7, 'STANDARD') +
      p(100, 'AcDbText')

  return out + p(0, 'ENDSEC') + p(0, 'EOF')
}
