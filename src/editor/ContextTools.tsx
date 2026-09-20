import { useEffect, useRef, useState } from 'react'
import { PickupProfileMenu } from './PickupMenu'
import { NumericCoordinate } from './NumericCoordinate'
import { canSplitSegmentAt } from './segmentSelection'
import { isProtectedAnchor, isProtectedSegment, useAppStore } from '../store'
import { isPickupCustomized, pickupDistanceToBridge, pickupProfile } from '../pickup/profiles'
import { rearElectronicsCavityGeometry } from '../electronicsCavity'
import { HeadstockTools } from './HeadstockTools'

function PickupDistance({ id, mm }: { id: string; mm: number | null }) {
  const s = useAppStore(),
    [text, setText] = useState(''),
    [error, setError] = useState<string | null>(null),
    edited = useRef(false)
  const display = (n: number | null) =>
    n === null
      ? ''
      : (s.unit === 'mm' ? n : n / 25.4).toFixed(s.unit === 'mm' ? 1 : 3).replace('.', ',')
  useEffect(() => {
    setText(display(mm))
    setError(null)
    edited.current = false
  }, [id, mm, s.unit, s.revision])
  const apply = () => {
    if (mm === null || !edited.current) return
    const raw = text.trim().replace(',', '.')
    if (!raw) {
      setError('Enter a distance.')
      return
    }
    if (!/^\d+(?:\.\d*)?$|^\.\d+$/.test(raw) || !Number.isFinite(Number(raw))) {
      setError('Enter a positive distance.')
      return
    }
    const next = Number(raw) * (s.unit === 'in' ? 25.4 : 1),
      cavity = useAppStore.getState().document.pickupCavities.find((p) => p.id === id)
    edited.current = false
    if (cavity && Math.abs(next - mm) > 1e-8) {
      s.setPickupCenter(id, cavity.centerYmm + mm - next)
      const state = useAppStore.getState(),
        actual = state.document.pickupCavities.find((p) => p.id === id)
      setText(display(actual ? pickupDistanceToBridge(state.document, actual) : null))
      setError(state.message)
    } else setError(null)
  }
  return (
    <div className="coordinates">
      <label>
        Distance to bridge{' '}
        <input
          aria-label="Pickup-cavity distance to bridge"
          inputMode="decimal"
          value={text}
          disabled={!!s.drag || !!s.neckDraft || mm === null}
          onChange={(e) => {
            setText(e.target.value)
            edited.current = true
          }}
          onBlur={apply}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              apply()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              setText(display(mm))
              setError(null)
              edited.current = false
            }
          }}
        />{' '}
        {s.unit}
      </label>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

function PickupTransformField({
  id,
  field,
  value,
  label,
  unit = 'mm',
}: {
  id: string
  field: 'angleDeg' | 'widthMm' | 'lengthMm'
  value: number
  label: string
  unit?: 'mm' | 'deg'
}) {
  const s = useAppStore(),
    [text, setText] = useState(''),
    [error, setError] = useState<string | null>(null),
    edited = useRef(false)
  const display = (n: number) =>
    (unit === 'deg' ? n : s.unit === 'mm' ? n : n / 25.4)
      .toFixed(unit === 'deg' ? 1 : s.unit === 'mm' ? 1 : 3)
      .replace('.', ',')
  useEffect(() => {
    setText(display(value))
    setError(null)
    edited.current = false
  }, [id, field, value, s.unit, s.revision])
  const apply = () => {
    if (!edited.current) return
    const raw = text.trim().replace(',', '.')
    const next = Number(raw) * (unit === 'mm' && s.unit === 'in' ? 25.4 : 1)
    if (!raw || !/^[-+]?\d+(?:\.\d*)?$|^[-+]?\.\d+$/.test(raw) || !Number.isFinite(next)) {
      setError('Enter a valid number.')
      return
    }
    if (field === 'angleDeg' && (next < -180 || next > 180)) {
      setError('Angle must be between -180 and 180 degrees.')
      return
    }
    if (field !== 'angleDeg' && (next < 1 || next > 1000)) {
      setError('Dimensions must be between 1 and 1000 mm.')
      return
    }
    edited.current = false
    if (Math.abs(next - value) > 1e-8) {
      s.setPickupTransform(id, { [field]: next })
      const actual = useAppStore.getState().document.pickupCavities.find((p) => p.id === id)
      setText(display(actual?.[field] ?? value))
      setError(useAppStore.getState().message)
    } else setError(null)
  }
  return (
    <label>
      {label}{' '}
      <input
        aria-label={`Pickup-cavity ${label.toLowerCase()}`}
        inputMode="decimal"
        value={text}
        disabled={!!s.drag || !!s.neckDraft}
        onChange={(e) => {
          setText(e.target.value)
          edited.current = true
        }}
        onBlur={apply}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            apply()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            setText(display(value))
            setError(null)
            edited.current = false
          }
        }}
      />{' '}
      {unit === 'deg' ? 'deg' : s.unit}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}
