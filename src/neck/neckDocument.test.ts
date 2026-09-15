import { describe, expect, it } from 'vitest'
import { createStarterDocument } from '../model/project'
import { automaticPocket } from './automaticPocket'
import { DEFAULT_NECK } from './fretfactoryGeometry'
import { deriveNeckDocument } from './neckDocument'

describe('neck document derivation', () => {
  it('creates a detached default neck from the current locked joint', () => {
    const document = createStarterDocument()
    const before = structuredClone(document)

    const derived = deriveNeckDocument(document, { kind: 'fresh' })!

    expect(document).toEqual(before)
    expect(derived.neck!.placement).toEqual({ joinFret: 17, offsetMm: 0 })
    expect(derived.neck!.referenceBoundaryNodes.center.id).toBe('starter-01')
    derived.neck!.referenceBoundaryNodes.center.y += 1
    expect(document.body.outline.nodes.find((node) => node.id === 'starter-01')!.y).toBe(
      before.body.outline.nodes.find((node) => node.id === 'starter-01')!.y,
    )
  })

  it('preserves existing user-owned fields on import and does not alias its input', () => {
    let document = createStarterDocument()
    document = deriveNeckDocument(document, { kind: 'fresh' })!
    document.neck!.placement = { joinFret: 16, offsetMm: 4 }
    document.neck!.end = { ...document.neck!.end, radiusMm: 8 }
    document.neck!.headstock.activeTemplateId = 'three-three-2'
    const reference = structuredClone(document.neck!.referenceBoundaryNodes)
    const params = { ...DEFAULT_NECK, scaleBass: 660.4 }

    const derived = deriveNeckDocument(document, { kind: 'import', params })!

    expect(derived.neck!.placement).toEqual(document.neck!.placement)
    expect(derived.neck!.end).toEqual(document.neck!.end)
    expect(derived.neck!.headstock).toEqual(document.neck!.headstock)
    expect(derived.neck!.referenceBoundaryNodes).toEqual(reference)
    expect(derived.neck!.referenceBoundaryNodes).not.toBe(document.neck!.referenceBoundaryNodes)
    params.scaleBass = 670
    expect(derived.neck!.params.scaleBass).toBe(660.4)
  })

  it('keeps placement snapshot semantics and derives mouth geometry in the one core path', () => {
    let document = createStarterDocument()
    document = deriveNeckDocument(document, { kind: 'fresh' })!
    const original = structuredClone(document.neck!)
    const params = { ...original.params, scaleBass: 660.4 }
    const end = { ...original.end, radiusMm: 8 }
    const changed = deriveNeckDocument(document, {
      kind: 'whole',
      change: {
        params,
        placement: { ...original.placement, offsetMm: 2 },
        end,
      },
    })!
    const placementOnly = deriveNeckDocument(changed, {
      kind: 'placement',
      placement: { ...changed.neck!.placement, offsetMm: 3 },
    })!

    expect(placementOnly.neck!.snapshot).toEqual(changed.neck!.snapshot)
    expect(placementOnly.neck!.snapshot).not.toBe(changed.neck!.snapshot)
    expect(automaticPocket(placementOnly)).not.toBeNull()
    expect(placementOnly.neck!.headstock.activeTemplateId).toBe(original.headstock.activeTemplateId)
  })
})
