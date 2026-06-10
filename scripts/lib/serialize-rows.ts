/** JSON serializer for Drizzle rows (Dates, bytea Buffers). */
export function serializeRows(rows: unknown[]): string {
  return JSON.stringify(
    rows,
    (_key, value) => {
      if (value instanceof Buffer) {
        return { __type: 'Buffer', base64: value.toString('base64') }
      }
      if (value instanceof Date) {
        return value.toISOString()
      }
      return value
    },
    2,
  )
}
