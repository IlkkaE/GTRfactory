import { beforeEach, it, expect } from 'vitest'
import { useAppStore } from '../store'
import { headstockWorldNodes } from './template'
import { parseProject, serializeProject } from '../file/projectFile'
const state = () => useAppStore.getState(),
  id = 'headstock-free-6'
beforeEach(() => state().newProject())
it('selection is transient and a world-mm drag commits one undo step', () => {
  const before = structuredClone(state().document),
    world = headstockWorldNodes(before).find((n) => n.id === id)!
  state().selectHeadstock(id)
  expect(state().dirty).toBe(false)
  state().beginDrag('headstockNodes')
  state().previewHeadstockMove(1, 0)
  expect(state().document).toEqual(before)
  expect(headstockWorldNodes(state().preview!).find((n) => n.id === id)!.x).toBeCloseTo(
    world.x + 1,
    9,
  )
  state().commit()
  expect(state().history).toHaveLength(1)
  const after = structuredClone(state().document)
  expect(state().dirty).toBe(true)
  state().undo()
  expect(state().document).toEqual(before)
  state().redo()
  expect(state().document).toEqual(after)
  expect(parseProject(serializeProject(after))).toEqual(after)
})
it('invalid final pointer position rejects the whole gesture and preserves feedback', () => {
  const before = structuredClone(state().document)
  state().selectHeadstock(id)
  state().beginDrag('headstockNodes')
  state().previewHeadstockMove(1, 0)
  state().previewHeadstockMove(-200, 80)
  expect(state().message).toBeTruthy()
  state().commit()
  expect(state().document).toEqual(before)
  expect(state().history).toHaveLength(0)
  expect(state().message).toBeTruthy()
})
it('handle delta, cancel and protected gestures preserve their contracts', () => {
  const before = structuredClone(state().document),
    world = headstockWorldNodes(before).find((n) => n.id === id)!
  state().selectHeadstock(id)
  state().beginDrag('headstockHandle')
  state().previewHeadstockHandle(id, 'outHandle', 1, 0)
  expect(headstockWorldNodes(state().preview!).find((n) => n.id === id)!.outHandle!.dx).toBeCloseTo(
    world.outHandle!.dx + 1,
    9,
  )
  state().cancel()
  expect(state().document).toEqual(before)
  state().selectHeadstock('headstock-tuner-start')
  state().beginDrag('headstockNodes')
  state().previewHeadstockMove(5, 0)
  state().commit()
  expect(state().history).toHaveLength(0)
  expect(state().document).toEqual(before)
})
it('world coordinates and project generation never leave stale headstock selections', () => {
  state().selectHeadstock(id)
  const n = headstockWorldNodes(state().document).find((n) => n.id === id)!
  state().setHeadstockCoordinate('x', n.x + 1)
  expect(state().history).toHaveLength(1)
  const saved = structuredClone(state().document)
  state().replace(saved)
  expect(state().selectedHeadstock.size).toBe(0)
  expect(state().editingTarget).toBe('body')
  state().selectHeadstock(id)
  state().newProject()
  expect(state().selectedHeadstock.size).toBe(0)
  expect(state().editingTarget).toBe('body')
  expect(state().activeView).toBe('front')
})
it('neck draft blocks headstock edits and preserves the canonical outline through 6-8-6 and import', () => {
  state().selectHeadstock(id)
  state().beginDrag('headstockNodes')
  state().previewHeadstockMove(1, 0)
  state().commit()
  const base = structuredClone(state().document.neck!),
    outline = structuredClone(base.headstock)
  state().startNeckDraft()
  state().previewWholeNeck({
    params: { ...base.params, strings: 8, stringSpanNut: 49, stringSpanBridge: 73.5 },
    end: base.end,
    placement: base.placement,
  })
  expect(state().neckDraft!.error).toBeNull()
  state().beginDrag('headstockNodes')
  expect(state().drag).toBeNull()
  state().applyNeckDraft()
  expect(state().document.neck!.params.strings).toBe(8)
  expect(state().document.neck!.headstock).toEqual(outline)
  state().configureWholeNeck({ params: base.params, end: base.end, placement: base.placement })
  expect(state().document.neck!.headstock).toEqual(outline)
  state().importNeck(base.params)
  expect(state().document.neck!.headstock).toEqual(outline)
})
it('unsupported counts preserve the neck and canonical edits and a view switch cancels gestures', () => {
  const outline = structuredClone(state().document.neck!.headstock)
  state().configureNeck({ strings: 5 })
  expect(state().document.neck!.params.strings).toBe(5)
  expect(state().document.neck!.headstock).toEqual(outline)
  state().configureNeck({ strings: 6 })
  state().selectHeadstock(id)
  state().beginDrag('headstockNodes')
  state().previewHeadstockMove(1, 0)
  state().setView('back')
  expect(state().drag).toBeNull()
  expect(state().editingTarget).toBe('body')
  expect(state().document.neck!.headstock).toEqual(outline)
})
import { createStarterDocument } from '../model/project'
it('neck changes and history clear unavailable headstock editing without losing its saved shape', () => {
  const base = structuredClone(state().document.neck!)
  state().selectHeadstock(id)
  state().configureWholeNeck({
    params: { ...base.params, strings: 5 },
    end: base.end,
    placement: base.placement,
  })
  expect(state().document.neck!.params.strings).toBe(5)
  expect(state().selectedHeadstock.size).toBe(0)
  expect(state().editingTarget).toBe('body')
  const unsupported = structuredClone(state().document)
  state().setEditingTarget('headstock')
  state().selectHeadstock(id)
  state().setHeadstockCoordinate('x', 100)
  state().beginDrag('headstockNodes', new Set([id]))
  expect(state().drag).toBeNull()
  expect(state().document).toEqual(unsupported)
  state().undo()
  state().selectHeadstock(id)
  state().redo()
  expect(state().document.neck!.params.strings).toBe(5)
  expect(state().selectedHeadstock.size).toBe(0)
  expect(state().editingTarget).toBe('body')
  state().configureNeck({ strings: 6 })
  state().selectHeadstock(id)
  state().undo()
  expect(state().document.neck!.params.strings).toBe(5)
  expect(state().selectedHeadstock.size).toBe(0)
  expect(state().editingTarget).toBe('body')
  expect(state().document.neck!.headstock).toEqual(base.headstock)
  state().replace(createStarterDocument())
  state().createNeck()
  state().selectHeadstock(id)
  state().undo()
  expect(state().document.neck).toBeNull()
  expect(state().selectedHeadstock.size).toBe(0)
  expect(state().editingTarget).toBe('body')
  state().redo()
  expect(state().document.neck).not.toBeNull()
  expect(state().selectedHeadstock.size).toBe(0)
})
