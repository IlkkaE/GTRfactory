import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store'
import type { NeckDocument, NeckParams, Unit } from '../model/project'
import { parseFretFactoryUrl } from '../neck/importFretFactory'
import { bassPreset, isBassTemplate, type BassTemplateId } from '../headstock/bass'

const labels: Record<string, string> = {
  strings: 'Strings',
  frets: 'Frets',
  scaleTreble: 'Treble scale length',
  scaleBass: 'Bass scale length',
  anchorFret: 'Straight-fret number',
  stringSpanNut: 'String spacing at nut',
  stringSpanBridge: 'String spacing at bridge',
  overhang: 'Side edge clearance',
  curvedExponent: 'Curvature exponent',
  joinFret: 'Fret at center node',
  offsetMm: 'Length offset',
  endMarginMm: 'Neck end allowance',
  fretboardEndMarginMm: 'Fretboard end allowance',
  radiusMm: 'Corner radius',
  fitAllowanceMm: 'Total clearance',
}
const paramKeys = [
  'strings',
  'frets',
  'scaleTreble',
  'scaleBass',
  'anchorFret',
  'stringSpanNut',
  'stringSpanBridge',
  'overhang',
  'curvedExponent',
]
const groups = {
  'Basic dimensions': [
    'strings',
    'frets',
    'scaleTreble',
    'scaleBass',
    'stringSpanNut',
    'stringSpanBridge',
    'overhang',
    'joinFret',
  ],
  Fit: ['endMarginMm', 'fretboardEndMarginMm', 'radiusMm', 'fitAllowanceMm'],
  'Advanced settings': ['anchorFret', 'curvedExponent'],
  Inlays: [],
  Import: [],
}
const isLength = (key: string) =>
  !['strings', 'frets', 'anchorFret', 'curvedExponent', 'joinFret'].includes(key)
const display = (n: number, unit: Unit, key: string) =>
  String(Number((isLength(key) && unit === 'in' ? n / 25.4 : n).toFixed(6)))
const number = (text: string) => (text.trim() ? Number(text.replace(',', '.')) : NaN)
const values = (neck: NeckDocument) => ({
  ...neck.params,
  ...neck.placement,
  ...neck.end,
  ...(isBassTemplate(neck.headstock.activeTemplateId)
    ? { nutWidthMm: neck.physicalProfile!.nutWidthMm }
    : {}),
})
const lockedBassFields = new Set([
  'strings',
  'frets',
  'scaleTreble',
  'scaleBass',
  'stringSpanBridge',
  'overhang',
  'anchorFret',
  'curvedExponent',
])
const draftFor = (numbers: Record<string, number>, unit: Unit) =>
  Object.fromEntries(Object.entries(numbers).map(([key, n]) => [key, display(n, unit, key)]))

