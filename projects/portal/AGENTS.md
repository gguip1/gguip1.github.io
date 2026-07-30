# Portal agent instructions

## Scope

The portal helps visitors discover and enter tools. Its default write scope is `projects/portal/**`.

## Required context

Before changing portal behavior, read:

1. `SPEC.md`
2. `CHANGELOG.md`
3. `project.json`
4. Relevant documents under `harnesses/`
5. `../../catalog/tools.json` when changing tool discovery

## Boundaries

- Do not import source code from another project.
- Read tool metadata from the catalog rather than duplicating it in UI code.
- Do not implement tool-specific behavior inside the portal.

## Changelog

Update `CHANGELOG.md` under `## [Unreleased]` for every portal change. Repository-wide changes also require updating `../../CHANGELOG.md`.

## Verification

Run `npm run verify` in this project before completing portal work.
