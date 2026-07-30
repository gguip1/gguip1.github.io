import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectsRoot = path.join(root, "projects");
const requiredFiles = [
  "AGENTS.md",
  "CHANGELOG.md",
  "CLAUDE.md",
  "README.md",
  "SPEC.md",
  "project.json",
  "package.json",
  "harnesses/README.md",
];

const entries = await readdir(projectsRoot, { withFileTypes: true });
const projects = entries.filter((entry) => entry.isDirectory());
const errors = [];

try {
  const rootChangelog = await readFile(path.join(root, "CHANGELOG.md"), "utf8");

  if (
    !rootChangelog.startsWith("# Changelog") ||
    !rootChangelog.includes("## [Unreleased]")
  ) {
    errors.push(
      "root: CHANGELOG.md must start with # Changelog and include ## [Unreleased]",
    );
  }
} catch {
  errors.push("root: missing CHANGELOG.md");
}

for (const project of projects) {
  const directory = path.join(projectsRoot, project.name);

  for (const requiredFile of requiredFiles) {
    try {
      await access(path.join(directory, requiredFile));
    } catch {
      errors.push(`${project.name}: missing ${requiredFile}`);
    }
  }

  try {
    const claudeInstructions = await readFile(
      path.join(directory, "CLAUDE.md"),
      "utf8",
    );

    if (!claudeInstructions.includes("@AGENTS.md")) {
      errors.push(`${project.name}: CLAUDE.md must import @AGENTS.md`);
    }
  } catch {
    // Missing file is reported above.
  }

  try {
    const changelog = await readFile(
      path.join(directory, "CHANGELOG.md"),
      "utf8",
    );

    if (!changelog.startsWith("# Changelog")) {
      errors.push(`${project.name}: CHANGELOG.md must start with # Changelog`);
    }

    if (!changelog.includes("## [Unreleased]")) {
      errors.push(`${project.name}: CHANGELOG.md must include ## [Unreleased]`);
    }
  } catch {
    // Missing file is reported above.
  }

  try {
    const projectConfig = JSON.parse(
      await readFile(path.join(directory, "project.json"), "utf8"),
    );

    if (projectConfig.id !== project.name) {
      errors.push(
        `${project.name}: project.json id must match the directory name`,
      );
    }

    if (!Array.isArray(projectConfig.harnesses)) {
      errors.push(`${project.name}: project.json harnesses must be an array`);
    } else {
      for (const harness of projectConfig.harnesses) {
        const harnessDirectory = path.join(
          directory,
          "harnesses",
          harness.id ?? "",
        );

        try {
          await access(path.join(harnessDirectory, "HARNESS.md"));
        } catch {
          errors.push(
            `${project.name}: registered harness "${harness.id}" is missing HARNESS.md`,
          );
        }
      }
    }
  } catch (error) {
    errors.push(`${project.name}: invalid project.json (${error.message})`);
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Verified project contracts for ${projects.length} projects.`);
