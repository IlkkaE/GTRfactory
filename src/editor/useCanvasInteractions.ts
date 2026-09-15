import { type PointerEvent, type RefObject, useEffect, useRef, useState } from 'react'
import { type Point } from '../geometry/outline'
import { type OutlineNode } from '../model/project'
import { headstockWorldNodes } from '../headstock/template'
import { type Camera, type EditorState, type ViewId, useAppStore } from '../store'
import { nearestSegmentParameter } from './segmentSelection'
import { snappedDelta, type GridSizeMm } from './grid'
import { pxToWorld, RULER, screenDeltaToWorld, type Size, type Transform } from './viewport'

export const isTyping = (target: EventTarget | null) => {
  const el = target as HTMLElement | null
  return (
    !!el &&
    (!!el.closest('input, textarea, select, [contenteditable="true"]') || el.isContentEditable)
  )
}

type Gesture = {
  mode:
    | 'node'
    | 'handle'
    | 'headstockNode'
    | 'headstockHandle'
    | 'pickup'
    | 'electronicsCavity'
    | 'electronicsResize'
    | 'marquee'
    | 'pan'
  pointerId: number
  start: Point
  latest: Point
  client: Point
  transform: Transform
  camera: Camera
  originalSelection: Set<string>
  additive: boolean
  id?: string
  side?: 'inHandle' | 'outHandle' | 'left' | 'right' | 'top' | 'bottom'
}

type CanvasInteractionProps = {
  svg: RefObject<SVGSVGElement>
  view: ViewId
  small: boolean
  panMode: boolean
  nodes: OutlineNode[]
  transform: Transform
  camera: Camera
  size: Size
  generation: number
  drag: EditorState['drag']
  gridMm: GridSizeMm
  onSelectNeck?: () => void
  onSelectHeadstock?: () => void
  onSelectRadius?: () => void
}

