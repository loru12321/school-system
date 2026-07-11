# School System repository instructions

These instructions apply to the whole repository and are intentionally versioned for Codex on every device.

## Required project Skill

Use `.agents/skills/optimize-school-system/SKILL.md` for performance diagnosis, UI or module-loading work, caching, Workers, student development, score/rank comparisons, teacher timetables, cloud refresh, release checks, and Cloudflare deployment.

Use the more focused Skill when applicable:

- `.agents/skills/school-browser-regression/SKILL.md` for logged-in browser and module smoke tests.
- `.agents/skills/school-release-smoke/SKILL.md` for build/release verification.
- `.agents/skills/school-supabase-gateway/SKILL.md` for Supabase, authentication, gateway, or SQL/RLS work.

Read each selected `SKILL.md` completely before acting, then load only the references it directs you to.

## Non-negotiable rules

- Inspect Git status first and preserve unrelated user changes.
- Never change scores, aggregation, rounding, percentiles, growth, volatility, rank formulas, tie behavior, or calculated results to improve performance.
- Preserve class-rank comparison. For 14 schools show school and township ranks but no county rank; for 24 schools also show county rank.
- Give every click immediate visible feedback; move heavy calculation, cloud refresh, and large rendering off the interaction path.
- Prevent stale asynchronous requests from overwriting newer selections or confirmed timetable state.
- Do not migrate the database or change cloud schemas unless explicitly requested.
- Do not deploy unless the user requested deployment. After deployment, verify the live logged-in workflow and production URL.
- Do not commit credentials, tokens, local absolute paths, or device-specific settings.
