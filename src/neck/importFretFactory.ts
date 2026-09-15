import type { NeckParams } from '../model/project'
import { validateNeckParams } from './fretfactoryGeometry'

const keys = [
  'strings',
  'frets',
  'scaleTreble',
  'scaleBass',
  'anchorFret',
  'stringSpanNut',
  'stringSpanBridge',
  'overhang',
  'curvedExponent',
] as const
/** Strict local parser: imports only a complete known #state payload and never fetches a URL. */
export function parseFretFactoryUrl(value: string): NeckParams {
  const hash = value.startsWith('#state=')
    ? value
    : (() => {
        try {
          return new URL(value).hash
        } catch {
          throw new Error('Paste a complete FretFactory URL or a #state=… parameter.')
        }
      })()
  if (!hash.startsWith('#state='))
    throw new Error('The FretFactory #state value is missing from the URL.')
  if (hash.length > 12_000) throw new Error('The FretFactory URL is too long.')
  let data: unknown
  try {
    data = JSON.parse(decodeURIComponent(hash.slice(7)))
  } catch {
    throw new Error('The FretFactory URL state is not valid JSON.')
  }
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('The FretFactory URL state is invalid.')
  const raw = data as Record<string, unknown>,
    params = {} as NeckParams
  for (const key of keys) {
    if (typeof raw[key] !== 'number' || !Number.isFinite(raw[key]))
      throw new Error(`The FretFactory URL is missing a valid ${key} value.`)
    params[key] = raw[key]
  }
  if (raw.units !== undefined && raw.units !== 'mm' && raw.units !== 'inch')
    throw new Error('The FretFactory URL unit is invalid.')
  validateNeckParams(params)
  return params
}
