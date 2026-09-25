import { useEffect, useMemo, useRef, useState } from 'react'
import { bounds, geometryWarning } from './geometry/outline'
import { deriveNeckPocket, pocketContainmentWarning } from './geometry/neckPocket'
import { neckTemplate, useAppStore } from './store'
import { EditorCanvas, isTyping } from './editor/EditorCanvas'
import { FileActions } from './editor/FileActions'
import { ContextTools } from './editor/ContextTools'
import { PickupMenu } from './editor/PickupMenu'
import { BodyColorPicker } from './editor/BodyColorPicker'
import { ReferenceControls } from './editor/ReferenceControls'
import { InlayDesignerWorkspace } from './inlays/InlayDesignerWorkspace'
import { NeckWorkspace, type NeckFocusRequest } from './editor/NeckWorkspace'
import { automaticPocket } from './neck/automaticPocket'
import { headstockFit, headstockWorldNodes, isHeadless } from './headstock/template'
import { isBassTemplate } from './headstock/bass'
import { frontBounds, neckView, pointBounds } from './neck/neckView'
import type { ReferenceOverlay } from './file/referenceOverlay'
import { nextGridSize, type GridSizeMm } from './editor/grid'
import { presentation, screenDeltaToWorld } from './editor/viewport'
import './styles.css'
const views = ['front', 'back', 'pocket'] as const
export function App() {
  const s = useAppStore(),
    [name, setName] = useState(s.document.name),
    [panMode, setPanMode] = useState(false),
    [reference, setReference] = useState<ReferenceOverlay | null>(null),
    [showOriginalBody, setShowOriginalBody] = useState(true),
    [gridMm, setGridMm] = useState<GridSizeMm>(0),
    [headstockConfirm, setHeadstockConfirm] = useState(false),
    headstockDialog = useRef<HTMLDialogElement>(null),
    headstockCancel = useRef<HTMLButtonElement>(null)
  const [neckFocus, setNeckFocus] = useState<NeckFocusRequest | null>(null),
    [radiusActive, setRadiusActive] = useState(false),
    [headstockFocus, setHeadstockFocus] = useState(false)
  const doc = s.preview ?? s.document,
    b = useMemo(() => bounds(doc.body.outline.nodes), [doc])
  const template = useMemo(() => neckTemplate(doc), [doc])
  const frontBox = useMemo(() => frontBounds(template ?? doc), [template, doc])
  const headstockBox = useMemo(() => neckView(doc)?.headstock?.bounds ?? frontBox, [doc, frontBox])
  const fits = useRef({ generation: s.generation, boxes: { front: frontBox, back: b, pocket: b } })
  if (fits.current.generation !== s.generation)
    fits.current = { generation: s.generation, boxes: { front: frontBox, back: b, pocket: b } }
  useEffect(() => {
    if (headstockFocus && s.editingTarget !== 'headstock') {
      fits.current.boxes.front = frontBox
      setHeadstockFocus(false)
      s.resetCamera('front')
    }
  }, [s.editingTarget, s.generation, headstockFocus, frontBox])
  const lastHeadstockTemplate = useRef(doc.neck?.headstock.activeTemplateId)
  useEffect(() => {
    const id = doc.neck?.headstock.activeTemplateId
    if (lastHeadstockTemplate.current !== id) {
      lastHeadstockTemplate.current = id
      if (headstockFocus && s.editingTarget === 'headstock') {
        fits.current.boxes.front = headstockBox
        s.resetCamera('front')
      }
    }
  }, [doc.neck?.headstock.activeTemplateId, headstockFocus, headstockBox, s.editingTarget])
  const warning = useMemo(() => geometryWarning(doc.body.outline.nodes), [doc])
  const headstockStatus = useMemo(() => (doc.neck ? headstockFit(doc) : null), [doc])
  const pocketWarning = useMemo(() => {
    const automatic = automaticPocket(doc)
    if (automatic) return pocketContainmentWarning(doc.body.outline.nodes, automatic)
    const p = doc.body.neckPocket
    if (!p) return null
    try {
      const datum = doc.body.outline.nodes.find((n) => n.id === p.datumNodeId)
      if (!datum) return 'The neck-pocket center reference is missing.'
      const a = (p.heelWidthMm - p.mouthWidthMm) / (2 * p.lengthMm)
      return pocketContainmentWarning(
        doc.body.outline.nodes,
        deriveNeckPocket({
          mouth: p.referenceBoundaryNodes,
          mouthWinding: p.mouthWinding,
          leftSide: { a: -a, b: datum.x - p.mouthWidthMm / 2 + a * datum.y },
          rightSide: { a, b: datum.x + p.mouthWidthMm / 2 - a * datum.y },
          endY: datum.y + p.lengthMm,
          fitAllowanceMm: p.fitAllowanceMm,
          radiusMm: p.radiusMm,
        }),
      )
    } catch {
      return 'The neck-pocket draft does not match the body geometry chain.'
    }
  }, [doc])
  useEffect(() => setName(s.document.name), [s.document.name, s.generation])
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !s.neckDraft)
      document.querySelector<SVGSVGElement>('.large .editor-svg')?.focus({ preventScroll: true })
    wasOpen.current = !!s.neckDraft
  }, [!!s.neckDraft])
  useEffect(() => {
    const dialog = headstockDialog.current
    if (!headstockConfirm || !dialog) return
    dialog.showModal()
    headstockCancel.current?.focus({ preventScroll: true })
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [headstockConfirm])
  const fit = () => {
    if (s.drag) return
    setHeadstockFocus(false)
    if (s.editingTarget === 'headstock') s.setEditingTarget('body')
    fits.current.boxes[s.activeView] = s.activeView === 'front' ? frontBox : b
    s.resetCamera(s.activeView)
  }
  const activateHeadstock = (state = useAppStore.getState()) => {
    if (!state.document.neck) {
      state.setMessage('The headstock becomes available once the neck is accepted.')
      return
    }
    const view = neckView(state.document)
    const box =
      isHeadless(state.document.neck.headstock.activeTemplateId) && view?.nut
        ? pointBounds(view.nut)
        : (view?.headstock?.bounds ?? frontBounds(state.document))
    state.setView('front')
    state.setEditingTarget('headstock')
    fits.current.boxes.front = box
    setHeadstockFocus(true)
    state.resetCamera('front')
  }
  const openHeadstock = () => {
    const state = useAppStore.getState()
    if (state.neckDraft) {
      if (state.neckDraft.error) {
        state.setMessage(state.neckDraft.error)
        return
      }
      if (state.neckDraft.pending) {
        setHeadstockConfirm(true)
        return
      }
      state.cancelNeckDraft()
      activateHeadstock(useAppStore.getState())
      return
    }
    activateHeadstock(state)
  }
  const applyNeckAndOpenHeadstock = () => {
    setHeadstockConfirm(false)
    const state = useAppStore.getState()
    state.applyNeckDraft()
    const current = useAppStore.getState()
    if (!current.neckDraft) activateHeadstock(current)
  }
  const openNeck = () => {
    setNeckFocus(null)
    setRadiusActive(false)
    s.startNeckDraft()
  }
  const openFit = (radius = false) => {
    const state = useAppStore.getState()
    if (!state.document.neck && !state.neckDraft) {
      state.setMessage(
        'The shared radius adjustment requires the neck to be enabled in the front view. The existing pocket remains unchanged.',
      )
      return
    }
    state.startNeckDraft()
    setRadiusActive(radius)
    setNeckFocus((previous) => ({
      group: 'Fit',
      field: radius ? 'radiusMm' : null,
      token: (previous?.token ?? 0) + 1,
    }))
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (isTyping(e.target) || document.querySelector('dialog[open]')) return
      const state = useAppStore.getState(),
        mod = e.ctrlKey || e.metaKey,
        k = e.key.toLowerCase()
      if (mod && (k === 'z' || k === 'y')) {
        e.preventDefault()
        k === 'y' || e.shiftKey ? state.redo() : state.undo()
        return
      }
      if (state.activeWorkspace !== 'guitar') {
        if (e.key === 'Escape') {
          e.preventDefault()
          state.setActiveWorkspace('guitar')
        }
        return
      }
      if (e.key === 'Escape') {
        state.neckDraft ? state.cancelNeckDraft() : state.cancel()
        return
      }
      if (['1', '2', '3'].includes(e.key)) {
        e.preventDefault()
        state.setView(views[Number(e.key) - 1])
        return
      }
      if (state.drag || state.neckDraft) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.editingTarget === 'headstock' && state.selectedHeadstock.size) {
          e.preventDefault()
          state.deleteHeadstockSelected()
          return
        }
        if (state.selectedPickupId) {
          e.preventDefault()
          state.deletePickup(state.selectedPickupId)
          return
        }
        if (state.selected.size) {
          e.preventDefault()
          state.deleteSelected()
        }
        return
      }
      const step = e.shiftKey ? 10 : 1,
        deltas: Record<string, { x: number; y: number }> = {
          ArrowLeft: { x: -step, y: 0 },
          ArrowRight: { x: step, y: 0 },
          ArrowUp: { x: 0, y: -step },
          ArrowDown: { x: 0, y: step },
        }
      if (
        deltas[e.key] &&
        state.selectedRearElectronicsCavity &&
        state.document.body.rearElectronicsCavity
      ) {
        e.preventDefault()
        const { x, y } = screenDeltaToWorld(
            deltas[e.key],
            presentation(state.activeView, state.document.handedness),
          ),
          c = state.document.body.rearElectronicsCavity
        state.beginRearElectronicsCavityDrag()
        state.previewRearElectronicsCavity(x, y)
        state.commit()
        return
      }
      if (deltas[e.key] && state.selectedPickupId) {
        e.preventDefault()
        const current = state.document.pickupCavities.find((p) => p.id === state.selectedPickupId)
        if (current)
          state.setPickupCenter(
            current.id,
            current.centerYmm +
              screenDeltaToWorld(
                deltas[e.key],
                presentation(state.activeView, state.document.handedness),
              ).y,
          )
        return
      }
      if (
        deltas[e.key] &&
        state.activeView === 'front' &&
        state.editingTarget === 'headstock' &&
        state.selectedHeadstock.size === 1
      ) {
        e.preventDefault()
        const { x, y } = screenDeltaToWorld(
            deltas[e.key],
            presentation(state.activeView, state.document.handedness),
          ),
          n = headstockWorldNodes(state.document).find((v) => state.selectedHeadstock.has(v.id))
        if (n) {
          if (x) state.setHeadstockCoordinate('x', n.x + x)
          if (y) state.setHeadstockCoordinate('y', n.y + y)
        }
        return
      }
      if (deltas[e.key] && state.selected.size) {
        e.preventDefault()
        const { x, y } = screenDeltaToWorld(
          deltas[e.key],
          presentation(state.activeView, state.document.handedness),
        )
        state.moveSelected(x, y)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  const commitName = () => {
    s.rename(name)
    setName(useAppStore.getState().document.name)
  }
  const locked = !!s.drag || !!s.neckDraft
  const measure = (n: number) => (s.unit === 'mm' ? n : n / 25.4).toFixed(s.unit === 'mm' ? 1 : 3)
  if (s.activeWorkspace === 'inlays') {
    return <InlayDesignerWorkspace />
  }

  return (
    <main className={`editor ${s.neckDraft ? 'neck-editing' : ''}`}>
      <header>
        <p className="wordmark">
          GTR<span>factory</span>
        </p>
        <input
          className="project-name"
          aria-label="Project name"
          placeholder="Name your project"
          maxLength={160}
          value={name}
          disabled={!!s.neckDraft}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') {
              e.preventDefault()
              setName(s.document.name)
            }
          }}
        />
        <span className={s.dirty ? 'dirty' : 'saved'} data-testid="save-state">
          {s.dirty ? 'Modified' : 'Saved'}
        </span>
        <FileActions />
      </header>
      <section className="toolbar" aria-label="Editing tools">
        <div>
          <button onClick={s.undo} disabled={(!s.history.length && !s.drag) || !!s.neckDraft}>
            Undo
          </button>
          <button onClick={s.redo} disabled={!s.future.length || locked}>
            Redo
          </button>
        </div>
        <div className="camera" aria-label="View tools">
          <button aria-pressed={!panMode} onClick={() => setPanMode(false)}>
            Edit
          </button>
          <button aria-pressed={panMode} onClick={() => setPanMode(true)}>
            Pan view
          </button>
          <button
            aria-label="Zoom out"
            onClick={() => s.setCamera(s.activeView, { zoom: s.cameras[s.activeView].zoom / 1.2 })}
            disabled={!!s.drag}
          >
            −
          </button>
          <button
            aria-label="Zoom in"
            onClick={() => s.setCamera(s.activeView, { zoom: s.cameras[s.activeView].zoom * 1.2 })}
            disabled={!!s.drag}
          >
            +
          </button>
          <button onClick={fit} disabled={!!s.drag}>
            Fit to view
          </button>
          <button
            aria-label={`Grid: ${gridMm === 0 ? 'Off' : `${gridMm} mm`}`}
            aria-pressed={gridMm !== 0}
            onClick={() => setGridMm((current) => nextGridSize(current))}
            disabled={!!s.drag}
          >
            Grid: {gridMm === 0 ? 'Off' : `${gridMm} mm`}
          </button>
        </div>
        <button
          aria-label="Handedness"
          aria-pressed={s.document.handedness === 'left'}
          onClick={() => s.setHandedness(s.document.handedness === 'left' ? 'right' : 'left')}
          disabled={locked}
        >
          {s.document.handedness === 'left' ? 'Left-handed' : 'Right-handed'}
        </button>
        <div>
          <button onClick={() => s.setUnit('mm')} aria-pressed={s.unit === 'mm'}>
            mm
          </button>
          <button onClick={() => s.setUnit('in')} aria-pressed={s.unit === 'in'}>
            in
          </button>
        </div>
        {s.editingTarget !== 'headstock' && <PickupMenu />}
        <div className="body-comparison-tools">
          <label>
            <input
              type="checkbox"
              checked={showOriginalBody}
              onChange={(e) => setShowOriginalBody(e.target.checked)}
            />{' '}
            Show original body
          </label>
          <button onClick={s.resetBodyOutline} disabled={locked || s.editingTarget === 'headstock'}>
            Reset body
          </button>
          <BodyColorPicker disabled={locked || s.editingTarget === 'headstock'} />
        </div>
        <ReferenceControls reference={reference} onChange={setReference} />
      </section>
      {s.neckDraft && <NeckWorkspace focusRequest={neckFocus} onRadiusActive={setRadiusActive} />}
      <ContextTools onSelectFit={() => openFit()} />
      <section className="workspace">
        <div className="large">
          <EditorCanvas
            view={s.activeView}
            fitBounds={fits.current.boxes[s.activeView]}
            panMode={panMode}
            reference={reference}
            onSelectNeck={openNeck}
            onSelectHeadstock={openHeadstock}
            onSelectRadius={() => openFit(true)}
            highlightRadius={!!s.neckDraft && radiusActive}
            template={template}
            showNeckGuides={!!s.neckDraft}
            showOriginalBody={showOriginalBody && !s.neckDraft && s.editingTarget === 'body'}
            gridMm={gridMm}
          />
        </div>
        <aside className="thumbnails">
          {views
            .filter((v) => v !== s.activeView)
            .map((v) => (
              <EditorCanvas
                key={v}
                view={v}
                small
                fitBounds={fits.current.boxes[v]}
                reference={reference}
                template={template}
                showNeckGuides={!!s.neckDraft}
                showOriginalBody={showOriginalBody && !s.neckDraft && s.editingTarget === 'body'}
                gridMm={gridMm}
              />
            ))}
        </aside>
      </section>
      <footer className="status-area">
        <section className="inspector">
          <div>
            <span className="muted">Body</span>
            <strong data-testid="body-dimensions">
              {measure(b.width)} × {measure(b.height)} {s.unit}
            </strong>
          </div>
          <span className="editing-help">1/2/3: view · wheel: zoom · Space + drag: pan</span>
        </section>
        {warning && (
          <p className="warning" role="status">
            {warning} You can still save the draft.
          </p>
        )}
        {headstockStatus && !headstockStatus.supported && (
          <p className="notice" role="status">
            Headstocks support 6–8-string guitars and a dedicated 4-string bass template.
          </p>
        )}
        {headstockStatus?.supported && s.editingTarget === 'headstock' && (
          <p className="notice headstock-status" role="status">
            {doc.neck && isHeadless(doc.neck.headstock.activeTemplateId)
              ? 'Headless guitar'
              : `Headstock: maximum nut angle ${headstockStatus.maxAngleDeg?.toFixed(2)}° · ${
                  doc.neck && isBassTemplate(doc.neck.headstock.activeTemplateId) ? 'GB2' : 'M6'
                }: nominal 2D fit ${headstockStatus.valid ? 'verified' : 'invalid'}`}
          </p>
        )}
        {pocketWarning && (
          <p className="warning" role="status">
            {pocketWarning}
          </p>
        )}
        {s.message && (
          <p className="notice" role="status">
            {s.message}
          </p>
        )}
      </footer>
      {headstockConfirm && (
        <dialog
          ref={headstockDialog}
          className="headstock-confirm-dialog"
          onCancel={(event) => {
            event.preventDefault()
            setHeadstockConfirm(false)
          }}
          aria-labelledby="headstock-confirm-title"
        >
          <h2 id="headstock-confirm-title">Apply neck changes and edit headstock?</h2>
          <p>Your pending neck settings will be applied as one undo step.</p>
          <div className="headstock-confirm-actions">
            <button onClick={applyNeckAndOpenHeadstock}>Apply and continue</button>
            <button ref={headstockCancel} onClick={() => setHeadstockConfirm(false)}>
              Cancel
            </button>
          </div>
        </dialog>
      )}
    </main>
  )
}
