import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../store'
import { parseProject, serializeProject } from '../file/projectFile'
import { automaticPocket, physicalHeel } from './automaticPocket'
import { neckView } from './neckView'
import { DEFAULT_NECK } from './fretfactoryGeometry'
import { parseFretFactoryUrl } from './importFretFactory'

beforeEach(() => useAppStore.getState().newProject())
describe('one neck, physical profile and project history', () => {
  it('rejects a partly invalid whole form and commits a corrected form as one undo step', () => {
    useAppStore.getState().createNeck()
    const original = useAppStore.getState().document,
      neck = original.neck!,
      history = useAppStore.getState().history.length
    const change = {
      params: { ...neck.params, scaleBass: 660.4 },
      placement: { ...neck.placement },
      end: { ...neck.end, radiusMm: 1000 },
    }
    useAppStore.getState().configureWholeNeck(change)
    expect(useAppStore.getState().document).toBe(original)
    expect(useAppStore.getState().history).toHaveLength(history)
    useAppStore.getState().configureWholeNeck({ ...change, end: { ...change.end, radiusMm: 6 } })
    expect(useAppStore.getState().history).toHaveLength(history + 1)
    useAppStore.getState().undo()
    expect(useAppStore.getState().document).toEqual(original)
  })
  it('rejects protected-handle tampering while retaining free body handles and atomic physical radius checks', () => {
    useAppStore.getState().createNeck()
    const doc = useAppStore.getState().document,
      bad = structuredClone(doc)
    bad.body.outline.nodes.find((n) => n.id === 'starter-01')!.outHandle!.dx += 1
    expect(() => parseProject(serializeProject(bad))).toThrow('joint')
    const free = structuredClone(doc)
    free.body.outline.nodes.find((n) => n.id === 'starter-02')!.outHandle!.dx += 1
    expect(parseProject(serializeProject(free))).toEqual(free)
    useAppStore.getState().configureNeckEnd({ fitAllowanceMm: 20, radiusMm: 40 })
    expect(useAppStore.getState().document).toBe(doc)
  })
  it('uses exact string contacts and curved nut cubics in both physical previews, with fit separate', () => {
    const params = { ...DEFAULT_NECK, scaleBass: 660.4, curvedExponent: 1.6 }
    useAppStore.getState().importNeck(params)
    expect(useAppStore.getState().message).toBeNull()
    const doc = useAppStore.getState().document,
      view = neckView(doc)!,
      heel = physicalHeel(doc)!
    expect(view.strings).toHaveLength(params.strings)
    expect(view.outlinePath.match(/ C /g)).toHaveLength(params.strings + 1)
    expect(automaticPocket(doc)!.pathD).toBe(heel.pathD)
    useAppStore.getState().configureNeckEnd({ fitAllowanceMm: 0.4 })
    const widened = useAppStore.getState().document
    expect(neckView(widened)!.outlinePath).toBe(view.outlinePath)
    expect(automaticPocket(widened)!.leftCorner.x).toBeCloseTo(heel.leftCorner.x - 0.2, 10)
    expect(automaticPocket(widened)!.rightCorner.x).toBeCloseTo(heel.rightCorner.x + 0.2, 10)
    expect(automaticPocket(widened)!.leftCorner.y).toBe(heel.leftCorner.y)
    expect(parseProject(serializeProject(widened))).toEqual(widened)
  })
  it('keeps the board-only outline separate from heel and pocket, and preserves it through undo', () => {
    useAppStore.getState().createNeck()
    const before = useAppStore.getState().document,
      view = neckView(before)!,
      pocket = automaticPocket(before)!
    useAppStore.getState().configureNeckEnd({ fretboardEndMarginMm: 20 })
    const board = useAppStore.getState().document
    expect(neckView(board)!.outlinePath).not.toBe(view.outlinePath)
    expect(neckView(board)!.heelPath).toBe(view.heelPath)
    expect(automaticPocket(board)).toEqual(pocket)
    useAppStore.getState().undo()
    expect(useAppStore.getState().document).toEqual(before)
  })
  it('reads complete hash-only inch state and permits FretFactory anchor zero without rescaling dimensions', () => {
    const params = { ...DEFAULT_NECK, anchorFret: 0 }
    expect(
      parseFretFactoryUrl(
        '#state=' + encodeURIComponent(JSON.stringify({ ...params, units: 'inch' })),
      ),
    ).toEqual(params)
  })
})
