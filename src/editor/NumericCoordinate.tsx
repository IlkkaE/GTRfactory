import { useEffect, useRef, useState } from 'react'
import { isProtectedAnchor, useAppStore } from '../store'
import {
  headstockWorldNodes,
  isProtectedHeadstockNode,
  supportsHeadstock,
} from '../headstock/template'
export function NumericCoordinate({ axis }: { axis: 'x' | 'y' }) {
  const s = useAppStore(),
    doc = s.preview ?? s.document,
    headstock =
      s.editingTarget === 'headstock' && supportsHeadstock(doc) && s.selectedHeadstock.size === 1
        ? headstockWorldNodes(doc).find((n) => s.selectedHeadstock.has(n.id))
        : undefined,
    n =
      headstock ??
      (s.selected.size === 1 ? doc.body.outline.nodes.find((n) => s.selected.has(n.id)) : undefined)
  const value = n ? (s.unit === 'mm' ? n[axis] : n[axis] / 25.4) : 0
  const shown = n ? String(Number(value.toFixed(s.unit === 'mm' ? 4 : 6))) : ''
  const [draft, setDraft] = useState(shown),
    edited = useRef(false)
  useEffect(() => {
    setDraft(shown)
    edited.current = false
  }, [shown, n?.id, s.unit, s.revision])
  if (!n) return null
  const protectedNode = headstock
    ? isProtectedHeadstockNode(n.id, doc.neck!.headstock)
    : isProtectedAnchor(s.preview ?? s.document, n.id)
  const apply = () => {
    if (!edited.current) return
    edited.current = false
    const text = draft.trim().replace(',', '.')
    if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) {
      const number = Number(text)
      if (Number.isFinite(number)) {
        const next = s.unit === 'in' ? number * 25.4 : number
        if (headstock) s.setHeadstockCoordinate(axis, next)
        else s.setCoordinate(axis, next)
      }
    }
    const state = useAppStore.getState(),
      current = headstock
        ? headstockWorldNodes(state.document).find((v) => v.id === n.id)
        : state.document.body.outline.nodes.find((v) => v.id === n.id)
    if (current)
      setDraft(
        String(
          Number(
            (s.unit === 'mm' ? current[axis] : current[axis] / 25.4).toFixed(
              s.unit === 'mm' ? 4 : 6,
            ),
          ),
        ),
      )
  }
  return (
    <label>
      {axis.toUpperCase()}{' '}
      <input
        aria-label={`Node ${axis.toUpperCase()}`}
        inputMode="decimal"
        value={draft}
        disabled={protectedNode}
        onChange={(e) => {
          edited.current = true
          setDraft(e.target.value)
        }}
        onBlur={apply}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            apply()
            e.currentTarget.blur()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            edited.current = false
            setDraft(shown)
            e.currentTarget.blur()
          }
        }}
      />
    </label>
  )
}
