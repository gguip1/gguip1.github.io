# Repository agent instructions

## Mission

Build a collection of short, unusual, and useful browser-based tools.

## Project boundaries

- `projects/<id>/` is the primary unit of ownership.
- Before changing a project, read its `AGENTS.md`, `SPEC.md`, `CHANGELOG.md`, `project.json`, and relevant harness documentation.
- By default, modify only the project named in the task.
- Do not modify another project to complete a local task.
- Changes under `packages/`, `tooling/`, or root configuration have repository-wide impact and require running the root verification command.

## Product constraints

- Projects are static and must not require an application server.
- Do not add authentication, a database, analytics, an external API, or transmission of user input without explicit approval.
- Each tool must remain directly buildable and runnable.
- Keep project-specific logic and data inside that project.
- Move code into `packages/` only after it is used by more than one project.

## Harnesses

- A project may have zero or more harnesses under `harnesses/<purpose>/`.
- Do not assume a particular harness technology.
- Every harness folder must include `HARNESS.md` with its purpose, command, inputs, artifacts, and pass conditions.
- Do not weaken tests or harness conditions merely to make an implementation pass.
- Register runnable harnesses in the project's `project.json`.

## Changelogs

- Every task that changes tracked files must update at least one relevant `CHANGELOG.md`.
- Repository-wide architecture, tooling, dependency, CI, catalog, or shared-package changes go in the root `CHANGELOG.md`.
- Project-specific changes go in `projects/<id>/CHANGELOG.md`.
- If a shared change materially affects a project's behavior, update both the root and affected project changelogs.
- Add new entries under `## [Unreleased]`; do not rewrite released entries.
- Describe observable behavior, maintenance impact, or migration requirements rather than listing filenames.

## Required verification

- Project-only work: run the project's `npm run verify`.
- Shared or root work: run `npm run verify` from the repository root.
- If Node.js is unavailable on the host, run `docker compose run --rm verify`.
- A task is not complete while required checks fail.

## Generated files

- Do not commit build output, coverage, browser reports, or harness artifacts unless they are explicitly approved baselines.
