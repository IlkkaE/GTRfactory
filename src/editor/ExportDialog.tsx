import { useEffect, useMemo, useRef, useState } from 'react'
import { buildExportDrawing } from '../export/geometry'
import { dxfExport } from '../export/dxf'
import { svgExport } from '../export/svg'
import { planPdfPages, type Paper } from '../export/pages'
import {
  DEFAULT_EXPORT_OPTIONS,
  PART_NAMES,
  type ExportOptions,
  type ExportPart,
} from '../export/model'
import { useAppStore } from '../store'
import { isHeadless } from '../headstock/template'
import './exportDialog.css'
type Format = 'pdf' | 'svg' | 'dxf'
let session: { options: ExportOptions; format: Format; paper: Paper } | null = null
const partOrder: ExportPart[] = [
  'front',
  'back',
  'neck',
  'fretboard',
  'headstock',
  'pocket',
  'overview',
]
function download(data: BlobPart, name: string, mime: string) {
  const url = URL.createObjectURL(new Blob([data], { type: mime })),
    a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
export function ExportDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null),
    alive = useRef(true)
  const [snapshot] = useState(() => structuredClone(useAppStore.getState().document))
  const [options, setOptions] = useState<ExportOptions>(() =>
    structuredClone(session?.options ?? DEFAULT_EXPORT_OPTIONS),
  )
  const [format, setFormat] = useState<Format>(session?.format ?? 'pdf'),
    [paper, setPaper] = useState<Paper>(session?.paper ?? 'custom')
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  useEffect(() => {
    alive.current = true
    ref.current?.showModal()
    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => {
    session = { options, format, paper }
  }, [options, format, paper])
  const result = useMemo(() => {
    try {
      const headless = !!snapshot.neck && isHeadless(snapshot.neck.headstock.activeTemplateId)
      const activeOptions = {
        ...options,
        parts: options.parts.filter((id) => id !== 'headstock' || !headless),
      }
      const drawing = buildExportDrawing(snapshot, activeOptions)
      return {
        drawing,
        plan: format === 'pdf' ? planPdfPages(drawing, paper, options.marginMm) : null,
        error: '',
      }
    } catch (e) {
      return { drawing: null, plan: null, error: (e as Error).message }
    }
  }, [snapshot, options, format, paper])
  const preview = useMemo(
    () =>
      result.drawing
        ? svgExport(result.drawing, options.marginMm).replace(/^<\?xml[^>]*>\s*/, '')
        : '',
    [result.drawing, options.marginMm],
  )
  const change = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setError('')
    setOptions((o) => ({ ...o, [key]: value }))
  }
  const toggle = (part: ExportPart) =>
    change(
      'parts',
      options.parts.includes(part)
        ? options.parts.filter((p) => p !== part)
        : [...options.parts, part],
    )
  const chooseFormat = (f: Format) => {
    setFormat(f)
    setError('')
    setOptions((o) => ({
      ...o,
      includeCenterlines: f === 'pdf',
      includeReferences: f === 'pdf',
      includeFretGuides: f === 'pdf',
      includeMeasurements: f === 'pdf',
      includeNames: f === 'pdf',
      includeCalibration: f === 'pdf',
    }))
  }
  const run = async (print = false) => {
    if (!result.drawing || busy) return
    const popup = print ? window.open('about:blank', '_blank') : null
    if (print && !popup) {
      setError(
        'The browser blocked the PDF window. Allow pop-ups, or save the PDF and open it for printing.',
      )
      return
    }
    setBusy(true)
    setError('')
    try {
      const base = snapshot.name.replace(/[\\/:*?"<>|\r\n]/g, '-') || 'gtrfactory'
      if (format === 'pdf' || print) {
        const { pdfExport } = await import('../export/pdf')
        const bytes = await pdfExport(result.drawing, paper, options.marginMm)
        if (!alive.current) {
          popup?.close()
          return
        }
        const buffer = bytes.slice().buffer as ArrayBuffer
        if (popup) {
          const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }))
          popup.location.replace(url)
          setTimeout(() => URL.revokeObjectURL(url), 300000)
        } else download(buffer, base + '.pdf', 'application/pdf')
      } else if (format === 'svg')
        download(svgExport(result.drawing, options.marginMm), base + '.svg', 'image/svg+xml')
      else download(dxfExport(result.drawing), base + '.dxf', 'application/dxf')
    } catch (e) {
      popup?.close()
      if (alive.current) setError('Export failed: ' + (e as Error).message)
    } finally {
      if (alive.current) setBusy(false)
    }
  }
  const checkbox = (
    key:
      | 'includePickups'
      | 'includeElectronics'
      | 'includeCenterlines'
      | 'includeReferences'
      | 'includeFretGuides'
      | 'includeMeasurements'
      | 'allMeasurements'
      | 'includeNames'
      | 'includeCalibration'
      | 'includeInlays',
    label: string,
  ) => (
    <label>
      <input
        type="checkbox"
        checked={options[key]}
        onChange={(e) => change(key, e.target.checked)}
      />
      {label}
    </label>
  )
  return (
    <dialog
      className="export-dialog"
      ref={ref}
      onCancel={onClose}
      onKeyDown={(e) => e.stopPropagation()}
      aria-labelledby="export-title"
    >
      <header>
        <div>
          <h2 id="export-title">Export / print</h2>
          <p>
            Choose parts. All shapes retain 1:1 scale.{' '}
            {snapshot.handedness === 'left' ? 'Left-handed export.' : 'Right-handed export.'}
          </p>
        </div>
        <button onClick={onClose} aria-label="Close export">
          ×
        </button>
      </header>
      <div className="export-grid">
        <section className="export-settings">
          <fieldset>
            <legend>Parts</legend>
            {partOrder
              .filter(
                (id) =>
                  id !== 'headstock' ||
                  !(snapshot.neck && isHeadless(snapshot.neck.headstock.activeTemplateId)),
              )
              .map((id) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={options.parts.includes(id)}
                    onChange={() => toggle(id)}
                  />
                  {PART_NAMES[id]}
                </label>
              ))}
          </fieldset>
          <fieldset>
            <legend>File format</legend>
            <div className="export-formats">
              {(['pdf', 'svg', 'dxf'] as const).map((f) => (
                <button key={f} aria-pressed={format === f} onClick={() => chooseFormat(f)}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            {format === 'pdf' && (
              <label>
                Paper
                <select value={paper} onChange={(e) => setPaper(e.target.value as Paper)}>
                  <option value="custom">Full-size</option>
                  <option value="a4">A4, tiled 1:1</option>
                  <option value="a3">A3, tiled 1:1</option>
                </select>
              </label>
            )}
            <label>
              Margin (mm)
              <input
                aria-label="Margin (mm)"
                type="number"
                min="2"
                max="40"
                value={options.marginMm}
                onChange={(e) => change('marginMm', Number(e.target.value))}
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>Drawing contents</legend>
            {checkbox('includePickups', 'Pickup cavities on the front')}
            {checkbox('includeElectronics', 'Electronics cavity on the back')}
            {checkbox('includeCenterlines', 'Centerlines')}
            {checkbox('includeReferences', 'Nut/bridge references')}
            {checkbox('includeFretGuides', 'Fret lines on the fretboard')}
            {checkbox('includeInlays', 'Inlays on the fretboard')}
            {checkbox('includeNames', 'Part names')}
            {checkbox('includeCalibration', '100 mm calibration check')}
          </fieldset>
          <fieldset>
            <legend>Dimensions</legend>
            {checkbox('includeMeasurements', 'Dimension table')}
            {options.includeMeasurements && (
              <>
                {checkbox('allMeasurements', 'Whole-guitar dimensions')}
                <label>
                  Dimension unit
                  <select
                    value={options.measurementUnit}
                    onChange={(e) =>
                      change('measurementUnit', e.target.value as ExportOptions['measurementUnit'])
                    }
                  >
                    <option value="mm">Millimetres</option>
                    <option value="in">Inches</option>
                    <option value="both">Millimetres and inches</option>
                  </select>
                </label>
              </>
            )}
          </fieldset>
        </section>
        <section className="export-preview-section" aria-label="Export preview">
          {result.drawing && (
            <>
              <p data-testid="export-size">
                {(result.drawing.bounds.width + 2 * options.marginMm).toFixed(1)} ×{' '}
                {(result.drawing.bounds.height + 2 * options.marginMm).toFixed(1)} mm
                {result.plan ? ' · ' + result.plan.pages.length + ' pages' : ''}
              </p>
              <div className="export-preview" dangerouslySetInnerHTML={{ __html: preview }} />
              {result.plan && paper !== 'custom' && (
                <div className="export-pages" aria-label="PDF page layout">
                  {result.plan.pages.map((p, i) => (
                    <div key={i} className="export-page-tile">
                      <strong>
                        {i + 1}.{' '}
                        {p.kind === 'info'
                          ? 'Dimensions'
                          : 'R' + (p.row + 1) + ' / C' + (p.column + 1)}
                      </strong>
                      <span>
                        {p.width} × {p.height} mm
                      </span>
                      <span>
                        {p.kind === 'drawing'
                          ? 'Area ' +
                            p.source.minX.toFixed(0) +
                            ', ' +
                            p.source.minY.toFixed(0) +
                            ' mm'
                          : 'Separate information page'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {(result.error || error) && (
            <p className="export-error" role="alert">
              {result.error || error}
            </p>
          )}
          <p className="export-hint">
            {format === 'pdf'
              ? 'Print from the PDF viewer with 100% / Actual size selected. Page overlap: 10 mm.'
              : 'References and dimensions are in separate groups/layers.'}
          </p>
        </section>
      </div>
      <footer className="dialog-actions">
        <button onClick={onClose}>Cancel</button>
        {format === 'pdf' && (
          <button disabled={busy || !result.drawing} onClick={() => void run(true)}>
            Open PDF for printing
          </button>
        )}
        <button className="accent" disabled={busy || !result.drawing} onClick={() => void run()}>
          {busy ? 'Generating…' : 'Save ' + format.toUpperCase()}
        </button>
      </footer>
    </dialog>
  )
}
