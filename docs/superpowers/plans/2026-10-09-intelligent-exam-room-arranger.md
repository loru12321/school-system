# Intelligent Exam Room Arranger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing one-screen exam arranger with a four-step local-first workbench that imports multi-sheet rosters, validates exclusions, produces deterministic score-ranked room assignments, and exports confidential and public Excel/DOCX packages.

**Architecture:** Split the feature out of `freshman-exam-runtime.js` into a pure domain core, a browser controller, an Excel/ZIP exporter, and a focused DOCX OpenXML generator. Keep the current app shell and lazy runtime system, process files locally, and expose a small global facade only for module activation and compatibility.

**Tech Stack:** Vanilla JavaScript, SheetJS/xlsx-js-style, JSZip, browser File API and File System Access API, OOXML generated with JSZip, Vite, Node contract tests, Playwright smoke tests.

**Spec:** `docs/superpowers/specs/2026-10-09-intelligent-exam-room-arranger-design.md`

## Global Constraints

- Raw score files are parsed locally and are never uploaded automatically.
- Public Excel and Word outputs must not contain total scores, subject scores, exclusion reasons, or internal notes.
- Only explicit exclusion decisions remove a student; zero, missing, or “未参加考试” score records remain eligible by default.
- Default ordering is total score descending, then original class, source sheet order, and source row order.
- With six rooms and 325 students, automatic balancing must produce `55/54/54/54/54/54`.
- The default workflow must preserve strict ranking; same-class separation and snake seating remain disabled advanced rules.
- The main UI uses existing design tokens and Tabler icons, contains no emoji labels, and remains usable with at least 500 student rows.
- Reuse vendored SheetJS and JSZip; generate DOCX with focused OOXML helpers instead of adding a large document dependency.
- Preserve the existing proctor assignment capability as an auxiliary result panel after room generation.

## Review Focus

- A student present in both current-class and historical mapping sheets must be merged or flagged, never counted twice; Task 1 pins this with a duplicate-source test.
- Blank, textual, zero, and numeric-string scores must sort predictably without silently excluding a student; Task 2 pins each case.
- Two students with the same name in different classes must not share an exclusion decision; Task 1 pins matching priority and ambiguity.
- Room capacity below the eligible student count must block generation and report the exact shortfall; Task 2 pins the error shape.
- Every public workbook and DOCX must remain score-free even when the source record contains arbitrary extra score columns; Tasks 5 and 6 inspect the generated archives.

---

### Task 1: Domain Model, Workbook Recognition, and Roster Validation

