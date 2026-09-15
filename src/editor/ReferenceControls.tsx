import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { bounds } from '../geometry/outline'
import {
  centerReference,
  readReferenceFile,
  referenceHeight,
  validRasterHeader,
  type ReferenceOverlay,
} from '../file/referenceOverlay'
import { useAppStore } from '../store'
import './referenceControls.css'

type Props = {
  reference: ReferenceOverlay | null
  onChange: (next: ReferenceOverlay | null) => void
}
const numeric = (text: string) =>
  /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text.trim().replace(',', '.'))
    ? Number(text.trim().replace(',', '.'))
    : null
function Field({
  label,
  value,
  unit,
  onCommit,
}: {
  label: string
  value: number
  unit: string
  onCommit: (value: number) => boolean
}) {
  const shown = String(Number(value.toFixed(unit === 'mm' ? 3 : 5))),
    [draft, setDraft] = useState(shown),
    edited = useRef(false)
  useEffect(() => {
    setDraft(shown)
    edited.current = false
  }, [shown])
  const apply = () => {
    if (!edited.current) return
    edited.current = false
    const parsed = numeric(draft)
    if (parsed === null || !Number.isFinite(parsed) || !onCommit(parsed)) setDraft(shown)
  }
  return (
    <label>
      {label}{' '}
      <input
        aria-label={label}
        inputMode="decimal"
        value={draft}
        onChange={(e) => {
          edited.current = true
          setDraft(e.target.value)
        }}
        onBlur={apply}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            apply()
            e.currentTarget.blur()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            edited.current = false
            setDraft(shown)
            e.currentTarget.blur()
          }
        }}
      />
      <span>{unit}</span>
    </label>
  )
}
async function verifyDecode(file: File) {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file)
    try {
      return validRasterHeader({ kind: 'png', width: bitmap.width, height: bitmap.height })
    } finally {
      bitmap.close()
    }
  }
  return await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file),
      image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      try {
        resolve(
          validRasterHeader({
            kind: 'png',
            width: image.naturalWidth,
            height: image.naturalHeight,
          }),
        )
      } catch (error) {
        reject(error)
      }
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('The image could not be opened.'))
    }
    image.src = url
  })
}
export function ReferenceControls({ reference, onChange }: Props) {
  const s = useAppStore(),
    input = useRef<HTMLInputElement>(null),
    token = useRef(0),
    url = useRef<string | null>(null),
    [open, setOpen] = useState(false)
  const release = () => {
    if (url.current) {
      URL.revokeObjectURL(url.current)
      url.current = null
    }
  }
  useEffect(
    () => () => {
      token.current++
      release()
    },
    [],
  )
  useEffect(() => {
    token.current++
    if (reference) {
      release()
      onChange(null)
    } else release()
  }, [s.generation])
  const replace = (next: ReferenceOverlay) => {
    release()
    if (next.source.kind === 'raster') url.current = next.source.url
    onChange(next)
    setOpen(true)
  }
  const load = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const active = ++token.current,
      generation = s.generation
    try {
      const read = await readReferenceFile(file)
      const decoded = read.source.kind === 'raster' ? await verifyDecode(file) : null
      if (active !== token.current || generation !== useAppStore.getState().generation) return
      const body = bounds(
        (useAppStore.getState().preview ?? useAppStore.getState().document).body.outline.nodes,
      )
      if (read.source.kind === 'project')
        replace({
          name: read.name,
          source: read.source,
          visible: true,
          opacity: 0.38,
          x: 0,
          y: 0,
          scale: 1,
        })
      else {
        const urlValue = URL.createObjectURL(file),
          source = { ...read.source, pixelWidth: decoded!.width, pixelHeight: decoded!.height },
          scale = Math.min(body.width / source.pixelWidth, body.height / source.pixelHeight)
        replace({
          name: read.name,
          source: { ...source, url: urlValue },
          visible: true,
          opacity: 0.38,
          x: (body.minX + body.maxX) / 2,
          y: (body.minY + body.maxY) / 2,
          scale,
        })
      }
      s.setMessage('Reference overlay loaded. It is not saved in the project.')
    } catch (error) {
      if (active === token.current)
        s.setMessage(`Reference-overlay load failed: ${(error as Error).message}`)
    }
  }
  const set = (patch: Partial<ReferenceOverlay>) => {
    if (reference) onChange({ ...reference, ...patch })
  }
  const coordinate = (value: number) => Number.isFinite(value) && Math.abs(value) <= 1_000_000
  const unitValue = (v: number) => (s.unit === 'mm' ? v : v / 25.4),
    mmValue = (v: number) => (s.unit === 'mm' ? v : v * 25.4)
  return (
    <section className="reference-controls" aria-label="Reference overlay">
      <div className="reference-head">
        <button aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          Reference overlay {reference ? '▾' : '+'}
        </button>
        {reference && (
          <span className="reference-name" title={reference.name}>
            {reference.name}
          </span>
        )}
      </div>
      {open && (
        <div className="reference-panel">
          <p>The reference overlay is not saved in the project.</p>
          <button onClick={() => input.current?.click()}>Load reference overlay</button>
          <input
            ref={input}
            hidden
            type="file"
            accept=".gtrfactory,image/png,image/jpeg"
            onChange={load}
          />
          {reference && (
            <>
              <label className="reference-check">
                <input
                  type="checkbox"
                  checked={reference.visible}
                  onChange={(e) => set({ visible: e.target.checked })}
                />{' '}
                Show
              </label>
              <label>
                Opacity{' '}
                <input
                  aria-label="Opacity"
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.01"
                  value={reference.opacity}
                  onChange={(e) => set({ opacity: Number(e.target.value) })}
                />
              </label>
              <div className="reference-fields">
                <Field
                  label="X offset"
                  value={unitValue(reference.x)}
                  unit={s.unit}
                  onCommit={(v) => {
                    const mm = mmValue(v)
                    if (!coordinate(mm)) return false
                    set({ x: mm })
                    return true
                  }}
                />
                <Field
                  label="Y offset"
                  value={unitValue(reference.y)}
                  unit={s.unit}
                  onCommit={(v) => {
                    const mm = mmValue(v)
                    if (!coordinate(mm)) return false
                    set({ y: mm })
                    return true
                  }}
                />
                <Field
                  label="Height"
                  value={unitValue(referenceHeight(reference))}
                  unit={s.unit}
                  onCommit={(v) => {
                    const original = referenceHeight({ ...reference, scale: 1 }),
                      mm = mmValue(v),
                      scale = mm / original
                    if (
                      !Number.isFinite(scale) ||
                      !coordinate(mm) ||
                      mm <= 0 ||
                      original <= 0 ||
                      scale <= 0 ||
                      scale > 1_000_000
                    )
                      return false
                    set({ scale })
                    return true
                  }}
                />
              </div>
              <button
                onClick={() =>
                  onChange(
                    centerReference(
                      reference,
                      bounds((s.preview ?? s.document).body.outline.nodes),
                    ),
                  )
                }
              >
                Center
              </button>
              <button
                onClick={() => {
                  token.current++
                  release()
                  onChange(null)
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
