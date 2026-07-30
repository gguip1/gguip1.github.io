import { cp, mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");

const builds = [
  {
    workspace: "@odd-tools/portal",
    source: path.join(root, "projects/portal/dist"),
    destination: output,
  },
  {
    workspace: "@odd-tools/money-world",
    source: path.join(root, "projects/money-world/dist"),
    destination: path.join(output, "tools/money-world"),
  },
];

for (const build of builds) {
  const result = spawnSync(
    "npm",
    ["run", "build", "--workspace", build.workspace],
    { cwd: root, stdio: "inherit" },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

await rm(output, { recursive: true, force: true });

for (const build of builds) {
  await mkdir(build.destination, { recursive: true });
  await cp(build.source, build.destination, { recursive: true });
}

console.log(`Assembled ${builds.length} projects in ${output}`);
