import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

/**
 * wa-sqlite ships a browser-targeted emscripten build that loads its `.wasm`
 * with `fetch`. Under node that resolves to a `file://` URL, which node's
 * fetch refuses. Serving those from disk is what lets the in-memory client —
 * and therefore every repository test — run outside a browser.
 */
type Fetch = typeof globalThis.fetch

const upstream: Fetch = globalThis.fetch

globalThis.fetch = (async (...args: Parameters<Fetch>) => {
  const [input, init] = args
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url

  if (url.startsWith("file://")) {
    const bytes = await readFile(fileURLToPath(url))
    return new Response(bytes, {
      status: 200,
      headers: { "content-type": "application/wasm" }
    })
  }

  return upstream(input, init)
}) as Fetch
