import { describe, expect, it } from 'vitest'
import { createStarterDocument } from '../model/project'
import { parseProject, serializeProject } from '../file/projectFile'
import { rearElectronicsCavityGeometry, rearElectronicsCavityProfile, resizedCavity } from './index'
describe('rear electronics cavity', () => {
  it('keeps the exact source topology, analytic cubic bounds and back-visible dimensions', () => {
    expect(rearElectronicsCavityProfile.outer).toHaveLength(8)
    expect(rearElectronicsCavityProfile.inner).toHaveLength(18)
    expect(
      rearElectronicsCavityProfile.outer.filter((segment) => segment.type === 'cubicBezier'),
    ).toHaveLength(5)
    expect(
      rearElectronicsCavityProfile.outer.filter((segment) => segment.type === 'line'),
    ).toHaveLength(3)
    expect(
      rearElectronicsCavityProfile.inner.filter((segment) => segment.type === 'cubicBezier'),
    ).toHaveLength(14)
    expect(
      rearElectronicsCavityProfile.inner.filter((segment) => segment.type === 'line'),
    ).toHaveLength(4)
    expect(rearElectronicsCavityProfile).toMatchObject({
      minX: 27.481942,
      minY: 26.03734748455872,
      width: 176.06686788504933,
      height: 81.36283544639431,
    })
    expect(rearElectronicsCavityProfile.outer[2]).toMatchObject({
      type: 'cubicBezier',
      control1: { x: 28.371615, y: 60.488977 },
      control2: { x: 28.384714, y: 53.882872 },
    })
    expect(rearElectronicsCavityProfile.inner.at(-1)).toMatchObject({
      type: 'cubicBezier',
      control2: { x: 74.843909, y: 104.3786 },
    })
    const d = createStarterDocument(),
      g = rearElectronicsCavityGeometry(d)!
    expect(d.body.rearElectronicsCavity).toMatchObject({
      horizontalMm: 176.06686788504933,
      verticalMm: 81.36283544639431,
      centerXmm: 0,
      centerYmm: 210,
    })
    expect(g.outer.segments).toHaveLength(8)
    expect(g.inner.segments).toHaveLength(18)
    expect(g.bounds.width).toBeCloseTo(d.body.rearElectronicsCavity!.verticalMm)
    expect(g.bounds.height).toBeCloseTo(d.body.rearElectronicsCavity!.horizontalMm)
  })
  it('holds the opposite visible edge while resizing', () => {
    const c = createStarterDocument().body.rearElectronicsCavity!
    const left = resizedCavity(c, 'left', 10),
      right = resizedCavity(c, 'right', 10)
    expect(left.centerYmm - left.horizontalMm / 2).toBeCloseTo(c.centerYmm - c.horizontalMm / 2)
    expect(right.centerYmm + right.horizontalMm / 2).toBeCloseTo(c.centerYmm + c.horizontalMm / 2)
    const top = resizedCavity(c, 'top', 10),
      bottom = resizedCavity(c, 'bottom', 10)
    expect(top.centerXmm - top.verticalMm / 2).toBeCloseTo(c.centerXmm - c.verticalMm / 2)
    expect(bottom.centerXmm + bottom.verticalMm / 2).toBeCloseTo(c.centerXmm + c.verticalMm / 2)
  })
  it('flips the asymmetric source profile to match the mirrored back body', () => {
    const d = createStarterDocument(),
      c = d.body.rearElectronicsCavity!,
      g = rearElectronicsCavityGeometry(d)!,
      source = rearElectronicsCavityProfile.outer[0].from
    expect(g.outer.segments[0].from.x).toBeCloseTo(
      c.centerXmm +
        (source.y - (rearElectronicsCavityProfile.minY + rearElectronicsCavityProfile.height / 2)),
    )
  })
  it('keeps loaded v9 placement and custom dimensions while using the replacement profile', () => {
    const saved = createStarterDocument()
    saved.body.rearElectronicsCavity = {
      profileId: 'potero-v1',
      profileVersion: 1,
      centerXmm: 17.25,
      centerYmm: 221.5,
      horizontalMm: 144.75,
      verticalMm: 93.5,
    }
    const loaded = parseProject(serializeProject(saved))
    expect(loaded.body.rearElectronicsCavity).toEqual(saved.body.rearElectronicsCavity)
    const geometry = rearElectronicsCavityGeometry(loaded)!
    expect(geometry.bounds).toMatchObject({ width: 93.5, height: 144.75 })
    expect(geometry.outer.segments).toHaveLength(8)
    expect(geometry.inner.segments).toHaveLength(18)
  })
})
import { containment, flattenContour } from '../geometry/containment'
import { useAppStore } from '../store'
describe('cavity containment and transactions', () => {
  it('rejects contact and an invalid body outline conservatively', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 20 },
      { x: 0, y: 20 },
    ]
    expect(
      containment(square, [
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 10 },
        { x: 0, y: 10 },
      ])?.code,
    ).toBe('contact')
    const crossed = [
      { x: 0, y: 0 },
      { x: 20, y: 20 },
      { x: 0, y: 20 },
      { x: 20, y: 0 },
    ]
    expect(
      containment(crossed, [
        { x: 5, y: 5 },
        { x: 7, y: 5 },
        { x: 7, y: 7 },
        { x: 5, y: 7 },
      ])?.code,
    ).toBe('invalid-body-outline')
  })
  it('keeps the last valid preview and cancels one cavity gesture', () => {
    useAppStore.getState().newProject()
    const s = useAppStore.getState()
    s.setView('back')
    s.beginRearElectronicsCavityDrag()
    s.previewRearElectronicsCavity(1, 0)
    const valid = structuredClone(useAppStore.getState().preview)
    useAppStore.getState().previewRearElectronicsCavity(100000, 0)
    expect(useAppStore.getState().preview).toEqual(valid)
    useAppStore.getState().cancel()
    expect(useAppStore.getState().preview).toBeNull()
  })
})
describe('rear cavity editing contract', () => {
  it('blocks edits outside back view and while a neck draft is pending', () => {
    const s = useAppStore.getState()
    s.newProject()
    s.beginRearElectronicsCavityDrag()
    expect(useAppStore.getState().drag).toBeNull()
    s.startNeckDraft()
    const draft = useAppStore.getState().neckDraft
    expect(draft).not.toBeNull()
    s.beginRearElectronicsCavityDrag()
    expect(useAppStore.getState().drag).toBeNull()
    expect(useAppStore.getState().neckDraft).toBe(draft)
    expect(useAppStore.getState().message).toContain('neck change')
    s.cancelNeckDraft()
  })
  it('commits a gesture once, undoes/redoes it and clears selection on view switch', () => {
    const s = useAppStore.getState()
    s.newProject()
    s.setView('back')
    const before = structuredClone(useAppStore.getState().document)
    s.beginRearElectronicsCavityDrag()
    s.previewRearElectronicsCavity(1, 0)
    s.previewRearElectronicsCavity(2, 0)
    s.commit()
    const after = structuredClone(useAppStore.getState().document)
    expect(after.body.rearElectronicsCavity!.centerXmm).toBe(
      before.body.rearElectronicsCavity!.centerXmm + 2,
    )
    expect(useAppStore.getState().history).toHaveLength(1)
    s.undo()
    expect(useAppStore.getState().document).toEqual(before)
    s.redo()
    expect(useAppStore.getState().document).toEqual(after)
    s.setView('front')
    expect(useAppStore.getState().selectedRearElectronicsCavity).toBe(false)
  })
  it('rejects nonpositive and nonfinite previews without losing the last valid one', () => {
    const s = useAppStore.getState()
    s.newProject()
    s.setView('back')
    s.beginRearElectronicsCavityDrag('left')
    s.previewRearElectronicsCavity(0, 1)
    const valid = useAppStore.getState().preview
    s.previewRearElectronicsCavity(0, -10000)
    expect(useAppStore.getState().preview).toBe(valid)
    s.previewRearElectronicsCavity(0, NaN)
    expect(useAppStore.getState().preview).toBe(valid)
    const drag = useAppStore.getState().drag
    s.beginRearElectronicsCavityDrag('right')
    expect(useAppStore.getState().drag).toBe(drag)
    s.cancel()
  })
  it('has nested contours under positive anisotropic scaling', () => {
    const d = createStarterDocument()
    d.body.rearElectronicsCavity!.horizontalMm = 140
    d.body.rearElectronicsCavity!.verticalMm = 95
    const g = rearElectronicsCavityGeometry(d)!
    expect(
      containment(flattenContour(g.outer.segments), flattenContour(g.inner.segments)),
    ).toBeNull()
  })
})
