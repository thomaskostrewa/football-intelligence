# Football Intelligence Delivery Workflow

This workflow is mandatory for Codex-driven changes touching GitHub, Vercel, Notion, or live data sources.

## Core Principles

- Do not present mock, seed, or fallback data as live data.
- Every environment must expose its data source state when dynamic data is involved.
- Move Notion status only after the matching verification gate is complete.
- Keep Preview, Production, and Live Data Activation as separate milestones.
- Prefer connector/API checks first. Use local shell fallback only when connector permissions are missing.

## Status Gates

### Definition

- Confirm user goal, scope, and source of truth.
- Identify whether the story requires live data, fallback data, or UI-only work.
- Define acceptance criteria with explicit negative checks, for example: "Germany vs Mexico must not appear unless provider returns it."
- Set Notion story to `Definition` or `Doing` only after scope is written down.

### Doing

- Implement against the repo's existing patterns.
- Add source metadata for any dynamic data path.
- Keep fallback behavior visible and labeled.
- Run focused local checks before pushing.

Required local checks before Preview:

```bash
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/next build
```

For API changes, also run a local production smoke test when possible:

- Start the built app with `next start`.
- Check the relevant API route returns the expected status.
- Check source metadata and critical negative assertions.

### Review

- Push a dedicated branch.
- Confirm Vercel Preview deployment is `READY`.
- Verify the Preview URL in the browser or via Vercel fetch tools.
- Update Notion to `Review` only after Preview is reachable.
- Do not claim "live data" unless production environment variables and provider response are verified.

### Approved

- Wait for explicit user approval.
- User phrases like "Kann live gehen" or "Deployment bestaetigt" are approval signals.
- If user has not explicitly approved, do not merge to `main`.

### Done

- Merge to `main` only after approval.
- Confirm Vercel Production deployment is `READY`.
- Confirm production aliases include the intended domain.
- Smoke-test production route/API.
- Update Notion to `Done` only after production verification.

## GitHub Rules

- Use the GitHub connector for PR reads and merges when permissions allow.
- If the connector cannot update Draft/PR metadata, use local Git as fallback.
- Before merging locally:
  - switch to `main`
  - pull `origin main` with `--ff-only`
  - merge the approved branch
  - run typecheck and build
  - push `main`
- If a PR description becomes stale, mention that in the final release note when the connector cannot update it.

## Vercel Rules

- Treat Vercel states literally:
  - `BUILDING` means wait.
  - `READY` means deploy completed.
  - `ERROR` means inspect logs before continuing.
- For Preview:
  - Verify the deployment for the branch commit.
  - Check Preview Protection if a URL redirects to Vercel SSO.
- For Production:
  - Verify `target=production`.
  - Verify aliases include `football.thomas-kostrewa.de`.
  - Smoke-test `https://football.thomas-kostrewa.de/api/matches` for Football Intelligence data stories.

## Notion Rules

- Notion is the delivery ledger, not a guess log.
- `Review` requires a reachable Preview.
- `Done` requires a verified Production deployment.
- Record deployment ID, production URL, PR link, and remaining caveats in the story.
- Rework must move the story back from `Review` to `Definition` or `Doing` with a clear reason.

## Live Data Rules

- Static seed files are allowed only as visible fallbacks.
- Provider configuration must be explicit in environment variables.
- Production is not considered "live data active" until the provider returns data in production.
- For SportMonks fixtures, production requires:
  - `SPORTMONKS_API_TOKEN`
  - `SPORTMONKS_WORLD_CUP_SEASON_ID`
- API responses must expose source metadata such as:
  - source kind
  - configured/unconfigured
  - live/fallback
  - generated timestamp

## Release Communication Template

Use this shape for final release messages:

```text
Production is live: <url>
Deployment: <deployment-id> is READY
PR: <url> merged
Verified:
- typecheck
- build
- production smoke route/API
Data source:
- live provider active: yes/no
- fallback active: yes/no
Remaining action:
- <only if required>
```
