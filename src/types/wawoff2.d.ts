// wawoff2 ships no types: WOFF2 ⇄ TTF through Google's woff2 compiled to wasm (src/og.ts uses it).
declare module 'wawoff2' {
  export function compress(input: Uint8Array): Promise<Uint8Array>;
  export function decompress(input: Uint8Array): Promise<Uint8Array>;
}