export function useCanvasInteractions({
  svg,
  view,
  small,
  panMode,
  nodes,
  transform,
  camera,
  size,
  generation,
  drag,
  gridMm,
  onSelectNeck,
  onSelectHeadstock,
  onSelectRadius,
}: CanvasInteractionProps) {
  const gesture = useRef<Gesture | null>(null)
  const space = useRef(false)
  const [marquee, setMarquee] = useState<{ a: Point; b: Point } | null>(null)
  const local = (e: { clientX: number; clientY: number }) => {
    const r = svg.current!.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) * size.width) / r.width,
      y: ((e.clientY - r.top) * size.height) / r.height,
    }
  }
  const clear = () => {
    const active = gesture.current
    gesture.current = null
    setMarquee(null)
    if (active && svg.current?.hasPointerCapture(active.pointerId))
      svg.current.releasePointerCapture(active.pointerId)
  }
  const cancel = () => {
    const active = gesture.current
    if (active?.mode === 'pan') useAppStore.getState().setCamera(view, active.camera)
    useAppStore.getState().cancel()
    clear()
  }
  const panRequested = (e: PointerEvent) => e.button === 1 || space.current || panMode
  const begin = (
    e: PointerEvent<SVGElement>,
    mode: Gesture['mode'],
    id?: string,
    side?: Gesture['side'],
  ) => {
    if (small || !svg.current || (e.button !== 0 && e.button !== 1)) return
    e.preventDefault()
    e.stopPropagation()
    svg.current.focus({ preventScroll: true })
    if (panRequested(e)) mode = 'pan'
    const current = useAppStore.getState()
    const originalSelection = new Set(current.selected)
    if (mode !== 'pan' && current.neckDraft) {
      if (current.neckDraft.pending)
        current.setMessage('Accept or cancel the neck change before editing the body.')
      else current.cancelNeckDraft()
      return
    }
    if (mode === 'headstockNode' && id) {
      if (e.shiftKey) {
        current.selectHeadstock(id, true)
        return
      }
      if (!current.selectedHeadstock.has(id)) current.selectHeadstock(id)
    }
    if (mode === 'node' && id) {
      if (e.shiftKey) {
        current.select(id, true)
        return
      }
      if (!current.selected.has(id)) current.select(id)
    }
    if (mode === 'handle' && id) current.select(id)
    if (mode === 'headstockHandle' && id) current.selectHeadstock(id)
    const pixel = local(e)
    gesture.current = {
      mode,
      pointerId: e.pointerId,
      start: pxToWorld(pixel, transform),
      latest: pxToWorld(pixel, transform),
      client: pixel,
      transform,
      camera: { ...camera },
      id,
      side,
      originalSelection,
      additive: e.shiftKey,
    }
    if (mode === 'node' || mode === 'handle')
      current.beginDrag(
        mode === 'node' ? 'nodes' : 'handle',
        new Set(useAppStore.getState().selected),
      )
    if (mode === 'headstockNode' || mode === 'headstockHandle')
      current.beginDrag(
        mode === 'headstockNode' ? 'headstockNodes' : 'headstockHandle',
        new Set(useAppStore.getState().selectedHeadstock),
      )
    if (mode === 'marquee') setMarquee({ a: pixel, b: pixel })
    svg.current.setPointerCapture(e.pointerId)
  }
  const onElectronicsPointerDown = (
    e: PointerEvent<SVGElement>,
    side?: 'left' | 'right' | 'top' | 'bottom',
  ) => {
    if (small || !svg.current || e.button !== 0) return
    if (panRequested(e)) {
      begin(e, 'pan')
      return
    }
    e.preventDefault()
    e.stopPropagation()
    svg.current.focus({ preventScroll: true })
    const state = useAppStore.getState()
    const pixel = local(e)
    if (state.drag || state.neckDraft || view !== 'back') {
      if (state.neckDraft)
        state.setMessage('Accept or cancel the unfinished neck change before editing the cavity.')
      return
    }
    state.beginRearElectronicsCavityDrag(side)
    if (
      !['electronicsCavity', 'electronicsResize'].includes(useAppStore.getState().drag?.kind ?? '')
    )
      return
    gesture.current = {
      mode: side ? 'electronicsResize' : 'electronicsCavity',
      pointerId: e.pointerId,
      start: pxToWorld(pixel, transform),
      latest: pxToWorld(pixel, transform),
      client: pixel,
      transform,
      camera: { ...camera },
      originalSelection: new Set(),
      additive: false,
      side,
    }
    svg.current.setPointerCapture(e.pointerId)
  }
  const onPickupPointerDown = (e: PointerEvent<SVGPathElement>, id: string) => {
    if (small || !svg.current || e.button !== 0) return
    if (panRequested(e)) {
      begin(e, 'pan')
      return
    }
    e.preventDefault()
    e.stopPropagation()
    svg.current.focus({ preventScroll: true })
    const state = useAppStore.getState()
    if (state.neckDraft) {
      state.setMessage('Accept or cancel the neck change before editing the pickup cavity.')
      return
    }
    const pixel = local(e)
    state.beginPickupDrag(id)
    gesture.current = {
      mode: 'pickup',
      pointerId: e.pointerId,
      start: pxToWorld(pixel, transform),
      latest: pxToWorld(pixel, transform),
      client: pixel,
      transform,
      camera: { ...camera },
      id,
      originalSelection: new Set(),
      additive: false,
    }
    svg.current.setPointerCapture(e.pointerId)
  }
  const onElectronicsHandleKeyDown = (
    e: React.KeyboardEvent<SVGElement>,
    side: 'left' | 'right' | 'top' | 'bottom',
  ) => {
    const step = e.shiftKey ? 10 : 1
    const d: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }
    if (!d[e.key]) return
    e.preventDefault()
    e.stopPropagation()
    if (small || view !== 'back' || useAppStore.getState().drag || useAppStore.getState().neckDraft)
      return
    const { x: dx, y: dy } = screenDeltaToWorld(d[e.key], transform)
    if (
      ((side === 'left' || side === 'right') && dx === 0) ||
      ((side === 'top' || side === 'bottom') && dy === 0)
    ) {
      const state = useAppStore.getState()
      state.beginRearElectronicsCavityDrag(side)
      if (
        ['electronicsCavity', 'electronicsResize'].includes(useAppStore.getState().drag?.kind ?? '')
      ) {
        state.previewRearElectronicsCavity(dx, dy)
        state.commit()
      }
    }
  }
  const onPickupKeyboardSelect = (e: React.KeyboardEvent<SVGElement>, id: string) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    useAppStore.getState().selectPickup(id)
  }
  const onCanvasPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const active = gesture.current
    if (!active || active.pointerId !== e.pointerId) return
    const pixel = local(e)
    const point = pxToWorld(pixel, active.transform)
    active.latest = point
    const state = useAppStore.getState()
    if (active.mode === 'pan') {
      state.setCamera(view, {
        panX: active.camera.panX + pixel.x - active.client.x,
        panY: active.camera.panY + pixel.y - active.client.y,
      })
      return
    }
    if (active.mode === 'marquee') {
      setMarquee({ a: active.client, b: pixel })
      return
    }
    if (active.mode === 'node') {
      const anchor = active.id
        ? state.drag?.before.body.outline.nodes.find((node) => node.id === active.id)
        : undefined
      const delta = snappedDelta(
        anchor ?? active.start,
        { x: point.x - active.start.x, y: point.y - active.start.y },
        gridMm,
      )
      state.previewMove(delta.x, delta.y)
    } else if (active.mode === 'headstockNode')
      state.previewHeadstockMove(point.x - active.start.x, point.y - active.start.y)
    else if (
      active.mode === 'headstockHandle' &&
      active.id &&
      (active.side === 'inHandle' || active.side === 'outHandle')
    ) {
      const node =
        state.drag?.before.neck &&
        headstockWorldNodes(state.drag.before).find((candidate) => candidate.id === active.id)
      if (node)
        state.previewHeadstockHandle(
          active.id,
          active.side,
          point.x - active.start.x,
          point.y - active.start.y,
        )
    } else if (active.mode === 'electronicsCavity' || active.mode === 'electronicsResize')
      state.previewRearElectronicsCavity(point.x - active.start.x, point.y - active.start.y)
    else if (active.mode === 'pickup')
      state.previewPickup(
        (state.drag?.pickupCenterY ?? active.start.y) + (point.y - active.start.y),
      )
    else if (active.id && (active.side === 'inHandle' || active.side === 'outHandle')) {
      const node = state.drag?.before.body.outline.nodes.find(
        (candidate) => candidate.id === active.id,
      )
      if (node) {
        const handle = node[active.side]
        if (gridMm === 0) {
          state.previewHandle(active.id, active.side, point.x - node.x, point.y - node.y)
          return
        }
        const delta = snappedDelta(
          { x: node.x + (handle?.dx ?? 0), y: node.y + (handle?.dy ?? 0) },
          { x: point.x - active.start.x, y: point.y - active.start.y },
          gridMm,
        )
        state.previewHandle(
          active.id,
          active.side,
          (handle?.dx ?? 0) + delta.x,
          (handle?.dy ?? 0) + delta.y,
        )
      }
    }
  }
  const onCanvasPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    const active = gesture.current
    if (!active || active.pointerId !== e.pointerId) return
    const state = useAppStore.getState()
    if (active.mode === 'marquee') {
      const point = active.latest
      const loX = Math.min(active.start.x, point.x)
      const hiX = Math.max(active.start.x, point.x)
      const loY = Math.min(active.start.y, point.y)
      const hiY = Math.max(active.start.y, point.y)
      const selected = active.additive ? new Set(active.originalSelection) : new Set<string>()
      for (const node of nodes)
        if (
          node.x >= loX &&
          node.x <= hiX &&
          node.y >= loY &&
          node.y <= hiY &&
          (view !== 'pocket' || node.y <= transform.world.maxY)
        )
          selected.add(node.id)
      state.setSelection(selected)
    } else if (active.mode !== 'pan') state.commit()
    clear()
  }
  const onCanvasPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    const pixel = local(e)
    if (pixel.x >= RULER && pixel.y >= RULER) begin(e, 'marquee')
  }
  const onCanvasLostPointerCapture = () => {
    if (gesture.current) cancel()
  }
  const onCanvasWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (small || gesture.current) return
    useAppStore.getState().setCamera(view, { zoom: camera.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15) })
  }
  const onBodySegmentPointerDown = (e: PointerEvent<SVGPathElement>, id: string) => {
    if (panRequested(e)) {
      begin(e, 'pan')
      return
    }
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    svg.current?.focus({ preventScroll: true })
    const current = useAppStore.getState()
    if (current.neckDraft) {
      if (current.neckDraft.pending)
        current.setMessage('Accept or cancel the neck change before editing the body.')
      else current.cancelNeckDraft()
      return
    }
    current.selectSegment(
      id,
      nearestSegmentParameter(
        nodes,
        nodes.findIndex((node) => node.id === id),
        pxToWorld(local(e), transform),
      ),
    )
  }
  const onHeadstockSegmentPointerDown = (e: PointerEvent<SVGPathElement>, id: string) => {
    if (panRequested(e)) {
      begin(e, 'pan')
      return
    }
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    svg.current?.focus({ preventScroll: true })
    const state = useAppStore.getState()
    if (state.neckDraft || state.drag) return
    const world = headstockWorldNodes(state.document)
    state.selectHeadstockSegment(
      id,
      nearestSegmentParameter(
        world,
        world.findIndex((node) => node.id === id),
        pxToWorld(local(e), transform),
      ),
    )
  }
  const onBodyKeyboardSelect = (
    e: React.KeyboardEvent<SVGElement>,
    id: string,
    segment = false,
  ) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    e.stopPropagation()
    const state = useAppStore.getState()
    if (state.neckDraft) {
      if (state.neckDraft.pending)
        state.setMessage('Accept or cancel the neck change before editing the body.')
      else state.cancelNeckDraft()
      return
    }
    if (segment) state.selectSegment(id, 0.5)
    else state.select(id, e.shiftKey)
  }
  const onHeadstockSegmentKeyboardSelect = (e: React.KeyboardEvent<SVGElement>, id: string) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    e.stopPropagation()
    const state = useAppStore.getState()
    state.selectHeadstockSegment(id, 0.5)
  }
  const onRadiusPointerDown = (e: PointerEvent<SVGElement>) => {
    if (panRequested(e)) {
      begin(e, 'pan')
      return
    }
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    onSelectRadius?.()
  }
  const onRadiusKeyboardSelect = (e: React.KeyboardEvent<SVGElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    e.stopPropagation()
    onSelectRadius?.()
  }
  const onNeckPointerDown = (e: PointerEvent<SVGElement>) => {
    if (!small && onSelectNeck && e.button === 0 && !panRequested(e)) {
      e.preventDefault()
      e.stopPropagation()
      onSelectNeck()
    }
  }
  const onNeckKeyboardSelect = (e: React.KeyboardEvent<SVGElement>) => {
    if (onSelectNeck && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      e.stopPropagation()
      onSelectNeck()
    }
  }
  const onHeadstockPointerDown = (e: PointerEvent<SVGElement>) => {
    if (!small && onSelectHeadstock && e.button === 0 && !panRequested(e)) {
      e.preventDefault()
      e.stopPropagation()
      onSelectHeadstock()
    }
  }
  const onHeadstockOutlineKeyboardSelect = (e: React.KeyboardEvent<SVGElement>) => {
    if (onSelectHeadstock && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onSelectHeadstock()
    }
  }
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (small || isTyping(e.target) || document.querySelector('dialog[open]')) return
      if (e.code === 'Space') {
        space.current = true
        if (!(e.target as Element)?.closest('button, [role="button"]')) e.preventDefault()
      }
      if (e.key === 'Escape') cancel()
    }
    const keyup = (e: KeyboardEvent) => {
      if (e.code === 'Space') space.current = false
    }
    const blur = () => {
      space.current = false
      cancel()
    }
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', blur)
    }
  }, [small, view])
  useEffect(() => {
    clear()
  }, [view, generation])
  useEffect(
    () => () => {
      const active = gesture.current
      const state = useAppStore.getState()
      if (active?.mode === 'pan' && state.generation === generation)
        state.setCamera(view, active.camera)
      gesture.current = null
    },
    [view, generation],
  )
  useEffect(() => {
    if (gesture.current) cancel()
  }, [size.width, size.height])
  useEffect(() => {
    const element = svg.current
    const preventScroll = (e: WheelEvent) => {
      if (!small) e.preventDefault()
    }
    element?.addEventListener('wheel', preventScroll, { passive: false })
    return () => element?.removeEventListener('wheel', preventScroll)
  }, [small, size.width > RULER, size.height > RULER])
  useEffect(() => {
    if (
      gesture.current &&
      [
        'node',
        'handle',
        'pickup',
        'electronicsCavity',
        'electronicsResize',
        'headstockNode',
        'headstockHandle',
      ].includes(gesture.current.mode) &&
      !drag
    )
      clear()
  }, [drag])
  return {
    marquee,
    canvas: {
      onPointerMove: onCanvasPointerMove,
      onPointerUp: onCanvasPointerUp,
      onPointerCancel: cancel,
      onLostPointerCapture: onCanvasLostPointerCapture,
      onWheel: onCanvasWheel,
      onPointerDown: onCanvasPointerDown,
    },
    body: {
      onNodePointerDown: (e: PointerEvent<SVGElement>, id: string) => begin(e, 'node', id),
      onHandlePointerDown: (e: PointerEvent<SVGElement>, id: string, side: Gesture['side']) =>
        begin(e, 'handle', id, side as 'inHandle' | 'outHandle'),
      onSegmentPointerDown: onBodySegmentPointerDown,
      onKeyboardSelect: onBodyKeyboardSelect,
    },
    pickup: { onPointerDown: onPickupPointerDown, onKeyboardSelect: onPickupKeyboardSelect },
    electronics: {
      onPointerDown: onElectronicsPointerDown,
      onHandleKeyDown: onElectronicsHandleKeyDown,
      onKeyboardSelect: (e: React.KeyboardEvent<SVGElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          useAppStore.getState().selectRearElectronicsCavity(true)
        }
      },
    },
    neck: {
      onPointerDown: onNeckPointerDown,
      onKeyboardSelect: onNeckKeyboardSelect,
    },
    headstock: {
      onPointerDown: onHeadstockPointerDown,
      onKeyboardSelect: onHeadstockOutlineKeyboardSelect,
      onNodePointerDown: (e: PointerEvent<SVGElement>, id: string) => begin(e, 'headstockNode', id),
      onNodeKeyboardSelect: (e: React.KeyboardEvent<SVGElement>, id: string) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        useAppStore.getState().selectHeadstock(id)
      },
      onHandlePointerDown: (e: PointerEvent<SVGElement>, id: string, side: Gesture['side']) =>
        begin(e, 'headstockHandle', id, side),
      onSegmentPointerDown: onHeadstockSegmentPointerDown,
      onSegmentKeyboardSelect: (e: React.KeyboardEvent<SVGElement>, id: string) =>
        onHeadstockSegmentKeyboardSelect(e, id),
    },
    radius: { onPointerDown: onRadiusPointerDown, onKeyboardSelect: onRadiusKeyboardSelect },
  }
}
