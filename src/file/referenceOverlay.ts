import { bounds, type Bounds } from '../geometry/outline'
import type { OutlineNode } from '../model/project'
import { parseProject } from './projectFile'

export const MAX_REFERENCE_BYTES = 10 * 1024 * 1024
export const MAX_REFERENCE_PIXELS = 16_000_000
export const MAX_REFERENCE_SIDE = 8192

export type ReferenceSource =
  | { kind: 'project'; nodes: OutlineNode[] }
  | { kind: 'raster'; url: string; pixelWidth: number; pixelHeight: number }
export type PendingReferenceSource =
  | { kind: 'project'; nodes: OutlineNode[] }
  | { kind: 'raster'; pixelWidth: number; pixelHeight: number }

export type ReferenceOverlay = {
  name: string
  source: ReferenceSource
  visible: boolean
  opacity: number
  x: number
  y: number
  scale: number
}

export type RasterHeader = { kind: 'png' | 'jpeg'; width: number; height: number }

const u16 = (bytes: Uint8Array, i: number) => (bytes[i] << 8) | bytes[i + 1]
const u32 = (bytes: Uint8Array, i: number) =>
  bytes[i] * 2 ** 24 + (bytes[i + 1] << 16) + (bytes[i + 2] << 8) + bytes[i + 3]

export function rasterHeader(bytes: Uint8Array): RasterHeader {
  if (
    bytes.length >= 24 &&
    bytes[0] === 137 &&
    bytes[1] === 80 &&
    bytes[2] === 78 &&
    bytes[3] === 71 &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10 &&
    bytes[12] === 73 &&
    bytes[13] === 72 &&
    bytes[14] === 68 &&
    bytes[15] === 82
  )
    return { kind: 'png', width: u32(bytes, 16), height: u32(bytes, 20) }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) {
        i++
        continue
      }
      while (bytes[i] === 0xff) i++
      const marker = bytes[i++]
      if (marker === 0xd8 || marker === 0xd9 || marker === 1 || (marker >= 0xd0 && marker <= 0xd7))
        continue
      if (i + 1 >= bytes.length) break
      const length = u16(bytes, i)
      if (length < 2 || i + length > bytes.length) break
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      )
        return { kind: 'jpeg', width: u16(bytes, i + 5), height: u16(bytes, i + 3) }
      i += length
    }
  }
  throw new Error('Only a valid PNG or JPEG image can be used as a ghost template.')
}

export function validRasterHeader(header: RasterHeader) {
  if (
    !Number.isInteger(header.width) ||
    !Number.isInteger(header.height) ||
    header.width < 1 ||
    header.height < 1 ||
    header.width > MAX_REFERENCE_SIDE ||
    header.height > MAX_REFERENCE_SIDE ||
    header.width * header.height > MAX_REFERENCE_PIXELS
  )
    throw new Error(
      'The image pixel dimensions exceed the limit (maximum 8192 px per side and 16 megapixels).',
    )
  return header
}

export async function readReferenceFile(
  file: File,
): Promise<{ name: string; source: PendingReferenceSource }> {
  if (file.size > MAX_REFERENCE_BYTES)
    throw new Error('The ghost template exceeds the 10 MiB limit.')
  if (/\.gtrfactory$/i.test(file.name)) {
    const document = parseProject(await file.text()),
      bodyBounds = bounds(document.body.outline.nodes)
    if (bodyBounds.width <= 1e-6 || bodyBounds.height <= 1e-6)
      throw new Error("The ghost project's body must have a width and height greater than zero.")
    return { name: file.name, source: { kind: 'project', nodes: document.body.outline.nodes } }
  }
  const header = validRasterHeader(rasterHeader(new Uint8Array(await file.arrayBuffer())))
  return {
    name: file.name,
    source: { kind: 'raster', pixelWidth: header.width, pixelHeight: header.height },
  }
}

export const sourceBounds = (source: ReferenceSource): Bounds =>
  source.kind === 'project'
    ? bounds(source.nodes)
    : {
        minX: -source.pixelWidth / 2,
        maxX: source.pixelWidth / 2,
        minY: -source.pixelHeight / 2,
        maxY: source.pixelHeight / 2,
        width: source.pixelWidth,
        height: source.pixelHeight,
      }

export function referenceHeight(reference: ReferenceOverlay) {
  return sourceBounds(reference.source).height * reference.scale
}
export function referenceTransform(reference: ReferenceOverlay) {
  const b = sourceBounds(reference.source),
    cx = (b.minX + b.maxX) / 2,
    cy = (b.minY + b.maxY) / 2
  return `translate(${reference.x} ${reference.y}) translate(${cx} ${cy}) scale(${reference.scale}) translate(${-cx} ${-cy})`
}
export function centerReference(reference: ReferenceOverlay, target: Bounds): ReferenceOverlay {
  const b = sourceBounds(reference.source),
    cx = (b.minX + b.maxX) / 2,
    cy = (b.minY + b.maxY) / 2
  return {
    ...reference,
    x: (target.minX + target.maxX) / 2 - cx,
    y: (target.minY + target.maxY) / 2 - cy,
  }
}
