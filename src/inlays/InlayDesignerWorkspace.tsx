import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useAppStore } from '../store'
import { pathD } from '../geometry/outline'
import type { OutlineNode, InlayShape } from '../model/project'
import { createDefaultInlayDocument, createPresetShape } from './inlayPresets'
import './inlayDesigner.css'

const CANVAS_SIZE = 500
const PADDING = 50
const DRAW_SIZE = CANVAS_SIZE - PADDING * 2

function toCanvasX(u: number): number {
  return PADDING + u * DRAW_SIZE
}
function toCanvasY(v: number): number {
  return PADDING + v * DRAW_SIZE
}
function fromCanvasX(px: number): number {
  return Math.max(0, Math.min(1, (px - PADDING) / DRAW_SIZE))
}
function fromCanvasY(py: number): number {
  return Math.max(0, Math.min(1, (py - PADDING) / DRAW_SIZE))
}

const DEFAULT_INLAY_DOCUMENT = createDefaultInlayDocument()

export function InlayDesignerWorkspace() {
  const s = useAppStore()
  const doc = s.neckDraft?.document ?? s.preview ?? s.document
  const inlays = doc.fretboardInlays ?? DEFAULT_INLAY_DOCUMENT
  const shape = inlays.shape

  // Local draft shape state for silky smooth 60fps dragging and single-transaction commit
  const [localShape, setLocalShape] = useState<InlayShape>(shape)
  const localShapeRef = useRef<InlayShape>(shape)

  // Local undo/redo history for in-designer editing
  const [history, setHistory] = useState<InlayShape[]>([])
  const [future, setFuture] = useState<InlayShape[]>([])
  const initialGestureShape = useRef<InlayShape | null>(null)

  // Sync from store when not actively dragging (e.g. on Undo / Redo or preset switch)
  const activeGesture = useRef<
    | {
        kind: 'node'
        nodeId: string
      }
    | {
        kind: 'handle'
        nodeId: string
        handleKey: 'inHandle' | 'outHandle'
        baseNodeX: number
        baseNodeY: number
      }
    | null
  >(null)

  // Ensure inlays are enabled in the store if opening designer directly
  useEffect(() => {
    if (!doc.fretboardInlays) {
      s.setInlayEnabled(true)
    }
  }, [doc.fretboardInlays, s])

  useEffect(() => {
    if (!activeGesture.current) {
      setLocalShape(shape)
      localShapeRef.current = shape
    }
  }, [shape])

  const commitShapeChange = useCallback(
    (nextShape: InlayShape) => {
      setHistory((prev) => [...prev, localShapeRef.current])
      setFuture([])
      localShapeRef.current = nextShape
      setLocalShape(nextShape)
      s.setInlayShape(nextShape)
    },
    [s],
  )

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1]
      setHistory((h) => h.slice(0, -1))
      setFuture((f) => [localShapeRef.current, ...f])
      localShapeRef.current = prev
      setLocalShape(prev)
      s.setInlayShape(prev)
    } else if (!s.neckDraft && s.history.length > 0) {
      s.undo()
    }
  }, [history, s])

  const handleRedo = useCallback(() => {
    if (future.length > 0) {
      const next = future[0]
      setFuture((f) => f.slice(1))
      setHistory((h) => [...h, localShapeRef.current])
      localShapeRef.current = next
      setLocalShape(next)
      s.setInlayShape(next)
    } else if (!s.neckDraft && s.future.length > 0) {
      s.redo()
    }
  }, [future, s])

  const svgRef = useRef<SVGSVGElement | null>(null)

  const selectedNode = useMemo(() => {
    if (!s.inlaySelectedNodeId) return null
    return localShape.nodes.find((n) => n.id === s.inlaySelectedNodeId) ?? null
  }, [localShape.nodes, s.inlaySelectedNodeId])

  // Canvas scaled nodes for rendering
  const canvasNodes: OutlineNode[] = useMemo(() => {
    return localShape.nodes.map((n) => ({
      ...n,
      x: toCanvasX(n.x),
      y: toCanvasY(n.y),
      inHandle: n.inHandle
        ? { dx: n.inHandle.dx * DRAW_SIZE, dy: n.inHandle.dy * DRAW_SIZE }
        : null,
      outHandle: n.outHandle
        ? { dx: n.outHandle.dx * DRAW_SIZE, dy: n.outHandle.dy * DRAW_SIZE }
        : null,
    }))
  }, [localShape.nodes])

  const pathString = useMemo(() => pathD(canvasNodes), [canvasNodes])

  const getSvgCoordinates = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = CANVAS_SIZE / rect.width
    const scaleY = CANVAS_SIZE / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [])

  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    s.setInlaySelectedNodeId(nodeId)
    initialGestureShape.current = localShapeRef.current
    activeGesture.current = {
      kind: 'node',
      nodeId,
    }
    svgRef.current?.setPointerCapture(e.pointerId)
  }

  const handleHandlePointerDown = (
    e: React.PointerEvent,
    nodeId: string,
    handleKey: 'inHandle' | 'outHandle',
  ) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const baseNode = localShapeRef.current.nodes.find((n) => n.id === nodeId)
    if (!baseNode) return
    initialGestureShape.current = localShapeRef.current
    activeGesture.current = {
      kind: 'handle',
      nodeId,
      handleKey,
      baseNodeX: baseNode.x,
      baseNodeY: baseNode.y,
    }
    svgRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const gesture = activeGesture.current
    if (!gesture) return
    e.preventDefault()
    const { x, y } = getSvgCoordinates(e)

    if (gesture.kind === 'node') {
      const u = fromCanvasX(x)
      const v = fromCanvasY(y)
      setLocalShape((prev) => {
        const nextNodes = prev.nodes.map((n) => {
          if (n.id !== gesture.nodeId) return n
          return { ...n, x: u, y: v }
        })
        const nextShape: InlayShape = { ...prev, presetId: 'custom', nodes: nextNodes }
        localShapeRef.current = nextShape
        return nextShape
      })
    } else if (gesture.kind === 'handle') {
      const baseCanvasX = toCanvasX(gesture.baseNodeX)
      const baseCanvasY = toCanvasY(gesture.baseNodeY)
      const dx = (x - baseCanvasX) / DRAW_SIZE
      const dy = (y - baseCanvasY) / DRAW_SIZE
      setLocalShape((prev) => {
        const nextNodes = prev.nodes.map((n) => {
          if (n.id !== gesture.nodeId) return n
          const clampedDx = Math.max(-2, Math.min(2, dx))
          const clampedDy = Math.max(-2, Math.min(2, dy))
          const updated = { ...n, [gesture.handleKey]: { dx: clampedDx, dy: clampedDy } }
          if (n.kind === 'smooth') {
            const otherKey = gesture.handleKey === 'inHandle' ? 'outHandle' : 'inHandle'
            updated[otherKey] = { dx: -clampedDx || 0, dy: -clampedDy || 0 }
          }
          return updated
        })
        const nextShape: InlayShape = { ...prev, presetId: 'custom', nodes: nextNodes }
        localShapeRef.current = nextShape
        return nextShape
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeGesture.current) {
      try {
        svgRef.current?.releasePointerCapture(e.pointerId)
      } catch {}
      activeGesture.current = null
      if (initialGestureShape.current) {
        setHistory((prev) => [...prev, initialGestureShape.current!])
        setFuture([])
        initialGestureShape.current = null
      }
      s.setInlayShape(localShapeRef.current)
    }
  }

  // Keyboard navigation and shortcuts inside Inlay Designer
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey
    if (mod && (e.key === 'z' || e.key === 'y')) {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        handleRedo()
      } else {
        handleUndo()
      }
      return
    }

    if (!selectedNode) return

    const step = e.shiftKey ? 0.05 : 0.01
    let dx = 0
    let dy = 0

    if (e.key === 'ArrowLeft') dx = -step
    else if (e.key === 'ArrowRight') dx = step
    else if (e.key === 'ArrowUp') dy = -step
    else if (e.key === 'ArrowDown') dy = step
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (localShape.nodes.length > 3) {
        e.preventDefault()
        e.stopPropagation()
        const nextNodes = localShape.nodes.filter((n) => n.id !== selectedNode.id)
        const nextShape: InlayShape = { ...localShape, presetId: 'custom', nodes: nextNodes }
        s.setInlaySelectedNodeId(null)
        commitShapeChange(nextShape)
        return
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      s.setInlaySelectedNodeId(null)
      return
    }

    if (dx !== 0 || dy !== 0) {
      e.preventDefault()
      e.stopPropagation()
      const newX = Math.max(0, Math.min(1, selectedNode.x + dx))
      const newY = Math.max(0, Math.min(1, selectedNode.y + dy))
      const nextNodes = localShape.nodes.map((n) =>
        n.id === selectedNode.id ? { ...n, x: newX, y: newY } : n,
      )
      const nextShape: InlayShape = { ...localShape, presetId: 'custom', nodes: nextNodes }
      commitShapeChange(nextShape)
    }
  }

  return (
    <div className="inlay-designer-page" tabIndex={0} onKeyDown={handleKeyDown}>
      <header className="inlay-designer-header">
        <div className="inlay-header-left">
          <button
            type="button"
            className="inlay-back-btn"
            onClick={() => s.setActiveWorkspace('guitar')}
          >
            ← Back to Guitar
          </button>
          <h2>Inlay Designer</h2>
        </div>
        <div className="inlay-header-center">
          <div className="inlay-preset-group">
            <span className="inlay-group-label">Preset:</span>
            {(['circle', 'diamond', 'block', 'trapezoid', 'star'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={localShape.presetId === preset}
                className={localShape.presetId === preset ? 'active' : ''}
                onClick={() => {
                  const newShape = createPresetShape(preset)
                  s.setInlaySelectedNodeId(null)
                  commitShapeChange(newShape)
                  s.setInlayPreset(preset)
                }}
              >
                {preset.charAt(0).toUpperCase() + preset.slice(1)}
              </button>
            ))}
            {localShape.presetId === 'custom' && (
              <span className="inlay-custom-badge">Custom shape</span>
            )}
          </div>
        </div>
        <div className="inlay-header-right">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0 && (!!s.neckDraft || !s.history.length)}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={future.length === 0 && (!!s.neckDraft || !s.future.length)}
          >
            Redo
          </button>
          <button type="button" className="accent" onClick={() => s.setActiveWorkspace('guitar')}>
            Done
          </button>
        </div>
      </header>

      <div className="inlay-designer-body">
        {/* Main Canvas Area */}
        <div className="inlay-canvas-wrapper" onClick={() => s.setInlaySelectedNodeId(null)}>
          <div className="inlay-canvas-container" onClick={(e) => e.stopPropagation()}>
            <svg
              ref={svgRef}
              className="inlay-editor-svg"
              viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Coordinate box background */}
              <rect
                x={PADDING}
                y={PADDING}
                width={DRAW_SIZE}
                height={DRAW_SIZE}
                className="inlay-box-bg"
                onClick={() => s.setInlaySelectedNodeId(null)}
              />

              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map((fraction) => (
                <React.Fragment key={fraction}>
                  <line
                    x1={toCanvasX(fraction)}
                    y1={PADDING}
                    x2={toCanvasX(fraction)}
                    y2={CANVAS_SIZE - PADDING}
                    className={`inlay-grid-line ${fraction === 0.5 ? 'centerline' : ''}`}
                  />
                  <line
                    x1={PADDING}
                    y1={toCanvasY(fraction)}
                    x2={CANVAS_SIZE - PADDING}
                    y2={toCanvasY(fraction)}
                    className={`inlay-grid-line ${fraction === 0.5 ? 'centerline' : ''}`}
                  />
                </React.Fragment>
              ))}

              {/* Box border */}
              <rect
                x={PADDING}
                y={PADDING}
                width={DRAW_SIZE}
                height={DRAW_SIZE}
                className="inlay-box-border"
              />

              {/* Axis labels */}
              <text
                x={CANVAS_SIZE / 2}
                y={PADDING - 15}
                textAnchor="middle"
                className="inlay-axis-text"
              >
                Nut side (v = 0)
              </text>
              <text
                x={CANVAS_SIZE / 2}
                y={CANVAS_SIZE - PADDING + 25}
                textAnchor="middle"
                className="inlay-axis-text"
              >
                Bridge side (v = 1)
              </text>
              <text
                x={PADDING - 15}
                y={CANVAS_SIZE / 2}
                textAnchor="middle"
                transform={`rotate(-90 ${PADDING - 15} ${CANVAS_SIZE / 2})`}
                className="inlay-axis-text"
              >
                Bass edge (u = 0)
              </text>
              <text
                x={CANVAS_SIZE - PADDING + 25}
                y={CANVAS_SIZE / 2}
                textAnchor="middle"
                transform={`rotate(90 ${CANVAS_SIZE - PADDING + 25} ${CANVAS_SIZE / 2})`}
                className="inlay-axis-text"
              >
                Treble edge (u = 1)
              </text>

              {/* The Inlay Shape Polygon / Path */}
              {pathString && (
                <path
                  d={pathString}
                  className="inlay-shape-path"
                  fill={inlays.style.fillColor}
                  stroke={inlays.style.strokeColor}
                  strokeWidth={inlays.style.strokeWidthMm * 4}
                />
              )}

              {/* Tangent Handles for selected node */}
              {selectedNode && selectedNode.kind === 'smooth' && (
                <g className="inlay-handles-group">
                  {selectedNode.inHandle && (
                    <g className="inlay-handle-wrapper">
                      <line
                        x1={toCanvasX(selectedNode.x)}
                        y1={toCanvasY(selectedNode.y)}
                        x2={toCanvasX(selectedNode.x + selectedNode.inHandle.dx)}
                        y2={toCanvasY(selectedNode.y + selectedNode.inHandle.dy)}
                        className="inlay-handle-line"
                      />
                      {/* Large invisible hit circle */}
                      <circle
                        cx={toCanvasX(selectedNode.x + selectedNode.inHandle.dx)}
                        cy={toCanvasY(selectedNode.y + selectedNode.inHandle.dy)}
                        r={12}
                        className="inlay-handle-hit-target"
                        onPointerDown={(e) =>
                          handleHandlePointerDown(e, selectedNode.id, 'inHandle')
                        }
                      />
                      <circle
                        cx={toCanvasX(selectedNode.x + selectedNode.inHandle.dx)}
                        cy={toCanvasY(selectedNode.y + selectedNode.inHandle.dy)}
                        r={4.5}
                        className="inlay-handle-point in-handle"
                        pointerEvents="none"
                      />
                    </g>
                  )}
                  {selectedNode.outHandle && (
                    <g className="inlay-handle-wrapper">
                      <line
                        x1={toCanvasX(selectedNode.x)}
                        y1={toCanvasY(selectedNode.y)}
                        x2={toCanvasX(selectedNode.x + selectedNode.outHandle.dx)}
                        y2={toCanvasY(selectedNode.y + selectedNode.outHandle.dy)}
                        className="inlay-handle-line"
                      />
                      {/* Large invisible hit circle */}
                      <circle
                        cx={toCanvasX(selectedNode.x + selectedNode.outHandle.dx)}
                        cy={toCanvasY(selectedNode.y + selectedNode.outHandle.dy)}
                        r={12}
                        className="inlay-handle-hit-target"
                        onPointerDown={(e) =>
                          handleHandlePointerDown(e, selectedNode.id, 'outHandle')
                        }
                      />
                      <circle
                        cx={toCanvasX(selectedNode.x + selectedNode.outHandle.dx)}
                        cy={toCanvasY(selectedNode.y + selectedNode.outHandle.dy)}
                        r={4.5}
                        className="inlay-handle-point out-handle"
                        pointerEvents="none"
                      />
                    </g>
                  )}
                </g>
              )}

              {/* Outline Nodes */}
              <g className="inlay-node-group">
                {localShape.nodes.map((node, index) => {
                  const cx = toCanvasX(node.x)
                  const cy = toCanvasY(node.y)
                  const isSelected = s.inlaySelectedNodeId === node.id
                  const isHovered = s.inlayHoveredNodeId === node.id
                  return (
                    <g key={node.id} className="inlay-node-wrapper">
                      {/* Invisible large hit target circle (r=14) for effortless touch/mouse grabbing */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={14}
                        className="inlay-node-hit-target"
                        onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                        onPointerEnter={() => s.setInlayHoveredNodeId(node.id)}
                        onPointerLeave={() => s.setInlayHoveredNodeId(null)}
                      />
                      {/* Visible node point */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={node.kind === 'corner' ? 6 : 5}
                        className={`inlay-node-point ${node.kind} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                        pointerEvents="none"
                      />
                      <text
                        x={cx + 10}
                        y={cy - 10}
                        className="inlay-node-index"
                        pointerEvents="none"
                      >
                        {index + 1}
                      </text>
                    </g>
                  )
                })}
              </g>
            </svg>
          </div>
        </div>

        {/* Sidebar Inspector */}
        <aside className="inlay-designer-sidebar">
          <div className="inlay-sidebar-card">
            <h3>Node Inspector</h3>
            {selectedNode ? (
              <div className="inlay-node-properties">
                <div className="inlay-prop-row">
                  <span>ID:</span>
                  <code>{selectedNode.id}</code>
                </div>
                <div className="inlay-prop-row">
                  <span>Kind:</span>
                  <div className="inlay-btn-toggle">
                    <button
                      type="button"
                      className={selectedNode.kind === 'corner' ? 'active' : ''}
                      onClick={() => {
                        const nextNodes = localShape.nodes.map((n) =>
                          n.id === selectedNode.id ? { ...n, kind: 'corner' as const } : n,
                        )
                        const nextShape: InlayShape = {
                          ...localShape,
                          presetId: 'custom',
                          nodes: nextNodes,
                        }
                        commitShapeChange(nextShape)
                      }}
                    >
                      Corner
                    </button>
                    <button
                      type="button"
                      className={selectedNode.kind === 'smooth' ? 'active' : ''}
                      onClick={() => {
                        const nextNodes = localShape.nodes.map((n) => {
                          if (n.id !== selectedNode.id) return n
                          const inH = n.inHandle ?? { dx: -0.15, dy: 0 }
                          const outH = { dx: -inH.dx, dy: -inH.dy }
                          return {
                            ...n,
                            kind: 'smooth' as const,
                            inHandle: inH,
                            outHandle: outH,
                            outgoing: 'cubicBezier' as const,
                          }
                        })
                        const nextShape: InlayShape = {
                          ...localShape,
                          presetId: 'custom',
                          nodes: nextNodes,
                        }
                        commitShapeChange(nextShape)
                      }}
                    >
                      Smooth
                    </button>
                  </div>
                </div>
                <div className="inlay-prop-row">
                  <label>
                    u (width):
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={selectedNode.x.toFixed(3)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        if (Number.isFinite(val)) {
                          const clamped = Math.max(0, Math.min(1, val))
                          const nextNodes = localShape.nodes.map((n) =>
                            n.id === selectedNode.id ? { ...n, x: clamped } : n,
                          )
                          const nextShape: InlayShape = {
                            ...localShape,
                            presetId: 'custom',
                            nodes: nextNodes,
                          }
                          commitShapeChange(nextShape)
                        }
                      }}
                    />
                  </label>
                  <label>
                    v (height):
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={selectedNode.y.toFixed(3)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        if (Number.isFinite(val)) {
                          const clamped = Math.max(0, Math.min(1, val))
                          const nextNodes = localShape.nodes.map((n) =>
                            n.id === selectedNode.id ? { ...n, y: clamped } : n,
                          )
                          const nextShape: InlayShape = {
                            ...localShape,
                            presetId: 'custom',
                            nodes: nextNodes,
                          }
                          commitShapeChange(nextShape)
                        }
                      }}
                    />
                  </label>
                </div>
                {selectedNode.kind === 'smooth' && (
                  <p className="field-hint">
                    Drag control handles on canvas to adjust curvature smoothly.
                  </p>
                )}

                {/* Node Actions: Add and Delete point */}
                <div className="inlay-node-actions">
                  <button
                    type="button"
                    className="inlay-add-node-btn"
                    onClick={() => {
                      const selectedIndex = localShape.nodes.findIndex(
                        (n) => n.id === selectedNode.id,
                      )
                      const nextIndex = (selectedIndex + 1) % localShape.nodes.length
                      const curr = localShape.nodes[selectedIndex]
                      const nxt = localShape.nodes[nextIndex]
                      const newNode: OutlineNode = {
                        id: 'inlay-node-' + crypto.randomUUID().slice(0, 8),
                        x: (curr.x + nxt.x) / 2,
                        y: (curr.y + nxt.y) / 2,
                        kind: 'corner',
                        inHandle: null,
                        outHandle: null,
                        outgoing: 'line',
                      }
                      const newNodes = [...localShape.nodes]
                      newNodes.splice(selectedIndex + 1, 0, newNode)
                      const nextShape: InlayShape = {
                        ...localShape,
                        presetId: 'custom',
                        nodes: newNodes,
                      }
                      s.setInlaySelectedNodeId(newNode.id)
                      commitShapeChange(nextShape)
                    }}
                  >
                    + Add point
                  </button>
                  <button
                    type="button"
                    className="inlay-delete-node-btn"
                    disabled={localShape.nodes.length <= 3}
                    onClick={() => {
                      if (localShape.nodes.length > 3) {
                        const nextNodes = localShape.nodes.filter((n) => n.id !== selectedNode.id)
                        const nextShape: InlayShape = {
                          ...localShape,
                          presetId: 'custom',
                          nodes: nextNodes,
                        }
                        s.setInlaySelectedNodeId(null)
                        commitShapeChange(nextShape)
                      }
                    }}
                  >
                    Delete point
                  </button>
                </div>
              </div>
            ) : (
              <p className="field-hint">
                Click on a shape node on the canvas to inspect, move or edit its tangent handles.
              </p>
            )}
          </div>

          {/* Style Properties */}
          <div className="inlay-sidebar-card">
            <h3>Marker Style</h3>
            <div className="inlay-style-fields">
              <label>
                Fill color:
                <div className="inlay-color-input-wrapper">
                  <input
                    type="color"
                    value={inlays.style.fillColor}
                    onChange={(e) => s.setInlayStyle({ fillColor: e.target.value })}
                  />
                  <input
                    type="text"
                    value={inlays.style.fillColor}
                    onChange={(e) => s.setInlayStyle({ fillColor: e.target.value })}
                  />
                </div>
              </label>

              <label>
                Stroke color:
                <div className="inlay-color-input-wrapper">
                  <input
                    type="color"
                    value={inlays.style.strokeColor}
                    onChange={(e) => s.setInlayStyle({ strokeColor: e.target.value })}
                  />
                  <input
                    type="text"
                    value={inlays.style.strokeColor}
                    onChange={(e) => s.setInlayStyle({ strokeColor: e.target.value })}
                  />
                </div>
              </label>

              <label>
                Stroke width (mm):
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.05"
                  value={inlays.style.strokeWidthMm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    if (Number.isFinite(val)) {
                      s.setInlayStyle({ strokeWidthMm: val })
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
