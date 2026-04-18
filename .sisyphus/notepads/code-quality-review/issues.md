# Issues — Code Quality Review (F2)

## Minor (non-blocking)

1. `src/preload/index.ts:23,25` — Two `@ts-ignore` comments could be `@ts-expect-error` for better type safety signaling
2. `src/main/windows/index.ts:22` — `url as string` cast in `loadRendererWindow` could use a type guard instead
3. `src/main/database/index.ts:32` — `as { value: string } | undefined` type assertion on SQLite row — acceptable for dynamic query returns

## No Blocking Issues Found
