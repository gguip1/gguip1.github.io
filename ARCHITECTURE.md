# Architecture

## Repository model

This is a project-oriented npm workspaces monorepo.

```text
projects/   independently runnable portal and tools
packages/   code proven to be shared by multiple projects
catalog/    portal-facing project metadata
tooling/    repository-wide validation and deployment assembly
templates/  starting point for a new project
```

Each project owns its implementation, static assets, product specification, agent instructions, and any number of purpose-specific harnesses.

## Dependency direction

```text
projects/*  --->  packages/*
     |
     +------X---->  projects/*
```

A project may depend on shared packages. Projects must not import from one another.

## Deployment

Every project builds independently. The root build assembles the outputs into one GitHub Pages artifact:

```text
dist/
├── index.html
├── assets/
└── tools/
    └── money-world/
        ├── index.html
        └── assets/
```

The portal is served from `/`. Each tool is served from the route declared in its `project.json`.

## Agent instructions

`AGENTS.md` is the canonical instruction format. `CLAUDE.md` imports the colocated `AGENTS.md` so Claude Code and other agents follow the same source rules.

## Harnesses

Harnesses are selected per project rather than imposed globally. A project can add folders such as:

```text
harnesses/
├── logic/
├── browser/
├── visual/
├── randomness/
└── privacy/
```

Only create a harness when its purpose and pass conditions are known.
