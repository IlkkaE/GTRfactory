import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BODY_COLOR_OPTIONS, BODY_TEXTURE_OPTIONS, DEFAULT_BODY_COLOR } from '../model/project'
import { useAppStore } from '../store'

const usePickerLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function BodyColorPicker({ disabled = false }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 8, top: 8 })
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const id = useId()
  const s = useAppStore()
  const currentColor = s.document.body.color ?? DEFAULT_BODY_COLOR

  const activeTexture = currentColor.startsWith('texture:')
    ? BODY_TEXTURE_OPTIONS.find((t) => `texture:${t.id}` === currentColor)
    : null

  const triggerBackground = activeTexture
    ? `url(${activeTexture.image}) center/cover no-repeat`
    : currentColor

  const close = (focus = false) => {
    setOpen(false)
    if (focus) trigger.current?.focus({ preventScroll: true })
  }

  usePickerLayoutEffect(() => {
    if (!open) return
    const anchor = trigger.current!.getBoundingClientRect()
    const panel = menu.current!.getBoundingClientRect()
    setPosition({
      left: Math.max(8, Math.min(anchor.left, window.innerWidth - panel.width - 8)),
      top: Math.max(8, Math.min(anchor.bottom + 5, window.innerHeight - panel.height - 8)),
    })
    const active =
      menu.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]') ??
      menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')
    active?.focus({ preventScroll: true })
    active?.scrollIntoView({ block: 'nearest' })
  }, [open])

  useEffect(() => {
    if (!open) return
    const outside = (e: PointerEvent) => {
      if (
        !menu.current?.contains(e.target as Node) &&
        !trigger.current?.contains(e.target as Node)
      ) {
        close()
      }
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

  const selectColor = (hex: string) => {
    s.setBodyColor(hex)
    close(true)
  }

  return (
    <>
      <button
        ref={trigger}
        className="body-color-trigger"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? id : undefined}
        aria-label="Body finish"
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
        <span
          className="body-color-swatch-badge"
          style={{ background: triggerBackground }}
          aria-hidden="true"
        />
        <span>Color</span>
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            id={id}
            role="menu"
            aria-label="Body finishes"
            className="body-color-popup"
            style={position}
            onBlur={(e) => {
              if (
                !e.currentTarget.contains(e.relatedTarget as Node) &&
                e.relatedTarget !== trigger.current
              ) {
                close()
              }
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
                const buttons = [
                  ...(menu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ??
                    []),
                ]
                if (!buttons.length) return
                const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
                const nextIndex =
                  e.key === 'Home'
                    ? 0
                    : e.key === 'End'
                      ? buttons.length - 1
                      : e.key === 'ArrowDown'
                        ? (index + 1) % buttons.length
                        : (index - 1 + buttons.length) % buttons.length
                buttons[nextIndex]?.focus()
              }
            }}
          >
            <div className="body-color-section-heading">Wood Textures</div>
            {BODY_TEXTURE_OPTIONS.map((texture) => {
              const value = `texture:${texture.id}`
              const isSelected = currentColor === value
              return (
                <button
                  key={texture.id}
                  role="menuitem"
                  className="body-color-option"
                  aria-pressed={isSelected}
                  onClick={() => selectColor(value)}
                >
                  <span
                    className="body-color-swatch"
                    style={{ background: `url(${texture.image}) center/cover no-repeat` }}
                    aria-hidden="true"
                  />
                  <span className="body-color-name">{texture.name}</span>
                  {isSelected && (
                    <span className="body-color-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}

            <div className="body-color-section-heading">Colors</div>
            {BODY_COLOR_OPTIONS.map((option) => {
              const isSelected = currentColor.toLowerCase() === option.hex.toLowerCase()
              return (
                <button
                  key={option.id}
                  role="menuitem"
                  className="body-color-option"
                  aria-pressed={isSelected}
                  onClick={() => selectColor(option.hex)}
                >
                  <span
                    className="body-color-swatch"
                    style={{ backgroundColor: option.hex }}
                    aria-hidden="true"
                  />
                  <span className="body-color-name">{option.name}</span>
                  {isSelected && (
                    <span className="body-color-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}
