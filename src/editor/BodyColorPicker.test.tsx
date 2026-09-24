import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  BODY_COLOR_OPTIONS,
  BODY_TEXTURE_OPTIONS,
  DEFAULT_BODY_COLOR,
  createStarterDocument,
} from '../model/project'
import { parseProject, serializeProject } from '../file/projectFile'
import { useAppStore } from '../store'
import { BodyColorPicker } from './BodyColorPicker'

describe('BodyColorPicker and body finish feature', () => {
  beforeEach(() => {
    useAppStore.getState().replace(createStarterDocument())
  })

  it('defines 10 valid predefined color choices and 4 wood textures', () => {
    expect(BODY_COLOR_OPTIONS).toHaveLength(10)
    const colorIds = new Set(BODY_COLOR_OPTIONS.map((o) => o.id))
    const hexes = new Set(BODY_COLOR_OPTIONS.map((o) => o.hex.toLowerCase()))
    expect(colorIds.size).toBe(10)
    expect(hexes.size).toBe(10)

    for (const opt of BODY_COLOR_OPTIONS) {
      expect(opt.name.trim().length).toBeGreaterThan(0)
      expect(/^#[0-9a-fA-F]{6}$/.test(opt.hex)).toBe(true)
    }

    expect(BODY_TEXTURE_OPTIONS).toHaveLength(4)
    const expectedTextures = ['walnut', 'swamp-ash', 'maple', 'figured-maple']
    expect(BODY_TEXTURE_OPTIONS.map((t) => t.id)).toEqual(expectedTextures)

    for (const tex of BODY_TEXTURE_OPTIONS) {
      expect(tex.image).toMatch(/^\/textures\/[a-z-]+\.jpg$/)
      expect(tex.name.trim().length).toBeGreaterThan(0)
    }

    const defaultOption = BODY_COLOR_OPTIONS.find(
      (o) => o.hex.toLowerCase() === DEFAULT_BODY_COLOR.toLowerCase(),
    )
    expect(defaultOption).toBeDefined()
  })

  it('renders trigger button with current color and accessible label', () => {
    const html = renderToStaticMarkup(<BodyColorPicker />)
    expect(html).toContain('aria-label="Body finish"')
    expect(html).toContain('Color')
    expect(html).toContain('body-color-swatch-badge')
    expect(html).toContain(DEFAULT_BODY_COLOR)
  })

  it('updates body color and wood texture in store with undo and redo support', () => {
    const store = useAppStore.getState()
    expect(store.document.body.color).toBe(DEFAULT_BODY_COLOR)

    // Set solid color
    store.setBodyColor('#bd332a')
    expect(useAppStore.getState().document.body.color).toBe('#bd332a')
    expect(useAppStore.getState().dirty).toBe(true)
    expect(useAppStore.getState().history).toHaveLength(1)

    // Set wood texture
    useAppStore.getState().setBodyColor('texture:figured-maple')
    expect(useAppStore.getState().document.body.color).toBe('texture:figured-maple')
    expect(useAppStore.getState().history).toHaveLength(2)

    useAppStore.getState().undo()
    expect(useAppStore.getState().document.body.color).toBe('#bd332a')

    useAppStore.getState().undo()
    expect(useAppStore.getState().document.body.color).toBe(DEFAULT_BODY_COLOR)

    useAppStore.getState().redo()
    expect(useAppStore.getState().document.body.color).toBe('#bd332a')

    useAppStore.getState().redo()
    expect(useAppStore.getState().document.body.color).toBe('texture:figured-maple')
  })

  it('preserves color and textures across file roundtrips and validates schema strictly', () => {
    const doc = createStarterDocument()
    doc.body.color = '#deb258'
    const loaded = parseProject(serializeProject(doc))
    expect(loaded.body.color).toBe('#deb258')

    // Wood texture roundtrips
    doc.body.color = 'texture:walnut'
    const loadedTex = parseProject(serializeProject(doc))
    expect(loadedTex.body.color).toBe('texture:walnut')

    // Missing color defaults safely to DEFAULT_BODY_COLOR
    const raw = JSON.parse(serializeProject(doc))
    delete raw.body.color
    const migrated = parseProject(JSON.stringify(raw))
    expect(migrated.body.color).toBe(DEFAULT_BODY_COLOR)

    // Invalid color/texture format is rejected
    raw.body.color = 'texture:unknown-wood'
    expect(() => parseProject(JSON.stringify(raw))).toThrow(
      'The body finish must be a valid hex color or wood texture.',
    )

    raw.body.color = 'not-a-color'
    expect(() => parseProject(JSON.stringify(raw))).toThrow(
      'The body finish must be a valid hex color or wood texture.',
    )
  })
})
