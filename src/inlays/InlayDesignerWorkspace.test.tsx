import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { InlayDesignerWorkspace } from './InlayDesignerWorkspace'
import { App } from '../App'
import * as storeModule from '../store'
import { NeckWorkspace } from '../editor/NeckWorkspace'

describe('InlayDesignerWorkspace', () => {
  beforeEach(() => {
    storeModule.useAppStore.getState().newProject()
    vi.restoreAllMocks()
  })

  it('renders inlay designer with controls and normalized coordinate system', () => {
    const html = renderToStaticMarkup(<InlayDesignerWorkspace />)
    expect(html).toContain('Inlay Designer')
    expect(html).toContain('Back to Guitar')
    expect(html).toContain('Preset:')
    expect(html).toContain('Circle')
    expect(html).toContain('Diamond')
    expect(html).toContain('Block')
    expect(html).toContain('Trapezoid')
    expect(html).toContain('Star')
    expect(html).toContain('Nut side (v = 0)')
    expect(html).toContain('Bridge side (v = 1)')
    expect(html).toContain('Bass edge (u = 0)')
    expect(html).toContain('Treble edge (u = 1)')
    expect(html).toContain('Node Inspector')
    expect(html).toContain('Marker Style')
    expect(html).toContain('Fill color:')
    expect(html).toContain('Stroke color:')
    expect(html).toContain('inlay-node-group')
  })

  it('renders inspector controls and tangent handles when a node is selected', () => {
    const s = storeModule.useAppStore.getState()
    s.setInlayEnabled(true)
    s.setInlayPreset('circle')
    const inlays = storeModule.useAppStore.getState().document.fretboardInlays!
    const firstNode = inlays.shape.nodes[0]
    s.setInlaySelectedNodeId(firstNode.id)

    vi.spyOn(storeModule, 'useAppStore').mockImplementation(((selector?: any) => {
      const state = storeModule.useAppStore.getState()
      return selector ? selector(state) : state
    }) as any)

    const html = renderToStaticMarkup(<InlayDesignerWorkspace />)
    expect(html).toContain('ID:')
    expect(html).toContain(firstNode.id)
    expect(html).toContain('Corner')
    expect(html).toContain('Smooth')
    expect(html).toContain('u (width):')
    expect(html).toContain('v (height):')
    expect(html).toContain('+ Add point')
    expect(html).toContain('Delete point')
    expect(html).toContain('inlay-handles-group')
    expect(html).toContain('inlay-handle-wrapper')
  })

  it('switches app view to inlay designer when activeWorkspace is inlays', () => {
    storeModule.useAppStore.getState().setActiveWorkspace('inlays')

    vi.spyOn(storeModule, 'useAppStore').mockImplementation(((selector?: any) => {
      const state = storeModule.useAppStore.getState()
      return selector ? selector(state) : state
    }) as any)

    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('Inlay Designer')
    expect(html).toContain('Back to Guitar')
    expect(html).not.toContain('Editing tools')
  })

  it('renders all fret buttons in neck workspace inlays tab', () => {
    const s = storeModule.useAppStore.getState()
    s.startNeckDraft()
    s.setInlayEnabled(true)

    vi.spyOn(storeModule, 'useAppStore').mockImplementation(((selector?: any) => {
      const state = storeModule.useAppStore.getState()
      return selector ? selector(state) : state
    }) as any)

    const draft = storeModule.useAppStore.getState().neckDraft!
    expect(draft).not.toBeNull()
    const fretCount = draft.change.params.frets

    const html = renderToStaticMarkup(
      <NeckWorkspace focusRequest={{ group: 'Inlays', field: null, token: 1 }} />,
    )

    expect(html).toContain('Inlays')
    expect(html).toContain('Marked frets')
    expect(html).toContain(`>${fretCount}</button>`)
    expect(html).toContain('>Open Inlay Designer</button>')
  })
  it('reads inlays from neckDraft.document when neckDraft is active and document.fretboardInlays is null', () => {
    const s = storeModule.useAppStore.getState()
    expect(s.document.fretboardInlays).toBeNull()

    // Start neck draft and enable inlays in the draft (as user does in Neck Workspace)
    s.startNeckDraft()
    s.setInlayEnabled(true)
    s.setInlayPreset('trapezoid')

    // Document inlays is still null, but draft has trapezoid
    expect(storeModule.useAppStore.getState().document.fretboardInlays).toBeNull()
    expect(
      storeModule.useAppStore.getState().neckDraft?.document.fretboardInlays?.shape.presetId,
    ).toBe('trapezoid')

    vi.spyOn(storeModule, 'useAppStore').mockImplementation(((selector?: any) => {
      const state = storeModule.useAppStore.getState()
      return selector ? selector(state) : state
    }) as any)

    const html = renderToStaticMarkup(<InlayDesignerWorkspace />)
    // The trapezoid preset button must have aria-pressed="true" and class="active"
    expect(html).toContain('aria-pressed="true" class="active">Trapezoid</button>')
  })

  it('preserves custom modified node shape in draft without reverting to circle', () => {
    const s = storeModule.useAppStore.getState()
    s.startNeckDraft()
    s.setInlayEnabled(true)
    s.setInlayPreset('diamond')

    const draftInlays = storeModule.useAppStore.getState().neckDraft!.document.fretboardInlays!
    const customShape = {
      ...draftInlays.shape,
      presetId: 'custom' as const,
      nodes: draftInlays.shape.nodes.map((n, i) => (i === 0 ? { ...n, x: 0.123, y: 0.456 } : n)),
    }
    s.setInlayShape(customShape)

    vi.spyOn(storeModule, 'useAppStore').mockImplementation(((selector?: any) => {
      const state = storeModule.useAppStore.getState()
      return selector ? selector(state) : state
    }) as any)

    const html = renderToStaticMarkup(<InlayDesignerWorkspace />)
    expect(html).toContain('Custom shape')
    expect(html).not.toContain('aria-pressed="true" class="active">Circle</button>')
  })
})
