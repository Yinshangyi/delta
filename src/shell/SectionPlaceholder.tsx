export interface SectionPlaceholderProps {
  readonly title: string
  readonly summary: string
  /** The ticket that replaces this. Naming it keeps the placeholder honest. */
  readonly ticket: string
}

export function SectionPlaceholder({ title, summary, ticket }: SectionPlaceholderProps) {
  return (
    <section className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted mt-2">{summary}</p>
      <p className="text-muted mt-6 font-mono text-xs">Arrives with {ticket}.</p>
    </section>
  )
}
