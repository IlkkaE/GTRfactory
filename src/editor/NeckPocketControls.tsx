import { useEffect, useMemo, useRef, useState } from 'react'
import { deriveNeckPocket } from '../geometry/neckPocket'
import { useAppStore } from '../store'
import type { NeckPocketParams } from '../model/project'

type Field = keyof Pick<
  NeckPocketParams,
  'mouthWidthMm' | 'heelWidthMm' | 'lengthMm' | 'fitAllowanceMm' | 'radiusMm'
>
const defaults: Pick<NeckPocketParams, Field> = {
  mouthWidthMm: 56,
  heelWidthMm: 56,
  lengthMm: 76,
  fitAllowanceMm: 0,
  radiusMm: 6,
}
const labels: Record<Field, string> = {
  mouthWidthMm: 'Neck width at the joint center',
  heelWidthMm: 'Heel width at the pocket end',
  lengthMm: 'Pocket length',
  fitAllowanceMm: 'Total clearance',
  radiusMm: 'Corner radius',
}
const digits = (unit: 'mm' | 'in') => (unit === 'mm' ? 4 : 6)
const asDisplay = (mm: number, unit: 'mm' | 'in') => {
  const value = unit === 'mm' ? mm : mm / 25.4
  return value.toFixed(digits(unit)).replace(/\.?(?:0+)$/, '') || '0'
}
const maxDisplay = (mm: number, unit: 'mm' | 'in') => {
  const scale = 10 ** digits(unit),
    value = unit === 'mm' ? mm : mm / 25.4
  return (
    (Math.floor((value + 1e-10) * scale) / scale).toFixed(digits(unit)).replace(/\.?(?:0+)$/, '') ||
    '0'
  )
}

export function NeckPocketControls() {
  const s = useAppStore(),
    pocket = s.document.body.neckPocket
  const params = pocket ?? defaults,
    [draft, setDraft] = useState<Record<Field, string>>(
      () =>
        Object.fromEntries(
          (Object.keys(defaults) as Field[]).map((k) => [k, asDisplay(defaults[k], s.unit)]),
        ) as Record<Field, string>,
    )
  const [error, setError] = useState<string | null>(null)
  const skipBlur = useRef(false),
    edited = useRef(false)
  useEffect(() => {
    setDraft(
      Object.fromEntries(
        (Object.keys(defaults) as Field[]).map((k) => [k, asDisplay(params[k], s.unit)]),
      ) as Record<Field, string>,
    )
    setError(null)
    skipBlur.current = false
    edited.current = false
  }, [pocket, s.unit, s.generation])
  const maximum = useMemo(() => {
    if (!pocket) return null
    try {
      const datum = s.document.body.outline.nodes.find((n) => n.id === pocket.datumNodeId)!
      const a = (pocket.heelWidthMm - pocket.mouthWidthMm) / (2 * pocket.lengthMm)
      return deriveNeckPocket({
        mouth: pocket.referenceBoundaryNodes,
        mouthWinding: 'right-to-left',
        leftSide: { a: -a, b: datum.x - pocket.mouthWidthMm / 2 + a * datum.y },
        rightSide: { a, b: datum.x + pocket.mouthWidthMm / 2 - a * datum.y },
        endY: datum.y + pocket.lengthMm,
        fitAllowanceMm: pocket.fitAllowanceMm,
        radiusMm: 0,
      }).maxRadiusMm
    } catch {
      return null
    }
  }, [pocket, s.document.body.outline.nodes])
  const commit = (field: Field) => {
    if (skipBlur.current) {
      skipBlur.current = false
      return
    }
    if (!edited.current) return
    edited.current = false
    const raw = draft[field].trim()
    if (!raw) {
      setError(`${labels[field]} must be a number.`)
      setDraft((d) => ({ ...d, [field]: asDisplay(params[field], s.unit) }))
      return
    }
    const value = Number(raw.replace(',', '.')) * (s.unit === 'mm' ? 1 : 25.4)
    if (!Number.isFinite(value)) {
      setError(`${labels[field]} must be a number.`)
      setDraft((d) => ({ ...d, [field]: asDisplay(params[field], s.unit) }))
      return
    }
    try {
      s.configureNeckPocket({ ...params, [field]: value })
      setError(null)
    } catch (e) {
      setError((e as Error).message)
      setDraft((d) => ({ ...d, [field]: asDisplay(params[field], s.unit) }))
    }
  }
  if (s.activeView !== 'pocket') return null
  if (!pocket)
    return (
      <section className="neck-pocket-controls" aria-label="Neck pocket">
        <strong>Neck pocket</strong>
        <span className="muted">No dimension has been imported from the neck.</span>
        <button
          onClick={() => {
            try {
              s.configureNeckPocket(defaults)
              setError(null)
            } catch (e) {
              setError((e as Error).message)
            }
          }}
        >
          Define neck pocket
        </button>
        {error && (
          <p className="field-error" role="status">
            {error}
          </p>
        )}
      </section>
    )
  return (
    <section className="neck-pocket-controls" aria-label="Neck-pocket dimensions">
      <div>
        <strong>Neck pocket</strong>
        <button onClick={s.removeNeckPocket}>Delete pocket</button>
      </div>
      <span className="muted">
        No dimension has been imported from the neck. The radius is half the cutter diameter.
      </span>
      <div className="pocket-fields">
        {(Object.keys(defaults) as Field[]).map((field) => (
          <label key={field}>
            {labels[field]}{' '}
            <input
              aria-label={labels[field]}
              value={draft[field]}
              inputMode="decimal"
              onChange={(e) => {
                edited.current = true
                setDraft((d) => ({ ...d, [field]: e.target.value }))
              }}
              onBlur={() => commit(field)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') {
                  e.preventDefault()
                  skipBlur.current = true
                  edited.current = false
                  setDraft((d) => ({ ...d, [field]: asDisplay(params[field], s.unit) }))
                  e.currentTarget.blur()
                }
              }}
            />
            <span>{s.unit}</span>
          </label>
        ))}
      </div>
      <span className="muted">
        Maximum possible radius: {maximum === null ? '—' : maxDisplay(maximum, s.unit)} {s.unit}
      </span>
      {error && (
        <p className="field-error" role="status">
          {error}
        </p>
      )}
    </section>
  )
}
