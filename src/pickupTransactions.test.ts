import { beforeEach, describe, expect, it } from 'vitest'
import { parseProject, serializeProject } from './file/projectFile'
import { MAX_PICKUP_CAVITIES } from './model/project'
import { bridgeCenterY, pickupDistanceToBridge } from './pickup/profiles'
import { useAppStore } from './store'
const state = () => useAppStore.getState()
const unchanged = (before: ReturnType<typeof state>) => {
  expect(state().document).toEqual(before.document)
  expect(state().history).toEqual(before.history)
  expect(state().dirty).toBe(before.dirty)
  expect(state().revision).toBe(before.revision)
}
describe('pickup document and editor transactions', () => {
  beforeEach(() => state().newProject())
  it('starts with one clean HB at 50 mm and never inserts one into opened v4 or empty v5', () => {
    const initial = state().document
    expect(initial.pickupCavities).toHaveLength(1)
    expect(initial.pickupCavities[0].profileId).toBe('sh12-humbucker')
    expect(pickupDistanceToBridge(initial, initial.pickupCavities[0])).toBeCloseTo(50, 8)
    expect(state().dirty).toBe(false)
    const unsupported = structuredClone(initial) as any
    unsupported.version = 5
    expect(() => parseProject(JSON.stringify(unsupported))).toThrow(
      'supported versions are 10, 11 and 12',
    )
    expect(state().document).toEqual(initial)
    expect(
      parseProject(serializeProject({ ...initial, pickupCavities: [] })).pickupCavities,
    ).toEqual([])
  })
  it('creates new necks at fret 17 and preserves legacy placement through a valid import', () => {
    expect(state().document.neck!.placement).toEqual({ joinFret: 17, offsetMm: 0 })
    const current = state().document.neck!
    state().configureWholeNeck({
      params: current.params,
      placement: { joinFret: 12, offsetMm: 8.5 },
      end: current.end,
    })
    state().startNeckDraft()
    const change = state().neckDraft!.change
    state().previewWholeNeck({ ...change, params: { ...change.params, scaleBass: 660.4 } })
    state().applyNeckDraft()
    expect(state().document.neck!.placement).toEqual({ joinFret: 12, offsetMm: 8.5 })
  })
  it('roundtrips every persisted cavity and rejects unknown IDs, versions, duplicates and excessive counts before replacing work', () => {
    state().addPickup('ssl1-strat', 1)
    const d = state().document
    expect(parseProject(serializeProject(d))).toEqual(d)
    const c = d.pickupCavities[0]
    const invalid = [
      { ...d, pickupCavities: [{ ...c, profileId: 'unknown' }] },
      { ...d, pickupCavities: [{ ...c, profileVersion: 2 }] },
      { ...d, pickupCavities: [c, c] },
      {
        ...d,
        pickupCavities: Array.from({ length: MAX_PICKUP_CAVITIES + 1 }, (_, i) => ({
          ...c,
          id: 'p' + i,
        })),
      },
      { ...d, pickupCavities: undefined },
      { ...d, pickupCavities: [{ ...c, centerYmm: NaN }] },
    ]
    for (const bad of invalid) {
      const before = state()
      expect(() => state().replace(bad as typeof d)).toThrow()
      unchanged(before)
    }
  })
  it('adds and roundtrips every new 7/8-string profile', () => {
    for (const id of [
      'sd-hb7-uncovered',
      'sd-hb8-uncovered',
      'emg-707-soapbar',
      'emg-808-soapbar',
    ]) {
      state().newProject()
      state().deletePickup(state().document.pickupCavities[0].id)
      state().addPickup(id, 1)
      expect(state().document.pickupCavities[0].profileId).toBe(id)
      expect(parseProject(serializeProject(state().document))).toEqual(state().document)
    }
  })
  it('adds into free space, selects Front, makes one undo step and refuses a full body atomically', () => {
    state().setView('back')
    state().addPickup('ssl1-strat', 1)
    expect(state().activeView).toBe('front')
    expect(state().selectedPickupId).toBe(state().document.pickupCavities[1].id)
    expect(state().history).toHaveLength(1)
    state().undo()
    expect(state().document.pickupCavities).toHaveLength(1)
    state().redo()
    expect(state().document.pickupCavities).toHaveLength(2)
    for (let i = 0; i < 20; i++) {
      const before = state()
      state().addPickup('sh12-humbucker', 1)
      if (state().message) {
        unchanged(before)
        expect(state().selectedPickupId).toBe(before.selectedPickupId)
        return
      }
    }
    throw new Error('Expected a finite body to become full')
  })
  it('preserves the accepted cavity and history on failed model change or invalid distance', () => {
    const id = state().document.pickupCavities[0].id
    state().changePickupProfile(id, 'ssl1-strat', 1)
    state().setPickupCenter(id, bridgeCenterY(state().document)! - 16)
    expect(state().message).toBeNull()
    const before = state()
    state().changePickupProfile(id, 'sh12-humbucker', 1)
    expect(state().message).toMatch(/bridge/)
    unchanged(before)
    state().setPickupCenter(id, Infinity)
    expect(state().message).toBeTruthy()
    unchanged(before)
    state().setPickupCenter(id, bridgeCenterY(state().document)!)
    expect(state().message).toBeTruthy()
    unchanged(before)
  })
  it('changes angle and local dimensions atomically, supports one undo, guards drafts, and resets on profile change', () => {
    const id = state().document.pickupCavities[0].id
    const before = state()
    state().setPickupTransform(id, { angleDeg: 18, widthMm: 90, lengthMm: 44 })
    expect(state().document.pickupCavities[0]).toMatchObject({
      angleDeg: 18,
      widthMm: 90,
      lengthMm: 44,
    })
    expect(state().history).toHaveLength(1)
    state().undo()
    expect(state().document).toEqual(before.document)
    state().redo()
    const changed = state()
    state().setPickupTransform(id, { angleDeg: 18, widthMm: 90, lengthMm: 44 })
    unchanged(changed)
    state().setPickupTransform(id, { widthMm: 1001 })
    expect(state().message).toBeTruthy()
    unchanged(changed)
    state().changePickupProfile(id, 'ssl1-strat', 1)
    expect(state().document.pickupCavities[0].angleDeg).toBe(0)
    expect(state().document.pickupCavities[0].widthMm).not.toBe(90)
    state().startNeckDraft()
    const guarded = state()
    state().setPickupTransform(id, { angleDeg: 5 })
    unchanged(guarded)
    state().cancelNeckDraft()
  })
  it('keeps selection clean, cancels preview, and commits a drag as exactly one undo', () => {
    const before = state(),
      c = before.document.pickupCavities[0]
    state().selectPickup(c.id)
    unchanged(before)
    state().beginPickupDrag(c.id)
    state().previewPickup(c.centerYmm - 8)
    expect(state().document).toEqual(before.document)
    state().cancel()
    unchanged(before)
    state().beginPickupDrag(c.id)
    state().previewPickup(c.centerYmm - 4)
    state().previewPickup(c.centerYmm - 8)
    state().commit()
    expect(state().document.pickupCavities[0].centerYmm).toBe(c.centerYmm - 8)
    expect(state().history).toHaveLength(1)
    state().undo()
    expect(state().document).toEqual(before.document)
  })
  it('deletes the last cavity without replacement and undo restores its ID', () => {
    const d = state().document
    state().deletePickup(d.pickupCavities[0].id)
    expect(state().document.pickupCavities).toEqual([])
    expect(parseProject(serializeProject(state().document)).pickupCavities).toEqual([])
    state().undo()
    expect(state().document).toEqual(d)
  })
  it('holds centerY fixed through a valid neck change and rejects a conflicting draft atomically', () => {
    const original = state().document,
      c = original.pickupCavities[0],
      oldDistance = pickupDistanceToBridge(original, c)
    state().startNeckDraft()
    const change = state().neckDraft!.change
    state().previewWholeNeck({ ...change, params: { ...change.params, scaleBass: 660.4 } })
    expect(state().neckDraft!.error).toBeNull()
    state().applyNeckDraft()
    expect(state().document.pickupCavities[0]).toEqual(c)
    expect(pickupDistanceToBridge(state().document, c)).not.toBe(oldDistance)
    expect(state().history).toHaveLength(1)
    const before = state()
    state().startNeckDraft()
    const next = state().neckDraft!.change
    state().previewWholeNeck({ ...next, placement: { ...next.placement, offsetMm: 200 } })
    expect(state().neckDraft!.error).toMatch(/pickup cavity/i)
    state().applyNeckDraft()
    unchanged(before)
    expect(state().neckDraft).not.toBeNull()
    state().cancelNeckDraft()
    unchanged(before)
  })
  it('locks cavity mutation in a neck draft and clears the invisible selection', () => {
    const before = state(),
      c = before.document.pickupCavities[0]
    state().selectPickup(c.id)
    state().startNeckDraft()
    expect(state().selectedPickupId).toBeNull()
    state().addPickup('ssl1-strat', 1)
    state().deletePickup(c.id)
    state().changePickupProfile(c.id, 'ssl1-strat', 1)
    state().setPickupCenter(c.id, c.centerYmm - 5)
    state().beginPickupDrag(c.id)
    expect(state().drag).toBeNull()
    unchanged(before)
    state().cancelNeckDraft()
    state().selectPickup(c.id)
    state().setView('back')
    expect(state().selectedPickupId).toBeNull()
  })
})