export function ContextTools({ onSelectFit }: { onSelectFit: () => void }) {
  const s = useAppStore(),
    doc = s.preview ?? s.document,
    nodes = doc.body.outline.nodes
  const single = s.selected.size === 1 ? nodes.find((n) => s.selected.has(n.id)) : null
  const rear = s.selectedRearElectronicsCavity ? rearElectronicsCavityGeometry(doc) : null
  const pickup = s.selectedPickupId
    ? (doc.pickupCavities.find((p) => p.id === s.selectedPickupId) ?? null)
    : null
  const pickupModel = pickup ? pickupProfile(pickup.profileId, pickup.profileVersion) : null
  const pickupDistance = pickup ? pickupDistanceToBridge(doc, pickup) : null
  const index = nodes.findIndex((n) => n.id === s.selectedSegment),
    segment = nodes[index]
  const protectedNode = [...s.selected].some((id) => isProtectedAnchor(doc, id))
  const protectedSegment = !!segment && isProtectedSegment(doc, segment.id),
    locked = !!s.drag || !!s.neckDraft
  const context = s.neckDraft
    ? 'neck'
    : s.editingTarget === 'headstock'
      ? 'headstock'
      : rear
        ? 'electronics-cavity'
        : pickup
          ? 'pickup'
          : segment
            ? 'segment'
            : single
              ? protectedNode
                ? 'protected'
                : 'node'
              : s.selected.size
                ? 'multiple'
                : 'empty'
  const fitLink = doc.neck && (
    <button onClick={onSelectFit} disabled={!!s.drag}>
      Neck fit
    </button>
  )
  return (
    <section className="context-tools" data-context={context} aria-label="Selection tools">
      <div className="context-content">
        {s.neckDraft ? (
          <span className="muted">
            {s.neckDraft.pending
              ? 'A neck change is in progress — accept or cancel the changes.'
              : 'Neck settings opened.'}
          </span>
        ) : s.editingTarget === 'headstock' ? (
          <HeadstockTools />
        ) : rear ? (
          <>
            <span className="context-label">Electronics cavity</span>
            <span>
              Width:{' '}
              {s.unit === 'mm'
                ? rear.bounds.height.toFixed(1)
                : (rear.bounds.height / 25.4).toFixed(3)}{' '}
              {s.unit}
            </span>
            <span>
              Height:{' '}
              {s.unit === 'mm'
                ? rear.bounds.width.toFixed(1)
                : (rear.bounds.width / 25.4).toFixed(3)}{' '}
              {s.unit}
            </span>
            <span
              className={rear.diagnostic ? 'context-hint field-error' : 'context-hint'}
              role={rear.diagnostic ? 'status' : undefined}
            >
              {rear.diagnostic?.message ??
                'Drag the cavity or its side handle. Both edges stretch together.'}
            </span>
          </>
        ) : pickup && pickupModel ? (
          <>
            <span className="context-label">
              {pickupModel.name}
              {isPickupCustomized(pickup) ? ' (custom)' : ''}
            </span>
            <div className="coordinates">
              <PickupTransformField
                id={pickup.id}
                field="angleDeg"
                value={pickup.angleDeg}
                label="Angle"
                unit="deg"
              />
              <PickupTransformField
                id={pickup.id}
                field="widthMm"
                value={pickup.widthMm}
                label="Width"
              />
              <PickupTransformField
                id={pickup.id}
                field="lengthMm"
                value={pickup.lengthMm}
                label="Length"
              />
            </div>
            <PickupDistance id={pickup.id} mm={pickupDistance} />
            <div className="context-actions">
              <PickupProfileMenu
                key={pickup.id}
                label="Change profile"
                current={pickup.profileId}
                disabled={locked}
                onChoose={(id, version) => s.changePickupProfile(pickup.id, id, version)}
              />
              <button onClick={() => s.deletePickup(pickup.id)} disabled={locked}>
                Delete
              </button>
            </div>
            <span className="context-hint">
              Drag the cavity along the centerline. The distance is measured from the cavity center
              to the bridge contact line.
            </span>
          </>
        ) : segment ? (
          <>
            <span className="context-label">
              {protectedSegment ? 'Locked joint edge' : 'Selected edge'}
            </span>
            <div className="context-actions">
              <button
                onClick={() => s.addPoint()}
                disabled={
                  locked || protectedSegment || !canSplitSegmentAt(nodes, index, s.selectedSegmentT)
                }
              >
                Add point
              </button>
              <button
                onClick={() => s.setSegmentCubic(false)}
                aria-pressed={segment.outgoing === 'line'}
                disabled={locked || protectedSegment}
              >
                Straight
              </button>
              <button
                onClick={() => s.setSegmentCubic(true)}
                aria-pressed={segment.outgoing === 'cubicBezier'}
                disabled={locked || protectedSegment}
              >
                Curve
              </button>
              {protectedSegment && fitLink}
            </div>
            <span className="context-hint">
              {protectedSegment
                ? 'The neck-joint edge is protected.'
                : canSplitSegmentAt(nodes, index, s.selectedSegmentT)
                  ? 'The marker shows where the point will be added.'
                  : 'Choose a position inside the edge.'}
            </span>
          </>
        ) : single ? (
          <>
            <span className="context-label">
              {protectedNode ? 'Locked neck joint' : 'Selected node'}
            </span>
            <div className="coordinates">
              <NumericCoordinate axis="x" />
              <NumericCoordinate axis="y" />
            </div>
            <div className="context-actions">
              <button
                onClick={() => s.setKind('smooth')}
                aria-pressed={single.kind === 'smooth'}
                disabled={locked || protectedNode}
              >
                Smooth
              </button>
              <button
                onClick={() => s.setKind('corner')}
                aria-pressed={single.kind === 'corner'}
                disabled={locked || protectedNode}
              >
                Corner
              </button>
              <button onClick={s.deleteSelected} disabled={locked || protectedNode}>
                Delete point
              </button>
              {protectedNode && fitLink}
            </div>
            {protectedNode && (
              <span className="context-hint">
                The neck joint is protected; the center point remains in place.
              </span>
            )}
          </>
        ) : s.selected.size ? (
          <>
            <span className="context-label">{s.selected.size} nodes selected</span>
            <div className="context-actions">
              <button onClick={s.deleteSelected} disabled={locked || protectedNode}>
                Delete point
              </button>
            </div>
            <span className="context-hint">
              {protectedNode ? 'Locked points remain in place. ' : ' '}Drag to move, or use the
              arrow keys.
            </span>
          </>
        ) : (
          <span className="muted">
            Select a node, edge, neck, headstock, or pickup cavity. Use the pocket corner to adjust
            the radius.
          </span>
        )}
      </div>
    </section>
  )
}
