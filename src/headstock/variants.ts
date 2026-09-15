import { bassSourceNodes } from './bassSource'
import type { OutlineNode } from '../model/project'
import inlineReference from './reference.json' with { type: 'json' }
import threeThree from './three-three.json' with { type: 'json' }

export type HeadstockTemplateId = 'inline' | 'three-three-2' | 'three-three-3' | 'bass-4-inline'
export interface TunerPost {
  C: { x: number; y: number }
  e: { x: number; y: number }
  n: { x: number; y: number }
  branch: 1 | -1
  stringIndex: number
}
export interface HeadstockTemplateDefinition {
  id: HeadstockTemplateId
  name: string
  version: 1
  supportedStrings: readonly number[]
  nodes: OutlineNode[]
  protectedPositionIds: readonly string[]
  editableArc: { startId: string; endId: string }
  posts?: readonly TunerPost[]
}

const inline: HeadstockTemplateDefinition = {
  id: 'inline',
  name: 'Inline',
  version: 1,
  supportedStrings: [6, 7, 8],
  nodes: structuredClone(inlineReference.nodes) as OutlineNode[],
  protectedPositionIds: [
    'headstock-seam-left',
    'headstock-tuner-start',
    'headstock-tuner-end',
    'headstock-seam-right',
  ],
  editableArc: { startId: 'headstock-tuner-end', endId: 'headstock-seam-right' },
}
const parsed = threeThree as Array<Omit<HeadstockTemplateDefinition, 'supportedStrings'>>
const variants = parsed.map((value) => ({
  ...value,
  supportedStrings: [6] as const,
  nodes: structuredClone(value.nodes) as OutlineNode[],
})) as HeadstockTemplateDefinition[]

const bassNodes = bassSourceNodes
const bass = (): HeadstockTemplateDefinition => ({
  id: 'bass-4-inline',
  name: 'Bass — 4 strings',
  version: 1 as const,
  supportedStrings: [4] as const,
  nodes: bassNodes('bass-4-inline'),
  protectedPositionIds: [
    'bass-4-inline-seam-left',
    'bass-4-inline-shoulder',
    'bass-4-inline-tuner-start',
    'bass-4-inline-tuner-end',
    'bass-4-inline-seam-right',
  ],
  editableArc: { startId: 'bass-4-inline-tuner-end', endId: 'bass-4-inline-seam-right' },
})
const bass4 = bass()
export const HEADSTOCK_TEMPLATE_DEFINITIONS = [inline, ...variants, bass4] as const
export const HEADSTOCK_TEMPLATE_IDS = HEADSTOCK_TEMPLATE_DEFINITIONS.map(
  (v) => v.id,
) as HeadstockTemplateId[]
export const headstockTemplate = (id: HeadstockTemplateId) => {
  const result = HEADSTOCK_TEMPLATE_DEFINITIONS.find((value) => value.id === id)
  if (!result) throw new Error('Unknown headstock design.')
  return result
}
export const headstockTemplateDefaults = (id: HeadstockTemplateId) =>
  structuredClone(headstockTemplate(id).nodes)
