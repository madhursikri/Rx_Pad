import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const sqlFile = path.join(__dirname, "local-test-seed.sql");
const persistDir = path.join(projectRoot, ".wrangler", "state");

const wranglerBin =
  process.platform === "win32"
    ? path.join(projectRoot, "node_modules", ".bin", "wrangler.cmd")
    : path.join(projectRoot, "node_modules", ".bin", "wrangler");
const seedCommand = `"${wranglerBin}" d1 execute DB --local --persist-to "${persistDir}" --file "${sqlFile}" --yes`;

try {
  console.log("Seeding local D1 test database...");
  execSync(seedCommand, {
    cwd: projectRoot,
    stdio: "inherit"
  });
  console.log("Local test database seeded successfully.");
} catch (error) {
  console.error("Failed to seed local test database.");
  process.exit(error?.status ?? 1);
}
