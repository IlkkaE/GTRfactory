import { describe, expect, it } from 'vitest'
import { parseFretFactoryUrl } from './importFretFactory'
import { DEFAULT_NECK } from './fretfactoryGeometry'
describe('FretFactory URL import', () => {
  const url = (patch: Record<string, unknown> = {}) =>
    'https://fretfactory.example/#state=' +
    encodeURIComponent(JSON.stringify({ ...DEFAULT_NECK, units: 'inch', ...patch }))
  it('imports a complete local known state without converting its millimetre values', () =>
    expect(parseFretFactoryUrl(url())).toEqual(DEFAULT_NECK))
  it('rejects values outside the source application ranges instead of silently clamping', () => {
    expect(() => parseFretFactoryUrl(url({ curvedExponent: 0.001 }))).toThrow('permitted range')
    expect(() => parseFretFactoryUrl(url({ scaleBass: 1500 }))).toThrow('permitted range')
  })
  it('rejects incomplete, malformed and unsupported states', () => {
    expect(() => parseFretFactoryUrl('https://x.example/')).toThrow('#state')
    expect(() => parseFretFactoryUrl(url({ frets: '22' }))).toThrow('frets')
    expect(() => parseFretFactoryUrl(url({ units: 'cm' }))).toThrow('unit')
  })
})
