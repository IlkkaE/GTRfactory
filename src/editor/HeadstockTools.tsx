import { useAppStore } from '../store'
import {
  activeHeadstockNodes,
  canSplitHeadstockSegment,
  canDeleteHeadstockNode,
  headstockWorldNodes,
  isProtectedHeadstockNode,
  HEADSTOCK_TEMPLATE_IDS,
  type HeadstockTemplateId,
} from '../headstock/template'
import { headstockTemplate } from '../headstock/variants'
import { bassDerivedLayout, bassPreset, isBassTemplate } from '../headstock/bass'
import { canSplitSegmentAt } from './segmentSelection'
import { NumericCoordinate } from './NumericCoordinate'
export function HeadstockTools() {
  const s = useAppStore(),
    doc = s.preview ?? s.document,
    h = doc.neck?.headstock
  if (!h) return null
  const nodes = activeHeadstockNodes(doc),
    single =
      s.selectedHeadstock.size === 1 ? nodes.find((n) => s.selectedHeadstock.has(n.id)) : null
  const segment = s.selectedSegment ? nodes.find((n) => n.id === s.selectedSegment) : null,
    locked = !!s.drag || !!s.neckDraft
  const index = segment ? nodes.indexOf(segment) : -1,
    canAdd =
      !!segment &&
      canSplitHeadstockSegment(doc, segment.id) &&
      canSplitSegmentAt(headstockWorldNodes(doc), index, s.selectedSegmentT)
  const confirmation = (next: HeadstockTemplateId) => {
    if (isBassTemplate(next)) {
      const p = bassPreset(next)
      return (
        'Switch to ' +
        p.strings +
        '-string bass? This replaces the neck, fretboard, pocket fit, bridge line, and headstock with ' +
        p.scale +
        ' mm / ' +
        p.frets +
        ' frets / ' +
        p.nutWidthMm +
        ' mm nut settings.'
      )
    }
    return 'Switch to guitar? This replaces bass neck, fretboard, pocket fit, bridge line, and headstock settings with the 6-string / 647.7 mm / 22-fret guitar template.'
  }
  const bassRow = isBassTemplate(h.activeTemplateId) ? bassDerivedLayout(doc) : null
  const freeCount = nodes.filter((n) => !isProtectedHeadstockNode(n.id, h)).length
  const canDelete =
    s.selectedHeadstock.size > 0 &&
    s.selectedHeadstock.size < freeCount &&
    [...s.selectedHeadstock].every((id) => canDeleteHeadstockNode(doc, id))
  return (
    <>
      <label className="headstock-model">
        Headstock{' '}
        <select
          aria-label="Headstock template"
          value={h.activeTemplateId}
          disabled={locked}
          onChange={(e) => {
            const next = e.target.value as HeadstockTemplateId
            if (
              isBassTemplate(next) !== isBassTemplate(h.activeTemplateId) ||
              (isBassTemplate(next) && next !== h.activeTemplateId)
            ) {
              if (!window.confirm(confirmation(next))) return
            }
            s.switchHeadstockTemplate(next)
          }}
        >
          {HEADSTOCK_TEMPLATE_IDS.map((id) => (
            <option
              key={id}
              value={id}
              disabled={
                !isBassTemplate(h.activeTemplateId) &&
                !isBassTemplate(id) &&
                id !== 'inline' &&
                doc.neck!.params.strings !== 6
              }
            >
              {headstockTemplate(id).name}
            </option>
          ))}
        </select>
      </label>
      {bassRow && (
        <span className="context-label" aria-label="Bass tuner row">
          Tuner row {bassRow.angleDeg!.toFixed(3)}° · pitch{' '}
          {Math.min(...bassRow.pitchesMm).toFixed(3)}–{Math.max(...bassRow.pitchesMm).toFixed(3)} mm
        </span>
      )}
      {single ? (
        <>
          <span className="context-label">
            {isProtectedHeadstockNode(single.id, h)
              ? 'Locked headstock node'
              : 'Free headstock node'}
          </span>
          <div className="coordinates">
            <NumericCoordinate axis="x" />
            <NumericCoordinate axis="y" />
          </div>
        </>
      ) : s.selectedHeadstock.size ? (
        <span className="context-label">{s.selectedHeadstock.size} nodes selected</span>
      ) : null}
      {s.selectedHeadstock.size > 0 && (
        <button onClick={s.deleteHeadstockSelected} disabled={locked || !canDelete}>
          Delete point
        </button>
      )}
      {segment && (
        <button onClick={s.addHeadstockPoint} disabled={locked || !canAdd}>
          Add point
        </button>
      )}
      <span className="context-hint">
        {segment
          ? canAdd
            ? 'The marker shows where the point will be added.'
            : "Choose a position inside the headstock's free tip edge."
          : s.selectedHeadstock.size
            ? 'Drag a free point or handle. Delete point: Delete.'
            : 'Select a tip node or edge. Fit to view restores the whole guitar.'}
      </span>
    </>
  )
}
