# PROJECT_TITLE agent instructions

## Scope

The default write scope is `projects/PROJECT_ID/**`.

## Required context

Before changing product behavior, read `SPEC.md`, `CHANGELOG.md`, `project.json`, and relevant documents under `harnesses/`.

## Changelog

Update `CHANGELOG.md` under `## [Unreleased]` for every project change. Repository-wide changes also require updating `../../CHANGELOG.md`.

## Verification

Run `npm run verify` in this project before completing project-only work.
