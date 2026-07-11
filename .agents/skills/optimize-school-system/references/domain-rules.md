# Domain invariants

## Ranking scopes and comparisons

- Always preserve class-rank and school-rank comparisons where that module supports rank comparison.
- With 13 participating schools, show school rank only.
- With exactly 14 participating schools, show school rank and township rank; do not show county rank.
- With 24 participating schools, show school rank, township rank, and county rank.
- Treat these as display and scope rules, not permission to alter ranking inputs or formulas.
- Preserve competition-ranking tie behavior, rank direction, missing-value handling, and the existing population used for each scope.

## Calculation results

Do not change scores, means, variance, percentiles, growth values, volatility, rank values, rounding, tie handling, subject aggregation, missing-data handling, or calculation order. Performance work must produce the same snapshot as the established synchronous path.

For Worker changes:

- Send only required fields using `{requestId, signature, exams, scope}`.
- Return `{requestId, signature, result}`.
- Ignore canceled, stale, or signature-mismatched responses.
- Keep the synchronous computation as the fallback and equivalence oracle.

## Teacher timetable state

- Resolve the confirmed semester before rendering the teacher list or timetable import status.
- Let confirmed current-semester data be the source of truth.
- Do not let an empty, older, incomplete, or late asynchronous response change “已导入” back to “未导入”.
- Cover first entry, semester switch, local restore, cloud restore, and genuinely empty data.

## Cloud state

- Show a usable filter/status shell immediately.
- Keep the last confirmed result while revalidating.
- Merge identical in-flight requests and key them by a complete data signature.
- Use request IDs so an older response cannot overwrite a newer selection.
- Preserve the current Cloudflare, Supabase, database schema, and cloud payload contracts unless the user explicitly authorizes a migration.

## Login layering

- While `body.login-overlay-active` is present, keep `#app`, the mobile query shell, and parent workspaces hidden; the login card must remain the top interactive layer.
- Scope mobile rules that force `#app.app-layout` to display to `body:not(.login-overlay-active)` so they cannot expose the workbench before authentication.
- Keep `responsive-login-final.css` as the last stylesheet in `src/index.html`. When its output changes, update the stylesheet cache key and rebuild the runtime/service-worker cache version.
- Preserve layout coverage at desktop, tablet, phone, short-phone, and safe-area viewports. Assert both geometry and actual top-layer ownership with `elementFromPoint`.

## Performance targets

- Visible interaction feedback: at most 100 ms.
- Common module or data tab usable: at most 500 ms.
- Main-thread task during the target interaction: at most 200 ms.
- Full longitudinal-growth result: asynchronous target at most 1.5 s.

These targets permit background completion; they do not permit changed or omitted results.