**Files:**
- Create: `public/assets/js/exam-arranger-core-runtime.js`
- Create: `scripts/test-exam-arranger-core-runtime.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `window.ExamArrangerCore.createWorkspace(meta?) -> ExamWorkspace`
- Produces: `window.ExamArrangerCore.inspectWorkbook({ name, workbook, xlsx }) -> ImportSource`
- Produces: `window.ExamArrangerCore.mergeImportSources(sources) -> { students, exclusions, rooms, issues, summary }`
- Produces: `window.ExamArrangerCore.validateWorkspace(workspace) -> ValidationResult`
- `StudentRecord` fields: `id`, `studentNo`, `name`, `gender`, `currentClass`, `originalClass`, `totalScore`, `subjects`, `source`, `status`, `excluded`, `exclusionReason`.
- `RoomConfig` fields: `id`, `name`, `capacity`, `building`, `classroom`, `order`.

- [ ] **Step 1: Add failing import recognition and matching tests**

Cover current-class sheets, historical mapping sheets, explicit exclusion sheets, room configuration sheets, an unrecognized sheet, same-name/different-class students, and one student repeated across current and historical sources.

- [ ] **Step 2: Run the core test and confirm the new global is missing**

Run: `node scripts/test-exam-arranger-core-runtime.js`  
Expected: FAIL because `ExamArrangerCore` is undefined.

- [ ] **Step 3: Implement the normalized workspace and workbook recognizer**

Keep the runtime DOM-free. Normalize Chinese header aliases, natural class order, numeric strings, blank fields, and source coordinates. Merge only unambiguous matches by student number or name plus class; ambiguous records become blocking issues.

- [ ] **Step 4: Add validation assertions for the Review Focus cases**

Assert that current and historical sheets do not double-count, same-name/different-class exclusions remain separate, unmatched exclusions are reported, and missing name/class fields are blocking.

- [ ] **Step 5: Run and register the core test**

Run: `node scripts/test-exam-arranger-core-runtime.js`  
Expected: PASS with a JSON summary. Add `test:exam-arranger-core` to `package.json`.

- [ ] **Step 6: Commit**

```bash
git add public/assets/js/exam-arranger-core-runtime.js scripts/test-exam-arranger-core-runtime.js package.json
git commit -m "feat(exam-arranger): normalize roster imports"
```

### Task 2: Deterministic Ranking and Capacity Allocation

**Files:**
- Modify: `public/assets/js/exam-arranger-core-runtime.js`
- Modify: `scripts/test-exam-arranger-core-runtime.js`

**Interfaces:**
- Consumes: `StudentRecord[]`, `RoomConfig[]`, and workspace settings from Task 1.
- Produces: `rankStudents(students, settings) -> RankedStudent[]`
- Produces: `deriveBalancedRooms(studentCount, { roomCount?, maxPerRoom?, rooms? }) -> RoomConfig[]`
- Produces: `assignStudents(students, rooms, { prefix, serialWidth, advancedRules }) -> AssignmentResult`
- `AssignmentResult` fields: `assignments`, `rooms`, `summary`, `warnings`, `generationSignature`.

- [ ] **Step 1: Write failing ranking and allocation tests**

Assert stable tie order, numeric-string scores, blank/textual/zero score placement, explicit exclusions, exam number padding, per-room seat reset, and deterministic repeated output.

- [ ] **Step 2: Add the 325-student balancing regression**

Generate a synthetic 325-student roster and assert room sizes `[55, 54, 54, 54, 54, 54]`, exam numbers `<prefix>001` through `<prefix>325`, and seat numbers restarting at 1.

- [ ] **Step 3: Add the capacity shortfall regression**

For 101 students and two rooms of capacity 50, assert generation returns `code: 'ROOM_CAPACITY_SHORTFALL'` and `shortfall: 1` without partial assignments.

- [ ] **Step 4: Implement ranking, balancing, and assignment**

Keep the default path strictly score-ranked. Advanced rules receive a copy of the ranked list and must record their enabled state in `generationSignature`.

- [ ] **Step 5: Run the core suite**

Run: `npm run test:exam-arranger-core`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add public/assets/js/exam-arranger-core-runtime.js scripts/test-exam-arranger-core-runtime.js
git commit -m "feat(exam-arranger): add deterministic room allocation"
```

### Task 3: Lazy Runtime Integration and Local Workspace Controller

