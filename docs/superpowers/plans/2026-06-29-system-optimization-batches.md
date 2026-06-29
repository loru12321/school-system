# System Optimization Batches Plan

Date: 2026-06-29

## Batch 1: Safety Foundation

1. Add tests:
   - Calculation snapshot contract for core policy groups.
   - Sync status contract for source/cohort/exam/time metadata.
   - Danger confirmation contract for shared `UI.confirm` usage.
2. Implement:
   - Rich sync chip metadata and title.
   - Shared confirmation usage in archive, unlock, snapshot restore, file restore, and empty-history recovery.
   - Package scripts for the new guards.
3. Verify:
   - New tests.
   - `npm run test:calculation-snapshot:local`.
   - `npm run validate`.
4. Release:
   - Build, commit, push, Cloudflare deploy, production smoke.

## Batch 2: Workflow And Interaction

1. Add contracts for workflow navigation and table affordances.
2. Implement module grouping and workflow-first navigation labels.
3. Standardize table controls in high-use modules.
4. Add calculation explanation panels where results depend on policy.
5. Run local layout and module smoke, then deploy.

## Batch 3: Experience And Maintainability

1. Add mobile-shell and performance guard updates.
2. Reduce mobile surfaces to frequent tasks.
3. Continue CSS visual cleanup under hygiene budgets.
4. Migrate remaining high-risk inline handlers.
5. Extract one coherent `app.js` responsibility into a runtime module.
6. Optimize the slowest measured modules and rerun production smoke.
