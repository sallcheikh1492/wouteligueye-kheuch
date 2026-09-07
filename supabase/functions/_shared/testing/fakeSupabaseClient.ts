// Minimal fake mimicking just enough of the Supabase JS client's fluent
// query builder for unit-testing shared logic: `.eq(...).maybeSingle()`,
// or awaiting the builder directly after `.eq(...)` / `.update(...)` /
// `.upsert(...)`. Not a full mock of the real client — only the shapes our
// _shared/ code actually calls.
export type FakeResult<T = unknown> = { data: T; error: unknown }

export type RecordedCall = { table: string; method: string; args: unknown[] }

class FakeQueryBuilder implements PromiseLike<FakeResult> {
  constructor(
    private result: FakeResult,
    private record: (method: string, args: unknown[]) => void,
  ) {}

  select(...args: unknown[]) {
    this.record('select', args)
    return this
  }
  eq(...args: unknown[]) {
    this.record('eq', args)
    return this
  }
  update(...args: unknown[]) {
    this.record('update', args)
    return this
  }
  upsert(...args: unknown[]) {
    this.record('upsert', args)
    return this
  }
  maybeSingle() {
    return Promise.resolve(this.result)
  }
  single() {
    return Promise.resolve(this.result)
  }
  then<TResult1 = FakeResult, TResult2 = never>(
    onfulfilled?: ((value: FakeResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected)
  }
}

// Maps table name -> the {data, error} every query against it resolves to,
// regardless of which filters were chained — good enough for tests that
// don't need per-call variation within the same table. Pass `calls` to
// inspect what was actually sent to `.update()`/`.upsert()`.
export function createFakeSupabaseClient(tableResults: Record<string, FakeResult>, calls: RecordedCall[] = []) {
  return {
    from(table: string) {
      const result = tableResults[table] ?? { data: null, error: null }
      return new FakeQueryBuilder(result, (method, args) => {
        calls.push({ table, method, args })
      })
    },
  }
}