**Files:**
- Create: `public/assets/js/exam-arranger-runtime.js`
- Create: `scripts/test-exam-arranger-runtime.js`
- Modify: `public/assets/js/runtime-loader-runtime.js`
- Modify: `public/assets/js/freshman-exam-runtime.js`
- Modify: `public/assets/js/ui-actions-runtime.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `window.ExamArrangerCore` from Tasks 1–2 and `window.XLSX` from the lazy runtime manifest.
- Produces: `window.ExamArranger.init()`, `loadFiles(files)`, `loadDirectory()`, `setStep(step)`, `toggleExcluded(studentId, reason)`, `generate()`, `saveDraft()`, `restoreDraft()`, and `clearWorkspace()`.
- Preserves compatibility globals `EXAM_loadData`, `EXAM_generate`, `EXAM_switchView`, `EXAM_assignProctors`, and `EXAM_exportResult` until all declarative actions have migrated.

- [ ] **Step 1: Write the failing runtime contract test**

Assert loader order `xlsx-js-style -> jszip -> core -> freshman -> arranger`, scoped `[data-exam-action]` binding, directory-picker fallback, no network upload call, explicit local-save behavior, and clear-workspace behavior.

- [ ] **Step 2: Run the contract test**

Run: `node scripts/test-exam-arranger-runtime.js`  
Expected: FAIL because the new runtimes are absent.

- [ ] **Step 3: Move exam state and handlers into the new controller**

Remove the legacy exam arranger block and `EXAM_DATA`/`EXAM_ROOMS` ownership from `freshman-exam-runtime.js`. Keep new-student division code in place and adapt the proctor helpers to consume `AssignmentResult.rooms`.

- [ ] **Step 4: Add local draft persistence**

Save only after an explicit user action. Store normalized workspace data in a versioned local key scoped by cohort and exam; do not send it through cloud synchronization. Clearing the workspace deletes the local key and file handles.

- [ ] **Step 5: Run syntax, runtime order, and controller tests**

Run: `npm run check:syntax && npm run test:runtime-order && node scripts/test-exam-arranger-runtime.js`  
Expected: PASS. Add `test:exam-arranger-runtime` to `package.json`.

- [ ] **Step 6: Commit**

```bash
git add public/assets/js/exam-arranger-runtime.js public/assets/js/runtime-loader-runtime.js public/assets/js/freshman-exam-runtime.js public/assets/js/ui-actions-runtime.js scripts/test-exam-arranger-runtime.js package.json
git commit -m "refactor(exam-arranger): isolate local workspace runtime"
```

### Task 4: Four-Step Workbench UI and Interaction States

**Files:**
- Modify: `src/index.html`
- Modify: `src/assets/css/main.css`
- Modify: `public/assets/js/exam-arranger-runtime.js`
- Create: `scripts/test-exam-arranger-ui-contract.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: workspace summaries and validation results from Tasks 1–3.
- Produces DOM regions `exam-step-import`, `exam-step-review`, `exam-step-arrange`, `exam-step-output`, `exam-summary-strip`, `exam-issue-list`, `exam-room-editor`, and `exam-output-center`.

- [ ] **Step 1: Write the failing UI contract test**

Assert all four step regions, required-field help, template actions, summary metrics, blocking issue panel, room capacity editor, confidentiality labels, fixed action bar, Tabler icons, and absence of emoji button labels.

- [ ] **Step 2: Replace the legacy single-screen markup**

Build the four-step shell inside the existing `exam-arranger` section. Keep the existing app header, sidebar, module navigation, and current cohort indicators unchanged.

- [ ] **Step 3: Add responsive workbench styles**

Use a two-column desktop grid with a sticky summary rail, one-column layout below the existing tablet breakpoint, frozen table headers, horizontal overflow, and visual states for complete/current/warning/blocking.

- [ ] **Step 4: Bind renderers and transitions**

Render import sources, issue groups, eligible/excluded students, room capacities, assignment previews, student search, and stale-result status. Block “下一步” only for unresolved blocking issues.

- [ ] **Step 5: Run UI and hygiene tests**

Run: `node scripts/test-exam-arranger-ui-contract.js && npm run test:html-hygiene && npm run test:css-hygiene && npm run test:ui-copy-integrity`  
Expected: PASS. Add `test:exam-arranger-ui` to `package.json`.

- [ ] **Step 6: Commit**

```bash
git add src/index.html src/assets/css/main.css public/assets/js/exam-arranger-runtime.js scripts/test-exam-arranger-ui-contract.js package.json
git commit -m "feat(exam-arranger): add four-step workbench"
```

### Task 5: Confidential/Public Excel Exports and ZIP Manifest

