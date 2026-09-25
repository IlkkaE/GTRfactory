import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../store'
import type { OutlineNode, InlayShape } from '../model/project'

describe('inlay store transactions', () => {
  beforeEach(() => {
    useAppStore.getState().newProject()
  })

  it('initializes default inlays correctly', () => {
    const s = useAppStore.getState()
    expect(s.document.fretboardInlays).toBeNull()

    s.setInlayEnabled(true)
    const inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays).not.toBeNull()
    expect(inlays.enabled).toBe(true)
    expect(inlays.shape.presetId).toBe('circle')
    expect(inlays.markedFrets).toEqual([3, 5, 7, 9, 12, 15, 17, 19, 21])
    expect(inlays.doubleInlayFrets).toEqual([12])
  })

  it('supports undo and redo for inlay transactions', () => {
    const s = useAppStore.getState()
    s.setInlayEnabled(true)
    expect(useAppStore.getState().document.fretboardInlays?.enabled).toBe(true)
    expect(useAppStore.getState().document.fretboardInlays?.scalingMode).toBe('fixedMm')

    s.setInlayScalingMode('proportionalPercent')
    expect(useAppStore.getState().document.fretboardInlays?.scalingMode).toBe('proportionalPercent')

    s.undo()
    expect(useAppStore.getState().document.fretboardInlays?.scalingMode).toBe('fixedMm')

    s.redo()
    expect(useAppStore.getState().document.fretboardInlays?.scalingMode).toBe('proportionalPercent')
  })

  it('switches inlay preset and modifies node position as custom', () => {
    const s = useAppStore.getState()
    s.setInlayEnabled(true)
    s.setInlayPreset('diamond')

    let inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.shape.presetId).toBe('diamond')
    expect(inlays.shape.nodes.length).toBe(4)

    const firstNodeId = inlays.shape.nodes[0].id
    s.moveInlayNode(firstNodeId, 0.45, 0.12)

    inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.shape.presetId).toBe('custom')
    const updatedNode = inlays.shape.nodes.find((n) => n.id === firstNodeId)!
    expect(updatedNode.x).toBeCloseTo(0.45, 3)
    expect(updatedNode.y).toBeCloseTo(0.12, 3)

    // Clamping to [0, 1]
    s.moveInlayNode(firstNodeId, 1.5, -0.5)
    inlays = useAppStore.getState().document.fretboardInlays!
    const clampedNode = inlays.shape.nodes.find((n) => n.id === firstNodeId)!
    expect(clampedNode.x).toBe(1.0)
    expect(clampedNode.y).toBe(0.0)
  })

  it('maintains smooth handle collinearity when adjusting handles', () => {
    const s = useAppStore.getState()
    s.setInlayEnabled(true)
    s.setInlayPreset('circle') // Circle uses 4 smooth nodes

    let inlays = useAppStore.getState().document.fretboardInlays!
    // Node at (1.0, 0.5): handles lie along y axis so dx = 0, dy within [-0.5, 0.5]
    const rightNode = inlays.shape.nodes.find((n) => n.kind === 'smooth' && n.x === 1.0)!
    expect(rightNode).toBeDefined()

    s.setInlayNodeHandle(rightNode.id, 'inHandle', 0, -0.2)
    inlays = useAppStore.getState().document.fretboardInlays!
    const updated = inlays.shape.nodes.find((n) => n.id === rightNode.id)!
    expect(updated.inHandle).toEqual({ dx: 0, dy: -0.2 })
    // outHandle must be collinear in opposite direction
    expect(updated.outHandle).toEqual({ dx: 0, dy: 0.2 })
  })

  it('supports setInlayShape, addInlayNode and deleteInlayNode', () => {
    const s = useAppStore.getState()
    s.setInlayEnabled(true)
    s.setInlayPreset('diamond')

    // Add a new node
    const newNode: OutlineNode = {
      id: 'custom-node-5',
      x: 0.75,
      y: 0.25,
      kind: 'corner',
      inHandle: null,
      outHandle: null,
      outgoing: 'line',
    }
    s.addInlayNode(newNode, 1)

    let inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.shape.nodes.length).toBe(5)
    expect(inlays.shape.nodes[1].id).toBe('custom-node-5')
    expect(inlays.shape.presetId).toBe('custom')

    // Delete node
    s.deleteInlayNode('custom-node-5')
    inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.shape.nodes.length).toBe(4)
    expect(inlays.shape.nodes.some((n) => n.id === 'custom-node-5')).toBe(false)

    // Cannot delete below 3 nodes
    s.deleteInlayNode(inlays.shape.nodes[0].id)
    expect(useAppStore.getState().document.fretboardInlays!.shape.nodes.length).toBe(3)
    s.deleteInlayNode(inlays.shape.nodes[1].id)
    // Stays at 3
    expect(useAppStore.getState().document.fretboardInlays!.shape.nodes.length).toBe(3)

    // setInlayShape commits full custom shape atomically
    const newShape: InlayShape = {
      presetId: 'custom',
      nodes: [
        {
          id: 'p1',
          x: 0.2,
          y: 0.2,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
        {
          id: 'p2',
          x: 0.8,
          y: 0.2,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
        {
          id: 'p3',
          x: 0.5,
          y: 0.8,
          kind: 'corner',
          inHandle: null,
          outHandle: null,
          outgoing: 'line',
        },
      ],
    }
    s.setInlayShape(newShape)
    inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.shape.nodes.length).toBe(3)
    expect(inlays.shape.nodes[0].id).toBe('p1')

    // Undo reverts back to previous shape
    s.undo()
    inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.shape.nodes.length).toBe(3)
    expect(inlays.shape.nodes[0].id).not.toBe('p1')
  })

  it('toggles fret inlays and syncs double inlays', () => {
    const s = useAppStore.getState()
    s.setInlayEnabled(true)

    // Toggle fret 1: added
    s.toggleInlayFret(1)
    let inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.markedFrets).toContain(1)

    // Fret 12 starts in doubleInlayFrets. Toggling it removes it.
    expect(inlays.doubleInlayFrets).toContain(12)
    s.toggleDoubleInlayFret(12)
    inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.doubleInlayFrets).not.toContain(12)

    // Toggling fret 12 again adds it back
    s.toggleDoubleInlayFret(12)
    inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.doubleInlayFrets).toContain(12)
    expect(inlays.markedFrets).toContain(12)

    // If fret 12 is toggled off from marked frets, it must also be removed from doubleInlayFrets
    s.toggleInlayFret(12)
    inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.markedFrets).not.toContain(12)
    expect(inlays.doubleInlayFrets).not.toContain(12)
  })

  it('allows editing inlays during neckDraft and applies changes on commit', () => {
    const s = useAppStore.getState()
    s.setInlayEnabled(true)
    s.startNeckDraft()

    // Modifying inlays during neck draft updates the draft document and preview
    s.setInlayPreset('star')
    expect(useAppStore.getState().neckDraft?.document.fretboardInlays?.shape.presetId).toBe('star')
    expect(useAppStore.getState().preview?.fretboardInlays?.shape.presetId).toBe('star')

    // Accepting neck draft commits the star preset
    s.applyNeckDraft()
    expect(useAppStore.getState().document.fretboardInlays?.shape.presetId).toBe('star')

    // Undo reverts back
    s.undo()
    expect(useAppStore.getState().document.fretboardInlays?.shape.presetId).not.toBe('star')
  })
  it('updates width and height percentages independently with undo/redo', () => {
    const s = useAppStore.getState()
    s.setInlayEnabled(true)
    s.setInlayScalingMode('proportionalPercent')
    s.setInlayWidthPercentage(85)
    s.setInlayHeightPercentage(65)

    let inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.widthPercentage).toBe(85)
    expect(inlays.heightPercentage).toBe(65)

    s.undo()
    inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.heightPercentage).toBe(70)
    expect(inlays.widthPercentage).toBe(85)

    s.redo()
    inlays = useAppStore.getState().document.fretboardInlays!
    expect(inlays.heightPercentage).toBe(65)
  })
})
