import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PICKUP_PROFILES } from '../pickup/profiles'
import { useAppStore } from '../store'

const useMenuLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
export function PickupProfileMenu({
  label,
  disabled,
  current,
  onChoose,
}: {
  label: string
  disabled: boolean
  current?: string
  onChoose: (id: string, version: number) => void
}) {
  const [open, setOpen] = useState(false),
    [position, setPosition] = useState({ left: 8, top: 8 })
  const trigger = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null),
    id = useId()
  const close = (focus = false) => {
    setOpen(false)
    if (focus) trigger.current?.focus({ preventScroll: true })
  }
  useMenuLayoutEffect(() => {
    if (!open) return
    const anchor = trigger.current!.getBoundingClientRect(),
      panel = menu.current!.getBoundingClientRect()
    setPosition({
      left: Math.max(8, Math.min(anchor.left, innerWidth - panel.width - 8)),
      top: Math.max(8, Math.min(anchor.bottom + 5, innerHeight - panel.height - 8)),
    })
    const first = menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')
    first?.focus({ preventScroll: true })
    first?.scrollIntoView({ block: 'nearest' })
  }, [open])
  useEffect(() => {
    if (!open) return
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node))
        close()
    }
    const resize = () => close()
    window.addEventListener('pointerdown', outside)
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('pointerdown', outside)
      window.removeEventListener('resize', resize)
    }
  }, [open])
  useEffect(() => {
    if (disabled) close()
  }, [disabled])
  return (
    <>
      <button
        ref={trigger}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setOpen(true)
          }
          if (e.key === 'Escape') close()
        }}
      >
        {label}
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            id={id}
            role="menu"
            aria-label={label}
            className="pickup-profile-popup"
            style={position}
            onBlur={(e) => {
              if (
                !e.currentTarget.contains(e.relatedTarget as Node) &&
                e.relatedTarget !== trigger.current
              )
                close()
            }}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Escape') {
                e.preventDefault()
                close(true)
                return
              }
              if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
                e.preventDefault()
                const items = Array.from(
                    menu.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
                  ),
                  index = items.indexOf(document.activeElement as HTMLButtonElement)
                const next =
                  e.key === 'Home'
                    ? 0
                    : e.key === 'End'
                      ? items.length - 1
                      : (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
                items[next]?.focus({ preventScroll: true })
                items[next]?.scrollIntoView({ block: 'nearest' })
              }
            }}
          >
            {PICKUP_PROFILES.map((p) => (
              <button
                key={p.id + p.version}
                role="menuitem"
                disabled={p.id === current}
                title={p.source}
                data-string-count={p.stringCount}
                onClick={() => {
                  onChoose(p.id, p.version)
                  close(true)
                }}
              >
                <svg
                  aria-hidden="true"
                  viewBox={`${-p.widthMm / 2} ${-p.lengthMm / 2} ${p.widthMm} ${p.lengthMm}`}
                >
                  <path d={p.path} />
                </svg>
                <span>
                  {p.name}
                  <small>
                    {p.stringCount} strings · {p.widthMm.toFixed(1)} × {p.lengthMm.toFixed(1)} mm
                  </small>
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
export function PickupMenu() {
  const s = useAppStore()
  return (
    <PickupProfileMenu
      label="+ Pickup cavity"
      disabled={!!s.neckDraft || !!s.drag}
      onChoose={s.addPickup}
    />
  )
}