**Files:**
- Create: `public/assets/js/exam-arranger-export-runtime.js`
- Create: `scripts/test-exam-arranger-export-runtime.js`
- Modify: `public/assets/js/runtime-loader-runtime.js`
- Modify: `public/assets/js/exam-arranger-runtime.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: normalized workspace and `AssignmentResult`, plus `XLSX` and `JSZip` globals.
- Produces: `buildConfidentialRankingWorkbook(workspace, result)`
- Produces: `buildAuditWorkbook(workspace, result)`
- Produces: `buildPublicTotalWorkbook(workspace, result)`
- Produces: `buildPublicByClassWorkbook(workspace, result)`
- Produces: `buildPublicByRoomWorkbook(workspace, result)`
- Produces: `buildManifest(workspace, result, version) -> string`
- Produces: `buildOutputPackage(workspace, result, version) -> Promise<Uint8Array>`.

- [ ] **Step 1: Write failing workbook projection tests**

Build a source record with total and arbitrary subject columns. Assert confidential sheets retain them while every public sheet exposes only the approved headers and values.

- [ ] **Step 2: Write failing package structure tests**

Unzip the package and assert the five numbered folders, two confidential files, three public Excel files, print folders, and `编排说明.txt` naming and placement.

- [ ] **Step 3: Implement styled workbook builders**

Use `xlsx-js-style` for title rows, filters, widths, number formats, and visible confidentiality labels. Generate each workbook from an explicit projection; never delete sensitive fields after building a public row.

- [ ] **Step 4: Implement manifest and ZIP assembly**

The manifest records file names, counts, capacities, rule signature, timestamp, and app version without score details. ZIP generation remains lazy and shows progress in the output center.

- [ ] **Step 5: Run export tests**

Run: `node scripts/test-exam-arranger-export-runtime.js`  
Expected: PASS. Add `test:exam-arranger-export` to `package.json`.

- [ ] **Step 6: Commit**

```bash
git add public/assets/js/exam-arranger-export-runtime.js public/assets/js/runtime-loader-runtime.js public/assets/js/exam-arranger-runtime.js scripts/test-exam-arranger-export-runtime.js package.json
git commit -m "feat(exam-arranger): add protected Excel exports"
```

### Task 6: Room Sign and Desk Label DOCX Generation

**Files:**
- Create: `public/assets/js/exam-arranger-docx-runtime.js`
- Create: `scripts/test-exam-arranger-docx-runtime.js`
- Modify: `public/assets/js/runtime-loader-runtime.js`
- Modify: `public/assets/js/exam-arranger-export-runtime.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: public assignment projections and `JSZip`; it never receives raw score fields.
- Produces: `buildRoomSignsDocx(meta, rooms, JSZip) -> Promise<Uint8Array>`
- Produces: `buildDeskLabelsDocx(meta, room, JSZip) -> Promise<Uint8Array>`
- Produces: `buildPrintFiles(meta, rooms, JSZip) -> Promise<Map<string, Uint8Array>>`.

- [ ] **Step 1: Write failing OOXML archive tests**

Assert valid content-type and relationship parts, six room-sign sections/pages for six rooms, correct exam number ranges, 16 desk labels per page, and four pages for a 55-student room.

- [ ] **Step 2: Add the public-field leakage test**

Pass students containing total and subject scores, unzip every generated DOCX XML part, and assert no score value or sensitive field name appears.

- [ ] **Step 3: Implement the room-sign package**

Generate A4 landscape sections with centered grade, room name, and exam-number range, matching the approved desktop sample hierarchy.

- [ ] **Step 4: Implement per-room desk-label packages**

Generate A4 portrait tables with 2 columns × 8 rows, double borders, red exam numbers, name, room, and seat. Pad the final page with empty cells without emitting phantom students.

- [ ] **Step 5: Run DOCX tests and connect the files to the ZIP package**

Run: `node scripts/test-exam-arranger-docx-runtime.js && npm run test:exam-arranger-export`  
Expected: PASS. Add `test:exam-arranger-docx` to `package.json`.

- [ ] **Step 6: Commit**

```bash
git add public/assets/js/exam-arranger-docx-runtime.js public/assets/js/exam-arranger-export-runtime.js public/assets/js/runtime-loader-runtime.js scripts/test-exam-arranger-docx-runtime.js package.json
git commit -m "feat(exam-arranger): generate room signs and desk labels"
```

### Task 7: Sample Regression, Proctor Compatibility, and Browser Smoke

