import type { ReactNode } from "react"

export interface Column<Row> {
  readonly key: string
  readonly header: string
  /** Figures go right; everything else reads better left. */
  readonly numeric?: boolean
  readonly cell: (row: Row) => ReactNode
}

export interface TableProps<Row> {
  readonly caption: string
  readonly columns: ReadonlyArray<Column<Row>>
  readonly rows: ReadonlyArray<Row>
  readonly rowKey: (row: Row) => string
  /** Shown instead of an empty body, so a table with no rows is not a blank box. */
  readonly empty?: ReactNode
}

/**
 * Alignment matters more than decoration (design-brief.md). Numeric columns are
 * right-aligned and tabular, which is what lets a column of figures be compared
 * by eye rather than read one by one.
 *
 * The caption is visually hidden but present: a screen reader user arriving at
 * a bare grid of numbers has nothing to go on otherwise.
 */
export function Table<Row>({ caption, columns, rows, rowKey, empty }: TableProps<Row>) {
  if (rows.length === 0 && empty !== undefined) return <>{empty}</>

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-line border-b">
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={`text-muted pb-2 font-medium ${
                column.numeric === true ? "text-right" : "text-left"
              }`}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)} className="border-line/60 border-b last:border-0">
            {columns.map((column) => (
              <td
                key={column.key}
                className={`py-2 ${column.numeric === true ? "text-right tabular-nums" : "text-left"}`}
              >
                {column.cell(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
