/**
 * Hand a string to the browser's own download (DAT-01).
 *
 * Nothing is transmitted anywhere: an object URL over a local Blob, revoked
 * immediately. No network call exists in this file and none should.
 */
export const downloadFile = (name: string, contents: string): void => {
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }))
  const link = document.createElement("a")

  link.href = url
  link.download = name
  link.click()

  URL.revokeObjectURL(url)
}

/** `delta-backup-2026-09-30.json` — sorts chronologically in a folder. */
export const backupFileName = (exportedAt: string): string =>
  `delta-backup-${exportedAt.slice(0, 10)}.json`
