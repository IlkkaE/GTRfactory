import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { pathD, segmentPath, type Bounds } from '../geometry/outline'
import { canSplitSegmentAt, segmentPoint } from './segmentSelection'
import {
  isProtectedAnchor,
  isProtectedHandle,
  isProtectedSegment,
  useAppStore,
  type ViewId,
} from '../store'
import {
  fitTransform,
  formatDimension,
  pxToWorld,
  ticks,
  worldMatrix,
  worldToPx,
  RULER,
  type Size,
} from './viewport'
import { referenceTransform, sourceBounds, type ReferenceOverlay } from '../file/referenceOverlay'
import type { ProjectDocument } from '../model/project'
import { starterBodyOutline } from '../model/project'
import { rearElectronicsCavityGeometry } from '../electronicsCavity'
import { pickupGeometry } from '../pickup/profiles'
import { prepareCanvasGeometry } from './canvasGeometry'
import {
  canSplitHeadstockSegment,
  isProtectedHeadstockHandle,
  isProtectedHeadstockNode,
  isHeadless,
} from '../headstock/template'
import { useCanvasInteractions } from './useCanvasInteractions'
import { gridPath, type GridSizeMm } from './grid'
import './dimensions.css'
const labels: Record<ViewId, string> = { front: 'Front', back: 'Back', pocket: 'Neck pocket' }
export { isTyping } from './useCanvasInteractions'
function useSize(ref: React.RefObject<HTMLDivElement>) {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  useEffect(() => {
    let frame = 0
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() =>
        setSize((old) => {
          const next = { width: entry.contentRect.width, height: entry.contentRect.height }
          return old.width === next.width && old.height === next.height ? old : next
        }),
      )
    })
    if (ref.current) observer.observe(ref.current)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [ref])
  return size
}
export function EditorCanvas({
  view,
  small = false,
  fitBounds,
  panMode = false,
  reference = null,
  onSelectNeck,
  onSelectHeadstock,
  onSelectRadius,
  highlightRadius = false,
  showNeckGuides = false,
  template = null,
  showOriginalBody = false,
  gridMm = 0,
}: {
  view: ViewId
  small?: boolean
  fitBounds: Bounds
  panMode?: boolean
  reference?: ReferenceOverlay | null
  onSelectNeck?: () => void
  onSelectHeadstock?: () => void
  onSelectRadius?: () => void
  highlightRadius?: boolean
  showNeckGuides?: boolean
  template?: ProjectDocument | null
  showOriginalBody?: boolean
  gridMm?: GridSizeMm
}) {
  const s = useAppStore(),
    wrap = useRef<HTMLDivElement>(null),
    svg = useRef<SVGSVGElement>(null)
  const size = useSize(wrap),
    doc = s.preview ?? s.document,
    {
      nodes,
      automatic,
      neckDrawing,
      legacyPocket,
      activePocket,
      pocketTemplate,
      visualPath,
      shapeBounds,
      drawingBounds,
      pocketBottom,
      corners,
      showDimensions,
    } = useMemo(
      () => prepareCanvasGeometry(doc, template, view, small, fitBounds),
      [doc, template, view, small, fitBounds],
    )
  const clip = useId().replace(/:/g, '')
  const upperClip = clip + 'upper'
  const camera = small ? { zoom: 1, panX: 0, panY: 0 } : s.cameras[view]
  const t = fitTransform(
    drawingBounds,
    size,
    view,
    camera,
    showDimensions,
    pocketBottom,
    doc.handedness,
  )
  const interactions = useCanvasInteractions({
    svg,
    view,
    small,
    panMode,
    nodes,
    transform: t,
    camera,
    size,
    generation: s.generation,
    drag: s.drag,
    gridMm,
    onSelectNeck,
    onSelectHeadstock,
    onSelectRadius,
  })
  const pocketClipBottom = pocketTemplate?.cutY ?? t.world.maxY
  const marquee = interactions.marquee
  const left = pxToWorld({ x: RULER, y: RULER }, t).y,
    right = pxToWorld({ x: size.width, y: size.height }, t).y
  const xTicks = ticks(t, size, s.unit, 'x'),
    yTicks = ticks(t, size, s.unit, 'y')
  const originalBodyPath = useMemo(() => pathD(starterBodyOutline()), [])
  const visibleGridPath = useMemo(() => {
    const corners = [
        pxToWorld({ x: RULER, y: RULER }, t),
        pxToWorld({ x: size.width, y: RULER }, t),
        pxToWorld({ x: RULER, y: size.height }, t),
        pxToWorld({ x: size.width, y: size.height }, t),
      ],
      minX = Math.min(...corners.map((point) => point.x)),
      maxX = Math.max(...corners.map((point) => point.x)),
      minY = Math.min(...corners.map((point) => point.y)),
      maxY = Math.max(...corners.map((point) => point.y))
    return gridPath(
      { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY },
      small ? 0 : gridMm,
    )
  }, [t, size.width, size.height, gridMm, small])
  const boundLeft = Math.min(
    worldToPx({ x: 0, y: shapeBounds.minY }, t).x,
    worldToPx({ x: 0, y: shapeBounds.maxY }, t).x,
  )
  const boundRight = Math.max(
    worldToPx({ x: 0, y: shapeBounds.minY }, t).x,
    worldToPx({ x: 0, y: shapeBounds.maxY }, t).x,
  )
  const boundTop = Math.min(
    worldToPx({ x: shapeBounds.minX, y: 0 }, t).y,
    worldToPx({ x: shapeBounds.maxX, y: 0 }, t).y,
  )
  const boundBottom = Math.max(
    worldToPx({ x: shapeBounds.minX, y: 0 }, t).y,
    worldToPx({ x: shapeBounds.maxX, y: 0 }, t).y,
  )
  const dimensionY = boundBottom + 31,
    dimensionX = boundLeft - 35
  return (
    <section
      className={`canvas-card ${small ? 'small' : ''}`}
      data-view={view}
      data-large={!small}
      tabIndex={small ? 0 : undefined}
      role={small ? 'button' : undefined}
      aria-label={small ? `Show ${labels[view]} in large view` : undefined}
      onClick={small ? () => s.setView(view) : undefined}
      onKeyDown={
        small
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                s.setView(view)
              }
            }
          : undefined
      }
    >
      <div className="canvas-title">{labels[view]}</div>
      <div className="svg-wrap" ref={wrap}>
        {size.width > RULER && size.height > RULER && (
          <svg
            ref={svg}
            className={`editor-svg ${panMode ? 'pan-mode' : ''}`}
            width={size.width}
            height={size.height}
            viewBox={`0 0 ${size.width} ${size.height}`}
            tabIndex={small ? -1 : 0}
            aria-label={`${labels[view]} ${small ? 'preview' : 'editing area'}`}
            onPointerMove={interactions.canvas.onPointerMove}
            onPointerUp={interactions.canvas.onPointerUp}
            onPointerCancel={interactions.canvas.onPointerCancel}
            onLostPointerCapture={interactions.canvas.onLostPointerCapture}
            onWheel={interactions.canvas.onWheel}
            onPointerDown={interactions.canvas.onPointerDown}
          >
            <defs>
              <clipPath id={clip}>
                <rect
                  x={RULER}
                  y={RULER}
                  width={Math.max(0, size.width - RULER)}
                  height={Math.max(0, size.height - RULER)}
                />
              </clipPath>
              <clipPath id={`${clip}-neck`}>
                <path d={neckDrawing?.outlinePath ?? ''} />
              </clipPath>
              <clipPath id={upperClip}>
                <rect
                  x={-5000000}
                  y={-5000000}
                  width={10000000}
                  height={5000000 + pocketClipBottom}
                />
              </clipPath>
              <marker
                id={`${clip}-arrow`}
                viewBox="0 0 8 8"
                refX="4"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path className="dimension-arrow" d="M0 0L8 4L0 8z" />
              </marker>
            </defs>
            <g clipPath={`url(#${clip})`}>
              <rect
                className="paper"
                x={RULER}
                y={RULER}
                width={Math.max(0, size.width - RULER)}
                height={Math.max(0, size.height - RULER)}
              />
              <g data-transform="world" transform={worldMatrix(t)}>
                <g clipPath={view === 'pocket' ? `url(#${upperClip})` : undefined}>
                  {reference?.visible && (
                    <g
                      className="reference-layer"
                      data-reference-kind={reference.source.kind}
                      opacity={reference.opacity}
                      transform={referenceTransform(reference)}
                      pointerEvents="none"
                    >
                      {reference.source.kind === 'project' ? (
                        <path className="reference-project" d={pathD(reference.source.nodes)} />
                      ) : (
                        <image
                          className="reference-raster"
                          data-reference-width={sourceBounds(reference.source).width}
                          data-reference-height={sourceBounds(reference.source).height}
                          href={reference.source.url}
                          x={sourceBounds(reference.source).minX}
                          y={sourceBounds(reference.source).minY}
                          width={sourceBounds(reference.source).width}
                          height={sourceBounds(reference.source).height}
                          preserveAspectRatio="none"
                        />
                      )}
                    </g>
                  )}
                  <path
                    className={`body-path ${reference?.visible ? 'with-reference' : ''}`}
                    d={visualPath}
                  />
                  {visibleGridPath && (
                    <path
                      className="body-grid"
                      data-grid-mm={gridMm}
                      d={visibleGridPath}
                      pointerEvents="none"
                    />
                  )}
                  {showOriginalBody && (
                    <path
                      className="original-body-ghost"
                      data-original-body-ghost="true"
                      d={originalBodyPath}
                      pointerEvents="none"
                    />
                  )}
                  {view === 'front' && neckDrawing?.outlinePath && (
                    <path
                      className={`neck-outline ${template ? 'neck-template' : ''}`}
                      d={neckDrawing?.outlinePath}
                      tabIndex={!small && onSelectNeck ? 0 : undefined}
                      role={!small && onSelectNeck ? 'button' : undefined}
                      aria-label={
                        !small && onSelectNeck
                          ? template
                            ? 'Edit default neck'
                            : 'Edit neck'
                          : undefined
                      }
                      onPointerDown={interactions.neck.onPointerDown}
                      onKeyDown={interactions.neck.onKeyboardSelect}
                    />
                  )}
                  {view === 'front' && neckDrawing?.heelPath && (
                    <path className="neck-heel" d={neckDrawing.heelPath} pointerEvents="none" />
                  )}
                  {view === 'front' && neckDrawing?.headstock && (
                    <g className={`headstock ${s.editingTarget === 'headstock' ? 'editing' : ''}`}>
                      <path
                        className="headstock-outline"
                        d={neckDrawing.headstock.path}
                        tabIndex={!small && onSelectHeadstock ? 0 : undefined}
                        role={!small && onSelectHeadstock ? 'button' : undefined}
                        aria-label="Edit headstock"
                        onPointerDown={interactions.headstock.onPointerDown}
                        onKeyDown={interactions.headstock.onKeyboardSelect}
                      />
                      {neckDrawing.headstock.holes.map((h, i) => (
                        <circle key={i} className="tuner-hole" cx={h.x} cy={h.y} r={h.r} />
                      ))}
                      {s.editingTarget === 'headstock' &&
                        !small &&
                        neckDrawing.headstock.strings.map((line, i) =>
                          line.T ? (
                            <line
                              key={'string' + i}
                              className="headstock-string"
                              x1={line.S.x}
                              y1={line.S.y}
                              x2={line.T.x}
                              y2={line.T.y}
                            />
                          ) : null,
                        )}
                    </g>
                  )}
                  {view === 'front' &&
                    neckDrawing?.nutPath &&
                    doc.neck &&
                    isHeadless(doc.neck.headstock.activeTemplateId) && (
                      <path
                        className={`headless-nut-target ${s.editingTarget === 'headstock' ? 'editing' : ''}`}
                        d={neckDrawing.nutPath}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={20 / t.scale}
                        style={{ cursor: 'pointer' }}
                        tabIndex={!small && onSelectHeadstock ? 0 : undefined}
                        role={!small && onSelectHeadstock ? 'button' : undefined}
                        aria-label="Edit headstock"
                        onPointerDown={interactions.headstock.onPointerDown}
                        onKeyDown={interactions.headstock.onKeyboardSelect}
                      />
                    )}
                  {view === 'front' && neckDrawing && (
                    <>
                      {showNeckGuides && (
                        <g clipPath={`url(#${clip}-neck)`}>
                          {neckDrawing.frets.map((f) => (
                            <path
                              key={f.n}
                              data-fret={f.n}
                              className="neck-guide-fret"
                              d={f.path}
                            />
                          ))}
                        </g>
                      )}
                      {showNeckGuides && (
                        <g clipPath={`url(#${clip}-neck)`}>
                          {neckDrawing.strings.map((line, i) => (
                            <line
                              key={i}
                              className="neck-guide-string"
                              x1={line.from.x}
                              y1={line.from.y}
                              x2={line.to.x}
                              y2={line.to.y}
                            />
                          ))}
                        </g>
                      )}
                      <path className="nut-line" d={neckDrawing.nutPath} />
                      <path className="bridge-line" d={neckDrawing.bridgePath} />
                    </>
                  )}
                  {view === 'front' && neckDrawing?.outlinePath && (
                    <path className="body-edge-over-neck" d={pathD(nodes)} />
                  )}
                  {view === 'front' &&
                    doc.pickupCavities.map((c) => {
                      const geometry = pickupGeometry(c)
                      return geometry ? (
                        <path
                          key={c.id}
                          data-pickup-id={c.id}
                          data-center-y={c.centerYmm}
                          className={`pickup-cavity ${s.selectedPickupId === c.id ? 'selected' : ''}`}
                          d={geometry.path}
                          tabIndex={!small ? 0 : undefined}
                          role={!small ? 'button' : undefined}
                          aria-label={`${geometry.profile.name}, pickup cavity`}
                          onPointerDown={(e) => interactions.pickup.onPointerDown(e, c.id)}
                          onKeyDown={(e) => interactions.pickup.onKeyboardSelect(e, c.id)}
                        />
                      ) : null
                    })}
                  {view === 'back' &&
                    (() => {
                      const cavity = rearElectronicsCavityGeometry(doc)
                      return cavity ? (
                        <g
                          data-electronics-cavity="true"
                          className={`electronics-cavity ${s.selectedRearElectronicsCavity ? 'selected' : ''} ${cavity.diagnostic ? cavity.diagnostic.class : ''}`}
                        >
                          <path
                            className="electronics-cavity outer"
                            d={cavity.outer.d}
                            tabIndex={!small ? 0 : undefined}
                            role={!small ? 'button' : undefined}
                            aria-label="Electronics cavity"
                            onPointerDown={(e) => interactions.electronics.onPointerDown(e)}
                            onKeyDown={interactions.electronics.onKeyboardSelect}
                          />
                          <path
                            className="electronics-cavity inner"
                            d={cavity.inner.d}
                            pointerEvents="none"
                          />
                          {!small &&
                            s.selectedRearElectronicsCavity &&
                            (['left', 'right', 'top', 'bottom'] as const).map((side) => {
                              const x =
                                side === 'top'
                                  ? cavity.bounds.maxX
                                  : side === 'bottom'
                                    ? cavity.bounds.minX
                                    : cavity.bounds.minX + cavity.bounds.width / 2
                              const y =
                                side === 'left'
                                  ? cavity.bounds.maxY
                                  : side === 'right'
                                    ? cavity.bounds.minY
                                    : cavity.bounds.minY + cavity.bounds.height / 2
                              return (
                                <circle
                                  key={side}
                                  data-electronics-cavity-handle={side}
                                  className={`electronics-cavity-handle ${side}`}
                                  cx={x}
                                  cy={y}
                                  r={8 / t.scale}
                                  tabIndex={0}
                                  role="button"
                                  aria-label={`Cavity ${side === 'left' ? 'left' : side === 'right' ? 'right' : side === 'top' ? 'top' : 'bottom'} edge`}
                                  onPointerDown={(e) =>
                                    interactions.electronics.onPointerDown(e, side)
                                  }
                                  onKeyDown={(e) =>
                                    interactions.electronics.onHandleKeyDown(e, side)
                                  }
                                />
                              )
                            })}
                        </g>
                      ) : null
                    })()}{' '}
                  <path className="centerline" d={`M0 ${left}V${right}`} />
                  {!small &&
                    s.selectedSegment &&
                    s.selectedSegmentT !== null &&
                    (() => {
                      const index = nodes.findIndex((n) => n.id === s.selectedSegment)
                      if (
                        index < 0 ||
                        isProtectedSegment(doc, s.selectedSegment!) ||
                        !canSplitSegmentAt(nodes, index, s.selectedSegmentT)
                      )
                        return null
                      const p = segmentPoint(nodes, index, s.selectedSegmentT)
                      return (
                        <circle
                          className="segment-preview-marker"
                          data-segment-preview-t={s.selectedSegmentT}
                          cx={p.x}
                          cy={p.y}
                          r={5 / t.scale}
                          pointerEvents="none"
                        />
                      )
                    })()}
                  {!small &&
                    nodes.map((n, i) => (
                      <path
                        key={n.id}
                        data-segment-id={n.id}
                        className={`segment-hit ${s.selectedSegment === n.id ? 'selected-segment' : ''} ${isProtectedSegment(doc, n.id) ? 'protected' : ''}`}
                        d={segmentPath(nodes, i)}
                        tabIndex={0}
                        role="button"
                        aria-label={`Edge ${i + 1}`}
                        aria-pressed={s.selectedSegment === n.id}
                        onKeyDown={(e) => interactions.body.onKeyboardSelect(e, n.id, true)}
                        onPointerDown={(e) => interactions.body.onSegmentPointerDown(e, n.id)}
                      />
                    ))}
                  {!small &&
                    view === 'pocket' &&
                    onSelectRadius &&
                    corners.map(({ side, corner, d }) => (
                      <g
                        key={side}
                        className={`pocket-corner ${highlightRadius ? 'radius-active' : ''}`}
                        data-pocket-corner={side}
                        tabIndex={0}
                        role="button"
                        aria-label={`Adjust the pocket's ${side === 'left' ? 'left' : 'right'} shared corner radius`}
                        onPointerDown={interactions.radius.onPointerDown}
                        onKeyDown={interactions.radius.onKeyboardSelect}
                      >
                        {d ? (
                          <>
                            <path className="corner-highlight" d={d} />
                            <path className="corner-hit" d={d} />
                          </>
                        ) : (
                          <>
                            <circle
                              className="corner-highlight"
                              cx={corner.x}
                              cy={corner.y}
                              r={5 / t.scale}
                            />
                            <circle
                              className="corner-hit-point"
                              cx={corner.x}
                              cy={corner.y}
                              r={12 / t.scale}
                            />
                          </>
                        )}
                        <title>Shared corner radius — both corners</title>
                      </g>
                    ))}
                  {!small &&
                    view === 'front' &&
                    s.editingTarget === 'headstock' &&
                    neckDrawing?.headstock && (
                      <>
                        {neckDrawing.headstock.nodes.slice(0, -1).map((n, i) => (
                          <path
                            key={n.id}
                            data-headstock-segment-id={n.id}
                            className={`segment-hit ${s.selectedSegment === n.id ? 'selected-segment' : ''} ${canSplitHeadstockSegment(doc, n.id) ? '' : 'protected'}`}
                            d={segmentPath(neckDrawing.headstock!.nodes, i)}
                            tabIndex={0}
                            role="button"
                            aria-label={`Headstock edge ${i + 1}`}
                            aria-pressed={s.selectedSegment === n.id}
                            onPointerDown={(e) =>
                              interactions.headstock.onSegmentPointerDown(e, n.id)
                            }
                            onKeyDown={(e) =>
                              interactions.headstock.onSegmentKeyboardSelect(e, n.id)
                            }
                          />
                        ))}
                        {s.selectedSegment &&
                          s.selectedSegmentT !== null &&
                          (() => {
                            const nodes = neckDrawing.headstock!.nodes,
                              index = nodes.findIndex((n) => n.id === s.selectedSegment)
                            if (
                              !canSplitHeadstockSegment(doc, s.selectedSegment!) ||
                              !canSplitSegmentAt(nodes, index, s.selectedSegmentT)
                            )
                              return null
                            const p = segmentPoint(nodes, index, s.selectedSegmentT)
                            return (
                              <circle
                                className="segment-preview-marker headstock-segment-preview-marker"
                                data-headstock-preview-t={s.selectedSegmentT}
                                cx={p.x}
                                cy={p.y}
                                r={5 / t.scale}
                                pointerEvents="none"
                              />
                            )
                          })()}
                      </>
                    )}
                  {!small &&
                    view === 'front' &&
                    s.editingTarget === 'headstock' &&
                    neckDrawing?.headstock?.nodes
                      .filter((n) => s.selectedHeadstock.has(n.id))
                      .flatMap((n) => {
                        return (['inHandle', 'outHandle'] as const).map((side) => {
                          const h = n[side]
                          if (!h) return null
                          return (
                            <g key={n.id + side}>
                              <path
                                className="handle-line"
                                d={`M${n.x} ${n.y}L${n.x + h.dx} ${n.y + h.dy}`}
                              />
                              <circle
                                data-headstock-handle-id={n.id}
                                data-side={side}
                                className={`handle ${isProtectedHeadstockHandle(neckDrawing.headstock!.nodes, n.id, side, doc.neck!.headstock) ? 'protected' : ''}`}
                                cx={n.x + h.dx}
                                cy={n.y + h.dy}
                                r={4.5 / t.scale}
                                onPointerDown={(e) =>
                                  interactions.headstock.onHandlePointerDown(e, n.id, side)
                                }
                              />
                            </g>
                          )
                        })
                      })}
                  {!small &&
                    view === 'front' &&
                    s.editingTarget === 'headstock' &&
                    neckDrawing?.headstock?.nodes.map((n) => (
                      <circle
                        key={n.id}
                        data-headstock-node-id={n.id}
                        tabIndex={0}
                        role="button"
                        aria-label={`Headstock node ${n.id}`}
                        className={`node ${s.selectedHeadstock.has(n.id) ? 'selected' : ''} ${isProtectedHeadstockNode(n.id, doc.neck!.headstock) ? 'protected' : ''}`}
                        cx={n.x}
                        cy={n.y}
                        r={5 / t.scale}
                        onPointerDown={(e) => interactions.headstock.onNodePointerDown(e, n.id)}
                        onKeyDown={(e) => interactions.headstock.onNodeKeyboardSelect(e, n.id)}
                      />
                    ))}
                  {!small &&
                    nodes
                      .filter(
                        (n) =>
                          s.selected.has(n.id) && (view !== 'pocket' || n.y <= pocketClipBottom),
                      )
                      .flatMap((n) => {
                        const i = nodes.indexOf(n),
                          prev = nodes[(i - 1 + nodes.length) % nodes.length]
                        return (['inHandle', 'outHandle'] as const).map((side) => {
                          const h = n[side],
                            active =
                              side === 'inHandle'
                                ? prev.outgoing === 'cubicBezier'
                                : n.outgoing === 'cubicBezier'
                          if (!h || !active) return null
                          return (
                            <g key={n.id + side}>
                              <path
                                className="handle-line"
                                d={`M${n.x} ${n.y}L${n.x + h.dx} ${n.y + h.dy}`}
                              />
                              <circle
                                data-handle-id={n.id}
                                data-side={side}
                                className={`handle ${isProtectedHandle(doc, n.id, side) ? 'protected' : ''}`}
                                cx={n.x + h.dx}
                                cy={n.y + h.dy}
                                r={4.5 / t.scale}
                                onPointerDown={(e) =>
                                  interactions.body.onHandlePointerDown(e, n.id, side)
                                }
                              />
                            </g>
                          )
                        })
                      })}
                  {!small &&
                    nodes
                      .filter((n) => view !== 'pocket' || n.y <= pocketClipBottom)
                      .map((n) => (
                        <circle
                          key={n.id}
                          data-node-id={n.id}
                          tabIndex={0}
                          role="button"
                          aria-label={`Node ${nodes.indexOf(n) + 1}`}
                          aria-pressed={s.selected.has(n.id)}
                          onKeyDown={(e) => interactions.body.onKeyboardSelect(e, n.id)}
                          className={`node ${s.selected.has(n.id) ? 'selected' : ''} ${isProtectedAnchor(doc, n.id) ? 'protected' : ''}`}
                          cx={n.x}
                          cy={n.y}
                          r={5 / t.scale}
                          onPointerDown={(e) => interactions.body.onNodePointerDown(e, n.id)}
                        />
                      ))}
                </g>
              </g>
              {showDimensions && (
                <g className="dimensions" pointerEvents="none">
                  <g data-dimension="width" data-mm={shapeBounds.width}>
                    <line
                      className="dimension-extension"
                      x1={boundLeft}
                      y1={boundTop}
                      x2={dimensionX}
                      y2={boundTop}
                    />
                    <line
                      className="dimension-extension"
                      x1={boundLeft}
                      y1={boundBottom}
                      x2={dimensionX}
                      y2={boundBottom}
                    />
                    <line
                      className="dimension-line"
                      x1={dimensionX}
                      y1={boundTop}
                      x2={dimensionX}
                      y2={boundBottom}
                      markerStart={`url(#${clip}-arrow)`}
                      markerEnd={`url(#${clip}-arrow)`}
                    />
                    <text
                      className="dimension-text"
                      x={dimensionX - 10}
                      y={(boundTop + boundBottom) / 2}
                      textAnchor="middle"
                      transform={`rotate(-90 ${dimensionX - 10} ${(boundTop + boundBottom) / 2})`}
                    >
                      {formatDimension(shapeBounds.width, s.unit)} {s.unit}
                    </text>
                  </g>
                  <g data-dimension="height" data-mm={shapeBounds.height}>
                    <line
                      className="dimension-extension"
                      x1={boundLeft}
                      y1={boundBottom}
                      x2={boundLeft}
                      y2={dimensionY}
                    />
                    <line
                      className="dimension-extension"
                      x1={boundRight}
                      y1={boundBottom}
                      x2={boundRight}
                      y2={dimensionY}
                    />
                    <line
                      className="dimension-line"
                      x1={boundLeft}
                      y1={dimensionY}
                      x2={boundRight}
                      y2={dimensionY}
                      markerStart={`url(#${clip}-arrow)`}
                      markerEnd={`url(#${clip}-arrow)`}
                    />
                    <text
                      className="dimension-text"
                      x={(boundLeft + boundRight) / 2}
                      y={dimensionY - 8}
                      textAnchor="middle"
                    >
                      {formatDimension(shapeBounds.height, s.unit)} {s.unit}
                    </text>
                  </g>
                </g>
              )}
              {marquee && (
                <rect
                  className="marquee"
                  x={Math.min(marquee.a.x, marquee.b.x)}
                  y={Math.min(marquee.a.y, marquee.b.y)}
                  width={Math.abs(marquee.a.x - marquee.b.x)}
                  height={Math.abs(marquee.a.y - marquee.b.y)}
                />
              )}
            </g>
            <g className="rulers" pointerEvents="none">
              <rect className="ruler-bg" width={size.width} height={RULER} />
              <rect className="ruler-bg" width={RULER} height={size.height} />
              {xTicks.map((k) => (
                <g key={k.mm} data-axis="x" data-world-axis="y" data-mm={k.mm}>
                  <line x1={k.px} x2={k.px} y1={RULER - 8} y2={RULER} className="ruler-line" />
                  {k.px > RULER + 18 && k.px < size.width - 20 && (
                    <text x={k.px} y={RULER - 14} textAnchor="middle" className="ruler-text">
                      {k.label}
                    </text>
                  )}
                </g>
              ))}
              {yTicks.map((k) => (
                <g key={k.mm} data-axis="y" data-world-axis="x" data-mm={k.mm}>
                  <line x1={RULER - 7} x2={RULER} y1={k.px} y2={k.px} className="ruler-line" />
                  {k.px > RULER + 10 && k.px < size.height - 28 && (
                    <text x={RULER - 10} y={k.px + 3} textAnchor="end" className="ruler-text">
                      {k.label}
                    </text>
                  )}
                </g>
              ))}
              <rect className="ruler-bg" width={RULER} height={RULER} />
              <text className="unit" x={8} y={18}>
                {s.unit}
              </text>
              <text className="unit" x={8} y={33}>
                Y↔
              </text>
              <text className="unit" x={RULER - 4} y={size.height - 8} textAnchor="end">
                X↕
              </text>
            </g>
          </svg>
        )}
        {!small && view === 'front' && template && (
          <p className="pocket-note">
            Default template: 25.5″ · 22 frets. Select the neck to enable it.
          </p>
        )}
        {!small && view === 'front' && !neckDrawing && (
          <p className="pocket-note">The neck cannot be placed without a recognised neck joint.</p>
        )}
        {view === 'pocket' && (
          <p className="pocket-note">
            {legacyPocket && !automatic
              ? 'Legacy manual pocket draft — create a neck to replace it.'
              : doc.neck && pocketTemplate?.diagnostic
                ? pocketTemplate.diagnostic.message
                : pocketTemplate?.cut
                  ? 'A closed pocket template is derived from the neck.'
                  : automatic
                    ? 'The pocket is derived from the neck.'
                    : 'No neck has been created.'}
          </p>
        )}
      </div>
    </section>
  )
}
