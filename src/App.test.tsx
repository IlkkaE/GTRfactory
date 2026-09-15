import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { bounds, splitSegment } from './geometry/outline'
import { parseProject, serializeProject } from './file/projectFile'
import { App } from './App'
import { createStarterDocument } from './model/project'
describe('runkoeditori', () => {
  it('renders three labelled views and the default neck editor entry', () => {
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('>Save</button>')
    expect(html).toContain('Name your project')
    expect(html).not.toContain('Add point')
    expect(html).toContain('Selection tools')
    expect(html).toContain('Front')
    expect(html).toContain('Neck pocket')
    expect(html).not.toMatch(/<button[^>]*>Kaula</)
    expect(html).not.toMatch(/<button[^>]*>Runko</)
  })
  it('splits a cubic without changing its bounds', () => {
    const d = createStarterDocument(),
      before = bounds(d.body.outline.nodes),
      after = bounds(splitSegment(d.body.outline.nodes, 1, 0.5))
    expect(after.width).toBeCloseTo(before.width, 7)
    expect(after.height).toBeCloseTo(before.height, 7)
  })
  it('round-trips only a valid versioned project', () => {
    const d = createStarterDocument()
    expect(parseProject(serializeProject(d))).toEqual(d)
    expect(() => parseProject('{"format":"wrong"}')).toThrow('format')
  })
})
