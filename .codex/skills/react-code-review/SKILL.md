---
name: react-code-review
description: Review local changes, diffs, branches, or PRs for fullstack React applications. Use when checking React UI, client/server boundaries, API routes, auth, data fetching, persistence, security, performance, accessibility, maintainability, or release risk.
---

# React Code Review

Review changed code with a code-review stance for fullstack React applications. Prioritize concrete defects, regressions, security issues, scalability risks, and missing verification over stylistic preferences. Use project rules first, then these React/fullstack criteria.

## Scope And Modes

Use the narrowest mode that matches the request:

- **Local review:** current working tree, staged changes, a named branch comparison, or a user-provided diff.
- **PR review:** a GitHub PR number/URL/branch, optionally checked against a task brief, issue, or acceptance criteria.
- **Rule proposal:** if a real issue is not covered by loaded rules, recommend a new rule. Do not edit rules, create PRs, push commits, or mutate external services without explicit permission in that turn.

Never post GitHub comments, submit reviews, deploy, modify databases, update tasks, push commits, or mutate external services without explicit permission in that turn.

## Workspace Discovery

Before judging the change:

1. Find the nearest `.agent-workspace/` by searching upward from the current directory. If the current directory is `.agent-workspace`, use it directly.
2. Ensure `.agent-workspace/audits/` exists before writing a review report. Create only that missing directory when the workspace exists and an audit report is being written.
3. Read every Markdown file directly inside `.agent-workspace/rules/` when present. These project-specific rules always apply.
4. Check optional review configuration in this order:
   - `.agent-workspace/review-config.md`
   - `.agent-workspace/AGENTS.md`
   - user-provided path in the request
5. Recognize these config keys when present in Markdown prose or bullets:
   - `external_rules_repo`
   - `rules_repo_path`
   - `review_rules_repo`
   - `project_override`
   - `review_override`

If no external rules repo is configured, continue with project rules and this skill's default criteria. Do not treat missing external rules as a finding.

## External Rules Repo

When an external review rules repo is configured:

1. Read `<rules_repo>/rules/_index.md` first.
2. Determine changed paths from the review scope.
3. Load only rule section files whose scope obviously applies to changed paths. If the index does not provide globs, choose relevant files conservatively from section names and paths.
4. Load the matching override file from `<rules_repo>/overrides/` when `project_override` is configured or when a file name clearly matches the target repo.
5. Findings that cite external rules must include the rule ID. If no loaded rule covers the issue, say `No matching rule` and suggest proposing a rule instead of inventing an ID.

External rules are read-only during review.

## Review Workflow

1. Inspect scope:
   - Run `git status --short`.
   - Run `git diff --stat` or the branch/PR equivalent.
   - Read the relevant diff with `git diff -- <paths>`, `git diff <base>...HEAD`, `gh pr diff <pr>`, or the user-provided diff.
   - Include untracked source files in local reviews; `git diff` does not show their contents.
2. Load applicable rules:
   - Project rules from `.agent-workspace/rules/*.md`.
   - Relevant external rules and overrides when configured.
   - Local `AGENTS.md` files near touched code when they affect the changed paths.
3. Understand touched code enough to judge behavior:
   - Read surrounding components, hooks, route handlers, loaders/actions, API clients, schema files, mappers, tests, middleware, and call sites when the diff depends on them.
   - Distinguish user/unrelated work from the reviewed change when possible.
4. Validate cheaply:
   - Run targeted checks when safe and relevant, such as typecheck, lint, unit tests, build, focused E2E, or route/API smoke tests.
   - If tooling cannot run, state the exact blocker.

## Fullstack React Review Criteria

Check the changed code for:

- **React correctness:** hook dependency bugs, stale closures, render loops, hydration mismatches, uncontrolled/controlled input drift, broken suspense/loading/error states, invalid memoization, lost local state, and unsafe browser-only API usage during server rendering.
- **Component architecture:** bloated components, unclear ownership, prop bags that hide contracts, duplicated state, temporal coupling between hooks, feature code leaking into shared UI primitives, and abstractions that make common changes harder.
- **Client/server boundaries:** accidental client bundles from server-only imports, secrets or privileged SDKs exposed to the browser, missing `"use client"` where required, unnecessary `"use client"` on server-renderable modules, cache/revalidation mistakes, and route handlers with ambiguous runtime assumptions.
- **Data fetching and persistence:** race conditions, out-of-order writes, optimistic updates without rollback, missing unsubscribe/abort cleanup, N+1 requests, unbounded queries, missing pagination, invalid cache keys, stale invalidation, schema drift, and document/row ownership errors.
- **API and backend behavior:** input validation, authorization, idempotency, transactionality, error mapping, status codes, retry safety, rate limits, background side effects, and backwards compatibility of request/response shapes.
- **Auth and security:** broken owner checks, trusting client-supplied identity, leaked environment variables, unsafe redirects, XSS injection paths, CSRF-sensitive mutations, overbroad CORS, insecure cookies, missing server-side authorization, and permissive database/storage rules.
- **Performance:** expensive work on every render/request, large client bundles, avoidable re-renders, unstable dependencies, waterfall fetches, oversized images/assets, missing code splitting, unbounded list rendering, and per-request database work that will not scale.
- **Accessibility and UX regressions:** missing labels or names for controls, keyboard traps, focus loss after dialogs/navigation, disabled states that hide recovery, text overflow/overlap, color contrast regressions, mobile layout breakage, and loading/error states that leave users stuck.
- **Tests and verification:** missing coverage for changed behavior, missing regression tests around fixed bugs, no smoke test for auth/data flows, and unverified migrations/config/rules.

## PR Review Additions

For GitHub PR review:

- Resolve metadata with `gh pr view <pr> --json number,title,headRefName,baseRefName,author,body,files,url` when `gh` is available.
- Read the diff with `gh pr diff <pr>`.
- If the user provides task content, acceptance criteria, or issue links, check the diff against them.
- If task context is absent, review code correctness and explicitly state that acceptance criteria were not verified.
- Publishing review comments or submitting a PR review requires explicit permission after showing draft findings.

## Audit Reports

Prefer writing a Markdown audit report when the review is part of a tracked task, a PR review, or the user asks for a report. Otherwise a chat-only review is acceptable.

Report path:

```text
.agent-workspace/audits/YYYY-MM-DD-HHMM-react-review-<scope>.md
```

Audit report content:

- Scope reviewed: local diff, branch comparison, PR, or provided diff.
- Rules loaded: project rule files, external rule files, overrides.
- Findings grouped by severity.
- React/component architecture assessment.
- Fullstack/API/data/security assessment.
- Performance and accessibility assessment.
- Acceptance criteria/task coverage when available.
- Verification run or why it was not run.
- Residual risks and follow-ups.

If a relevant `.agent-workspace/tasks/*.md` task record exists, link the audit report from its `Related Artifacts` or `Research And Findings` section and summarize important findings there. Do not create a new task record unless the user asked to track the task.

## Judgment Rules

- Lead with findings. If there are no material findings, say so clearly.
- Only report issues grounded in code or diff evidence.
- Do not inflate minor preferences into defects.
- Rank by severity: `Critical`, `High`, `Medium`, `Low`.
- Include clickable file/line references when working in a local repo.
- Include the relevant project rule file or external rule ID when a finding is rule-backed.
- Mention residual risk separately from confirmed issues.

## Report Format

Use this concise structure:

```md
**Findings**
- `Severity` [file:line] (`RULE-ID`, `rule-file.md`, or `No matching rule`): concrete issue, impact, and suggested fix.

**React Architecture**
Short assessment of component boundaries, hooks, state ownership, rendering, and client/server split.

**Fullstack**
Short assessment of API, auth, data access, persistence, migrations/config/rules, and security.

**Performance And A11y**
Short assessment of render/request cost, bundle/assets, responsiveness, accessibility, and mobile UX.

**Other Risks**
Tests, config, lifecycle, acceptance criteria, or verification gaps.

**Audit**
Report path if one was written.
```

If no issues:

```md
**Findings**
No blocking issues found.

**React Architecture**
...

**Fullstack**
...

**Performance And A11y**
...

**Other Risks**
...

**Audit**
...
```
