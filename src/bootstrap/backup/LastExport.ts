/**
 * When this device last wrote a backup (DAT-01).
 *
 * Kept in `localStorage`, not in the database, and the distinction matters:
 * the question is "have *I* backed this up recently", which is about this
 * machine. Storing it in the database would mean a restored backup carried
 * somebody else's answer — and that exporting changed a value that the next
 * export would then carry.
 *
 * Every access is wrapped: storage can be refused outright in a private
 * window, and a backup button that threw because it could not remember the
 * date would be a worse failure than not remembering.
 */
const KEY = "delta.lastExportAt"

export const readLastExport = (): string | undefined => {
  try {
    return globalThis.localStorage?.getItem(KEY) ?? undefined
    // Private browsing and blocked site data throw rather than return null,
    // and the honest answer either way is "no record of one".
    // ast-grep-ignore: no-unbound-catch
  } catch {
    return undefined
  }
}

export const writeLastExport = (at: string): void => {
  try {
    globalThis.localStorage?.setItem(KEY, at)
    // Not remembering is survivable; refusing to export is not.
    // ast-grep-ignore: no-unbound-catch
  } catch {
    // Deliberately empty: the file has already been written.
  }
}
