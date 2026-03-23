const fs = require("node:fs/promises");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const releaseDir = path.join(rootDir, "release");
const keepFileName = "Rx Pad.exe";

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await pathExists(releaseDir))) return;

  const entries = await fs.readdir(releaseDir, { withFileTypes: true });
  const extras = entries.filter((entry) => entry.name !== keepFileName);

  if (extras.length === 0) return;

  for (const entry of extras) {
    await fs.rm(path.join(releaseDir, entry.name), { recursive: true, force: true });
  }

  console.log(`[cleanup-release] Removed ${extras.length} extra artifact(s) from release`);
}

main().catch((error) => {
  console.error("[cleanup-release] Failed:", error);
  process.exitCode = 1;
});