export type NeckFocusRequest = {
  group: keyof typeof groups
  field?: 'radiusMm' | null
  token: number
}
export function NeckWorkspace({
  focusRequest = null,
  onRadiusActive,
}: {
  focusRequest?: NeckFocusRequest | null
  onRadiusActive?: (active: boolean) => void
}) {
  const s = useAppStore(),
    draft = s.neckDraft!,
    neck = draft.document.neck!
  const bassTemplateId = isBassTemplate(neck.headstock.activeTemplateId)
    ? neck.headstock.activeTemplateId
    : null
  const bass = bassTemplateId !== null
  const bassLimits = bassTemplateId ? bassPreset(bassTemplateId) : null
  const originals = useRef<Record<string, number>>(values(neck))
  const [form, setForm] = useState(() => ({
    unit: s.unit,
    fields: draftFor(originals.current, s.unit),
  }))
  const [group, setGroup] = useState<keyof typeof groups>(
      focusRequest?.group ?? 'Basic dimensions',
    ),
    [url, setUrl] = useState('')
  const radiusInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (focusRequest) setGroup(focusRequest.group)
  }, [focusRequest])
  useEffect(() => {
    if (!focusRequest?.field || group !== focusRequest.group) return
    radiusInput.current?.focus({ preventScroll: true })
    radiusInput.current?.select()
  }, [focusRequest, group])
  useEffect(() => {
    setForm((previous) => {
      if (previous.unit === s.unit) return previous
      const fields = Object.fromEntries(
        Object.entries(previous.fields).map(([key, text]) => {
          if (!isLength(key) || !Number.isFinite(number(text))) return [key, text]
          if (text === display(originals.current[key], previous.unit, key))
            return [key, display(originals.current[key], s.unit, key)]
          const mm = number(text) * (previous.unit === 'in' ? 25.4 : 1)
          return [key, String(Number((s.unit === 'in' ? mm / 25.4 : mm).toPrecision(12)))]
        }),
      )
      return { unit: s.unit, fields }
    })
  }, [s.unit])
  const alignToJoin = () => {
    const fields = { ...form.fields, offsetMm: '0' }
    setForm({ ...form, fields })
    update(fields)
  }
  const legacyOffset = number(form.fields.offsetMm ?? '')
  const update = (fields: Record<string, string>) => {
    try {
      const parsed: Record<string, number> = {}
      for (const key of Object.keys(labels)) {
        const text = fields[key] ?? '',
          n = number(text)
        if (!Number.isFinite(n)) throw new Error(`${labels[key]} must be a number.`)
        parsed[key] =
          text === display(originals.current[key], form.unit, key)
            ? originals.current[key]
            : n * (isLength(key) && form.unit === 'in' ? 25.4 : 1)
      }
      if (bass) {
        const nutText = fields.nutWidthMm ?? ''
        const nut = number(nutText)
        if (!Number.isFinite(nut)) throw new Error('Nut width must be a number.')
        const nutWidthMm =
          nutText === display(originals.current.nutWidthMm, form.unit, 'nutWidthMm')
            ? originals.current.nutWidthMm
            : nut * (form.unit === 'in' ? 25.4 : 1)
        parsed.stringSpanNut = nutWidthMm - 2 * parsed.overhang
      }
      s.previewWholeNeck({
        params: Object.fromEntries(
          paramKeys.map((key) => [key, parsed[key]]),
        ) as unknown as NeckParams,
        placement: { joinFret: parsed.joinFret, offsetMm: parsed.offsetMm },
        end: {
          endMarginMm: parsed.endMarginMm,
          fretboardEndMarginMm: parsed.fretboardEndMarginMm,
          radiusMm: parsed.radiusMm,
          fitAllowanceMm: parsed.fitAllowanceMm,
        },
      })
    } catch (e) {
      s.invalidateNeckDraft((e as Error).message)
    }
  }
  const importUrl = () => {
    try {
      const params = parseFretFactoryUrl(url.trim())
      originals.current = { ...originals.current, ...params }
      const nextOriginals = { ...originals.current, ...params }
      originals.current = nextOriginals
      const fields = {
        ...form.fields,
        ...draftFor(params as unknown as Record<string, number>, form.unit),
      }
      setForm({ ...form, fields })
      update(fields)
    } catch (e) {
      s.invalidateNeckDraft((e as Error).message)
    }
  }
  return (
    <section
      className="neck-dock"
      aria-label="Neck settings"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          s.cancelNeckDraft()
        }
      }}
    >
      <div className="neck-heading">
        <h2>Neck settings</h2>
        <div className="neck-groups" role="tablist" aria-label="Neck setting groups">
          {(Object.keys(groups) as Array<keyof typeof groups>).map((key) => (
            <button
              key={key}
              role="tab"
              id={`neck-tab-${key.replaceAll(' ', '-')}`}
              aria-selected={group === key}
              aria-controls="neck-fields-panel"
              onClick={() => {
                setGroup(key)
                onRadiusActive?.(key === 'Fit' && !!focusRequest?.field)
              }}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="neck-actions">
          <button className="accent" onClick={s.applyNeckDraft} disabled={!!draft.error}>
            Accept
          </button>
          <button onClick={s.cancelNeckDraft}>Cancel changes</button>
        </div>
      </div>
      <div
        className="neck-content"
        id="neck-fields-panel"
        role="tabpanel"
        aria-labelledby={`neck-tab-${group.replaceAll(' ', '-')}`}
      >
        {draft.creation && s.document.body.neckPocket && (
          <p className="field-hint">
            Accepting replaces the existing pocket draft with a pocket derived from the neck.
          </p>
        )}
        {group === 'Inlays' ? (
          <div className="neck-inlays">
            {(() => {
              const inlays = draft.document.fretboardInlays ?? s.document.fretboardInlays
              if (!inlays || !inlays.enabled) {
                return (
                  <div className="inlay-empty-state">
                    <button
                      type="button"
                      className="accent"
                      onClick={() => s.setInlayEnabled(true)}
                    >
                      Enable fretboard inlays
                    </button>
                    <p className="field-hint">
                      Add fretboard position markers (dots, blocks, trapezoids, diamonds or custom
                      shapes).
                    </p>
                  </div>
                )
              }
              const fretCount = draft.change.params.frets
              return (
                <div className="inlay-controls-columns">
                  {/* Left Column: Marked frets & Double inlays */}
                  <div className="inlay-column inlay-fret-column">
                    <div className="inlay-subpanel">
                      <div className="inlay-subpanel-header">
                        <h4>Marked frets ({inlays.markedFrets.length} active)</h4>
                        <div className="inlay-fret-quick-actions">
                          <button
                            type="button"
                            onClick={() => {
                              const std = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].filter(
                                (f) => f <= fretCount,
                              )
                              std.forEach((f) => {
                                if (!inlays.markedFrets.includes(f)) s.toggleInlayFret(f)
                              })
                              inlays.markedFrets.forEach((f) => {
                                if (!std.includes(f)) s.toggleInlayFret(f)
                              })
                            }}
                          >
                            Standard (3, 5, 7, 9, 12...)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              for (let f = 1; f <= fretCount; f++) {
                                if (!inlays.markedFrets.includes(f)) s.toggleInlayFret(f)
                              }
                            }}
                          >
                            All frets
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              ;[...inlays.markedFrets].forEach((f) => s.toggleInlayFret(f))
                            }}
                          >
                            Clear all
                          </button>
                        </div>
                      </div>
                      <div className="inlay-fret-row">
                        {Array.from({ length: fretCount }, (_, i) => i + 1).map((fret) => {
                          const isMarked = inlays.markedFrets.includes(fret)
                          const isDouble = inlays.doubleInlayFrets.includes(fret)
                          return (
                            <button
                              key={fret}
                              type="button"
                              aria-pressed={isMarked}
                              className={`inlay-fret-toggle ${isMarked ? 'active' : ''} ${isDouble ? 'double' : ''}`}
                              onClick={() => s.toggleInlayFret(fret)}
                            >
                              {fret}
                              {isDouble ? ' ×2' : ''}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="inlay-subpanel">
                      <div className="inlay-subpanel-header">
                        <h4>Double inlays (e.g. 12th, 24th fret)</h4>
                        <div className="inlay-inline-spacing">
                          <span>Double marker spacing ({form.unit}):</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={display(inlays.doubleInlaySpacingMm, form.unit, 'stringSpanNut')}
                            onChange={(e) => {
                              const val = number(e.target.value)
                              if (Number.isFinite(val) && val >= 0) {
                                s.setInlayDoubleSpacing(form.unit === 'in' ? val * 25.4 : val)
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="inlay-fret-row">
                        {Array.from({ length: fretCount }, (_, i) => i + 1).map((fret) => {
                          const isDouble = inlays.doubleInlayFrets.includes(fret)
                          return (
                            <button
                              key={fret}
                              type="button"
                              aria-pressed={isDouble}
                              className={`inlay-fret-toggle ${isDouble ? 'active double' : ''}`}
                              onClick={() => s.toggleDoubleInlayFret(fret)}
                            >
                              {fret}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Inlay actions, Preset shapes and Size/scaling */}
                  <div className="inlay-column inlay-settings-column">
                    <div className="inlay-settings-actions">
                      <button
                        type="button"
                        className="accent"
                        onClick={() => s.setActiveWorkspace('inlays')}
                      >
                        Open Inlay Designer
                      </button>
                      <button type="button" onClick={() => s.setInlayEnabled(false)}>
                        Disable inlays
                      </button>
                    </div>

                    <div className="inlay-subpanel">
                      <div className="inlay-subpanel-header">
                        <h4>Shape preset</h4>
                      </div>
                      <div className="inlay-preset-buttons">
                        {(['circle', 'diamond', 'block', 'trapezoid', 'star'] as const).map(
                          (preset) => (
                            <button
                              key={preset}
                              type="button"
                              aria-pressed={inlays.shape.presetId === preset}
                              className={inlays.shape.presetId === preset ? 'active' : ''}
                              onClick={() => s.setInlayPreset(preset)}
                            >
                              {preset.charAt(0).toUpperCase() + preset.slice(1)}
                            </button>
                          ),
                        )}
                        {inlays.shape.presetId === 'custom' && (
                          <button type="button" aria-pressed={true} className="active" disabled>
                            Custom
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="inlay-subpanel">
                      <div className="inlay-subpanel-header">
                        <h4>Scaling mode & size</h4>
                      </div>
                      <div className="inlay-scaling-row">
                        <div className="inlay-preset-buttons">
                          {(['fixedMm', 'proportionalPercent', 'stretchBlock'] as const).map(
                            (mode) => (
                              <button
                                key={mode}
                                type="button"
                                aria-pressed={inlays.scalingMode === mode}
                                className={inlays.scalingMode === mode ? 'active' : ''}
                                onClick={() => s.setInlayScalingMode(mode)}
                              >
                                {mode === 'fixedMm'
                                  ? 'Fixed mm'
                                  : mode === 'proportionalPercent'
                                    ? 'Proportional %'
                                    : 'Stretch to fret'}
                              </button>
                            ),
                          )}
                        </div>
                        {inlays.scalingMode === 'fixedMm' && (
                          <div className="inlay-inline-spacing">
                            <span>Diameter ({form.unit}):</span>
                            <input
                              type="number"
                              min="1"
                              step="0.5"
                              value={display(inlays.fixedDiameterMm, form.unit, 'stringSpanNut')}
                              onChange={(e) => {
                                const val = number(e.target.value)
                                if (Number.isFinite(val) && val > 0) {
                                  s.setInlayFixedDiameter(form.unit === 'in' ? val * 25.4 : val)
                                }
                              }}
                            />
                          </div>
                        )}
                        {inlays.scalingMode === 'proportionalPercent' && (
                          <div className="inlay-inline-inputs">
                            <label className="inlay-compact-label">
                              Width %:
                              <input
                                type="number"
                                min="5"
                                max="100"
                                step="5"
                                value={inlays.widthPercentage ?? inlays.fillPercentage}
                                onChange={(e) => {
                                  const val = number(e.target.value)
                                  if (Number.isFinite(val) && val >= 5 && val <= 100) {
                                    s.setInlayWidthPercentage(val)
                                  }
                                }}
                              />
                            </label>
                            <label className="inlay-compact-label">
                              Height %:
                              <input
                                type="number"
                                min="5"
                                max="100"
                                step="5"
                                value={inlays.heightPercentage ?? inlays.fillPercentage}
                                onChange={(e) => {
                                  const val = number(e.target.value)
                                  if (Number.isFinite(val) && val >= 5 && val <= 100) {
                                    s.setInlayHeightPercentage(val)
                                  }
                                }}
                              />
                            </label>
                          </div>
                        )}
                        {inlays.scalingMode === 'stretchBlock' && (
                          <div className="inlay-inline-inputs">
                            <label className="inlay-compact-label">
                              Fret ({form.unit}):
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={display(
                                  inlays.blockMargins.fretMm,
                                  form.unit,
                                  'stringSpanNut',
                                )}
                                onChange={(e) => {
                                  const val = number(e.target.value)
                                  if (Number.isFinite(val) && val >= 0) {
                                    s.setInlayBlockMargins({
                                      ...inlays.blockMargins,
                                      fretMm: form.unit === 'in' ? val * 25.4 : val,
                                    })
                                  }
                                }}
                              />
                            </label>
                            <label className="inlay-compact-label">
                              Edge ({form.unit}):
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={display(
                                  inlays.blockMargins.edgeMm,
                                  form.unit,
                                  'stringSpanNut',
                                )}
                                onChange={(e) => {
                                  const val = number(e.target.value)
                                  if (Number.isFinite(val) && val >= 0) {
                                    s.setInlayBlockMargins({
                                      ...inlays.blockMargins,
                                      edgeMm: form.unit === 'in' ? val * 25.4 : val,
                                    })
                                  }
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        ) : group === 'Import' ? (
          <div className="neck-import">
            <label>
              FretFactory URL or #state
              <input
                aria-label="FretFactory-URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…/#state=…"
                disabled={bass}
              />
            </label>
            <button onClick={importUrl} disabled={bass}>
              Import FretFactory design
            </button>
            <p className="field-hint">
              {bass
                ? 'The bass template locks imported string geometry. Use the total nut width and permitted fit controls.'
                : 'Import updates the draft. Accept applies it.'}
            </p>
          </div>
        ) : (
          <div className="neck-fields">
            {bass && group === 'Basic dimensions' && (
              <label>
                Nut width
                <span className="field-unit">{form.unit}</span>
                <input
                  aria-label="Nut width"
                  min={bassLimits ? display(bassLimits.nutMin, form.unit, 'nutWidthMm') : undefined}
                  max={bassLimits ? display(bassLimits.nutMax, form.unit, 'nutWidthMm') : undefined}
                  inputMode="decimal"
                  value={form.fields.nutWidthMm ?? ''}
                  onChange={(e) => {
                    const fields = { ...form.fields, nutWidthMm: e.target.value }
                    setForm({ ...form, fields })
                    update(fields)
                  }}
                />
              </label>
            )}
            {bass && group === 'Basic dimensions' && (
              <p className="field-hint">
                Bass template: total nut width{' '}
                {display(bassLimits!.nutMin, form.unit, 'nutWidthMm')}–
                {display(bassLimits!.nutMax, form.unit, 'nutWidthMm')} {form.unit}. String count,
                scale, bridge spacing and edge clearance are locked.
              </p>
            )}
            {groups[group]
              .filter((key) => !(bass && key === 'stringSpanNut'))
              .map((key) => (
                <label key={key}>
                  {labels[key]}
                  {isLength(key) && <span className="field-unit">{form.unit}</span>}
                  <input
                    ref={key === 'radiusMm' ? radiusInput : undefined}
                    onFocus={() => onRadiusActive?.(key === 'radiusMm')}
                    aria-label={labels[key]}
                    disabled={bass && lockedBassFields.has(key)}
                    inputMode="decimal"
                    value={form.fields[key] ?? ''}
                    onChange={(e) => {
                      const fields = { ...form.fields, [key]: e.target.value }
                      if (key === 'joinFret') fields.offsetMm = '0'
                      setForm({ ...form, fields })
                      update(fields)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        s.applyNeckDraft()
                      }
                    }}
                  />
                </label>
              ))}
          </div>
        )}
        {Number.isFinite(legacyOffset) && Math.abs(legacyOffset) > 1e-8 && (
          <p className="field-hint">
            Legacy-project length offset {form.fields.offsetMm} {form.unit} remains until you align
            it.{' '}
            <button type="button" onClick={alignToJoin}>
              Align fret to center node
            </button>
          </p>
        )}
        {group === 'Fit' && (
          <p className="field-hint">
            Total clearance is split evenly between the sides. Both end allowances start at the rear
            edge of the last fret. Fretboard overhang:{' '}
            {display(
              neck.end.fretboardEndMarginMm - neck.end.endMarginMm,
              form.unit,
              'endMarginMm',
            )}{' '}
            {form.unit}.
            {neck.end.fitAllowanceMm < 0
              ? ' Negative clearance makes the pocket narrower than the neck.'
              : ''}
          </p>
        )}
      </div>
      {draft.error && (
        <p className="field-error" role="status">
          {draft.error} The images show the last valid draft.
        </p>
      )}
    </section>
  )
}
