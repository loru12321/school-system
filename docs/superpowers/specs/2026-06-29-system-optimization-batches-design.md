# System Optimization Batches Design

Date: 2026-06-29

## Goal

Optimize the 12 reviewed items across UI, calculation, interaction, module pairing, mobile experience, visual consistency, and maintainability while preserving calculation correctness and release safety.

## Batch 1: Safety Foundation

- Calculation confidence: keep a runnable local calculation snapshot and add a source contract so key calculation policies remain visible.
- Cloud/local consistency: show workspace source, cohort, exam, and sync time in the shell sync status.
- Critical actions: route destructive confirmations through the shared async dialog runtime.

Acceptance:

- New source-level guards pass.
- `npm run test:calculation-snapshot:local` passes.
- `npm run validate` passes before deployment.

## Batch 2: Workflow And Interaction

- Tighten information hierarchy in the active work surface.
- Group modules by workflow and expose a clearer path from import, calculation, comparison, report, and management.
- Add table affordances consistently where modules render large result sets.
- Add calculation explanation surfaces for totals, blank scores, aliases, and scope isolation.

Acceptance:

- Navigation/module contracts pass.
- Layout smoke passes locally.
- Main workflow smoke passes on production after deployment.

## Batch 3: Experience And Maintainability

- Keep mobile focused on frequent tasks.
- Continue visual de-weighting and palette balancing.
- Migrate remaining high-value inline handlers to delegated runtime events.
- Split the largest `app.js` responsibilities when ownership is clear.
- Optimize slow modules measured in smoke output.

Acceptance:

- Performance contracts pass.
- Module smoke shows no regressions.
- Production smoke has `errorCount: 0`.
