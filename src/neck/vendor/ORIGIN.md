# FretFactory geometry source

These four TypeScript files were copied unchanged from FretFactory commit
`89f94c0e693b75528a41ac8fd8b682c04899f7fb` on 8.9.2026:

- `core.ts`
- `curved.ts`
- `naming.ts`
- `pchip.ts`

GTRfactory's `../fretfactoryGeometry.ts` only adapts their calculated points
to the project document and applies the project placement. It must not become
a second fret or multi-scale calculation implementation.
