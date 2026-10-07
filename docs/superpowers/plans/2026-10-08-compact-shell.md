# Compact navigation implementation plan

**Goal:** Implement the user-approved YouTube-inspired shell: 80px category rail, overlay expansion, single-row header, centered search and account menu.

**Architecture:** Retain existing category/module and role handlers. Extend workspace-rail-runtime for overlay state; use native details for account disclosure. Override desktop layout in the final UX stylesheet. Preserve mobile shell and calculation code.

**Tech stack:** HTML, CSS, vanilla JavaScript, existing Playwright smoke harness.

**Approved design:** In-chat design and user instruction “依次执行”. Keep full category names, remove permanent counts in compact mode, preserve module rail, expose all existing actions under their existing roles.

## Sequence
- [x] Update workspace sidebar state: default compact, persistent preference, overlay dismissal via menu/backdrop/Escape, unchanged content width.
- [x] Organize header: brand, search, cohort/cloud/notifications, account details with existing role-gated actions.
- [x] Apply quiet desktop styles and responsive bounds; preserve mobile and dark appearance.
- [x] Verify full labels, unchanged main width on expansion, account interaction, persisted state, role visibility, mobile behavior and calculation invariance.
- [ ] Build, push GitHub, deploy Cloudflare, verify production.

## Review focus
- Late authentication rerenders must preserve account menu targets and role visibility.
- Sidebar preference must tolerate unavailable localStorage.
- Keyboard users must dismiss menus and recover focus.
- Header controls must not overlap at laptop widths.
- Expanded sidebar must not move or resize the data tables.