**Files:**
- Create: `scripts/verify-exam-arranger-sample.js`
- Create: `scripts/smoke-exam-arranger.js`
- Modify: `public/assets/js/exam-arranger-runtime.js`
- Modify: `public/assets/js/freshman-exam-runtime.js`
- Modify: `src/index.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: all runtime APIs from Tasks 1–6.
- Produces: optional CLI verifier `node scripts/verify-exam-arranger-sample.js <folder>`.
- Preserves: existing two-proctor-per-room assignment and special-role exclusions in an auxiliary result panel.

- [ ] **Step 1: Write the sample verifier**

Read `新生分班方案.xlsx`, `考场考号总表.xlsx`, the by-class workbook, and the by-room workbook from a supplied folder. Compare eligible count, order, exam numbers, room sizes, seat numbers, sheet names, and public headers without committing student data.

- [ ] **Step 2: Run the verifier against the approved desktop sample**

Run: `node scripts/verify-exam-arranger-sample.js "C:\Users\loru\Desktop\考号及考场"`  
Expected: `337 source`, `12 excluded`, `325 assigned`, room sizes `[55,54,54,54,54,54]`, and zero ordering mismatches.

- [ ] **Step 3: Adapt proctor assignment to the new room model**

Keep the existing teacher pool, patrol, affairs, and two-proctor-per-room behavior. Its exports must consume public room projections and must not gain score access.

- [ ] **Step 4: Build a focused Playwright smoke**

Generate a temporary workbook, open `exam-arranger`, upload it, resolve one exclusion, edit capacities, generate rooms, query one student, and trigger public package generation. Assert no page errors and no sensitive fields in public previews.

- [ ] **Step 5: Run focused local regression**

Run: `npm run build` then `node scripts/smoke-exam-arranger.js`  
Expected: PASS. Add `smoke:exam-arranger:local` to `package.json`.

- [ ] **Step 6: Commit**

```bash
git add scripts/verify-exam-arranger-sample.js scripts/smoke-exam-arranger.js public/assets/js/exam-arranger-runtime.js public/assets/js/freshman-exam-runtime.js src/index.html package.json
git commit -m "test(exam-arranger): verify sample and browser workflow"
```

### Task 8: Visual QA, Release Gates, Push, and Production Verification

**Files:**
- Modify only files required by concrete QA findings.

**Interfaces:**
- Consumes: completed feature branch and repository release commands.
- Produces: a deployed, production-verified exam arranger with recorded command evidence.

- [ ] **Step 1: Run focused unit and contract suites**

Run: `npm run test:exam-arranger-core && npm run test:exam-arranger-runtime && npm run test:exam-arranger-ui && npm run test:exam-arranger-export && npm run test:exam-arranger-docx`  
Expected: all PASS.

- [ ] **Step 2: Run repository integrity gates**

Run: `npm run build && npm run check:syntax && npm run test:runtime-order && npm run test:module-inventory && npm run test:workflow-interaction && npm run test:ui-copy-integrity`  
Expected: all PASS and no new runtime ordering or module inventory errors.

- [ ] **Step 3: Perform local browser regression with school-browser-regression**

Check 1440px and tablet widths, every workflow step, keyboard focus, long tables, blocking errors, stale-result behavior, and successful package download. Capture screenshots of each step and fix only observed issues.

- [ ] **Step 4: Render generated DOCX files with Microsoft Word**

Export the room-sign and first/last room desk-label files to PDF through Word COM, inspect every page, and confirm A4 orientation, page counts, text clipping, final-page padding, and score absence.

- [ ] **Step 5: Run the repository release smoke**

Use `school-release-smoke` and run the repository’s required fast release checks before pushing. Expected: build, local smoke, data-safety checks, and Cloudflare dry run pass.

- [ ] **Step 6: Review the branch diff and commit QA fixes**

```bash
git add <only files changed by QA>
git commit -m "fix(exam-arranger): polish verified workflow"
```

Skip the commit when QA produces no code changes.

- [ ] **Step 7: Push and verify deployment**

Push the completed commits, wait for the configured deployment workflow, then run `npm run smoke:prod-minimal` and a focused production `exam-arranger` browser smoke. Confirm the deployed version exposes the four-step workbench and can generate the sample-compatible outputs.
