# Money World agent instructions

## Scope

This project converts a spending amount into surprising alternative uses. Its default write scope is `projects/money-world/**`.

## Required context

Before changing product behavior, read:

1. `SPEC.md`
2. `CHANGELOG.md`
3. `project.json`
4. Relevant documents under `harnesses/`

## Boundaries

- Keep conversion data and selection logic in this project.
- Do not add network requests or persist user input externally.
- Random behavior must support an injectable seed when the result engine is implemented.
- Do not modify the portal while implementing this tool; catalog changes are a separate integration step.

## Changelog

Update `CHANGELOG.md` under `## [Unreleased]` for every project change. Repository-wide changes also require updating `../../CHANGELOG.md`.

## Verification

Run `npm run verify` in this project before completing project-only work.
