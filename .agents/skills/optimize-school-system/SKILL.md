---
name: optimize-school-system
description: Optimize, diagnose, redesign, test, or release the school-system application without changing business results. Use for slow module switching, blocked UI, runtime loading, caching, Web Workers, cloud refresh, teacher timetable status, student development, score/rank comparisons, ranking-scope visibility, build-size work, Cloudflare deployment, and production performance verification.
---

# Optimize School System

Preserve calculation behavior while making the interface respond immediately and complete heavy work asynchronously.

## Start safely

1. Run `git status --short --branch` before editing. Preserve unrelated and user-authored changes.
2. Inspect the relevant runtime, existing tests, and `package.json` commands before introducing a new abstraction.
3. Read [references/domain-rules.md](references/domain-rules.md) before touching ranks, comparisons, growth calculations, timetable state, or cloud data selection.
4. Read [references/verification.md](references/verification.md) before testing, building, deploying, or reporting performance.
5. Measure or reproduce the issue before changing it. Capture the module, action, timing, console error, and request behavior when possible.

## Implement with existing patterns

- Give clicks, module switches, and tab switches interaction priority through `SystemPerformance`; defer nonessential diagnostics, autosave, prefetch, and completion work until after the first usable frame.
- Render the target shell, cached result, skeleton, or explicit loading state immediately. Never leave a click with no visible response.
- Reuse the existing runtime loader, signature caches, in-flight request reuse, request IDs, and Worker cancellation patterns before adding parallel mechanisms.
- Use stale-while-revalidate for cloud screens: keep confirmed cached data visible, refresh in the background, and prevent older responses from overwriting newer state.
- Key caches to all inputs that affect results. Invalidate only when data, semester, exam, school, class, filter, or page inputs change.
- Keep heavy calculations off the interaction path. Yield or use the existing Worker, and retain a deterministic synchronous fallback.
- Keep external method signatures compatible, including `DataManager.switchTab(tab)` and `CohortGrowth.render()`.
- Split initial loading only when it reduces first-use work. Keep authentication, status, navigation, and essential loaders in the initial shell; load heavy modules on demand.
- Do not gain speed by removing rows, scopes, comparisons, validation, or precision.

## Diagnose regressions

1. Distinguish main-thread blocking, repeated rendering, oversized initial assets, duplicate cloud requests, stale response overwrite, and authentication/network delay.
2. Check whether the slow path rebuilds all modules, tables, or dialogs instead of only the active surface.
3. Check whether a render triggers repeated term resolution, sorting, school normalization, or cloud hydration.
4. Check the browser console and network panel using the current logged-in session when the problem depends on production state.
5. Add a focused contract or regression test for the confirmed cause before broad cleanup.

## Verify proportionally

- Run the focused test for every changed behavior.
- Run ranking and Worker equivalence checks whenever shared calculation or student-development paths change.
- Run the release-fast suite and build for runtime loader, service worker, cache version, initial payload, or deployment changes.
- Run local browser smoke after building. Run production verification only after an authorized deployment.
- Compare calculation snapshots field by field; do not accept approximate equality where the existing contract expects exact output.

## Deployment boundary

Do not deploy merely because implementation is complete. Deploy only when the user requested deployment or the active task explicitly includes it. After deployment, verify `https://schoolsystem.com.cn` and report the deployed version plus focused production timings.
