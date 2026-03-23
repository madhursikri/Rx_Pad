const fsSync = require("node:fs");
const path = require("node:path");
const APP_NAME = "Rx Pad";
let logFilePath = path.join(process.env.TEMP || process.cwd(), APP_NAME, "startup.log");

try {
  fsSync.mkdirSync(path.dirname(logFilePath), { recursive: true });
  fsSync.appendFileSync(logFilePath, `${new Date().toISOString()} main entry loaded\n`);
} catch (error) {
  console.warn("[Rx Pad] Early logging failed:", error);
}

const { app, BrowserWindow, dialog } = require("electron");
const http = require("node:http");
const fs = require("node:fs/promises");
const { spawn } = require("node:child_process");
const next = require("next");

const BACKUP_RETENTION_LIMIT = 10;
const STARTUP_TIMEOUT_MS = 120000;

let mainWindow = null;
let server = null;
let shuttingDown = false;

function getAppRoot() {
  return path.resolve(__dirname, "..");
}

function getDataRoot() {
  return path.join(app.getPath("userData"), "data");
}

function getBackupRoot() {
  return path.join(app.getPath("userData"), "backups", "database");
}

function getDatabasePath() {
  return path.join(getDataRoot(), "dev.db");
}

function getPrismaCliPath() {
  return path.join(getAppRoot(), "node_modules", "prisma", "build", "index.js");
}

function getSeedScriptPath() {
  return path.join(getAppRoot(), "scripts", "seed-test-patients.cjs");
}

function toDatabaseUrl(filePath) {
  return `file:${filePath.replace(/\\/g, "/")}`;
}

function createCommandError(command, code, stderr) {
  const details = stderr ? `\n\n${stderr.trim()}` : "";
  return new Error(`${command} exited with code ${code}.${details}`);
}

async function logLine(message) {
  try {
    if (!logFilePath) {
      logFilePath = path.join(app.getPath("temp"), APP_NAME, "startup.log");
    }

    await fs.mkdir(path.dirname(logFilePath), { recursive: true });
    await fs.appendFile(logFilePath, `${new Date().toISOString()} ${message}\n`);
  } catch (error) {
    console.warn("[Rx Pad] Logging failed:", error);
  }
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: getAppRoot(),
      env: {
        ...process.env,
        ...options.env
      },
      shell: false,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(createCommandError(command, code ?? -1, stderr));
    });
  });
}

function runAsNode(scriptPath, args = [], options = {}) {
  return runProcess(process.execPath, [scriptPath, ...args], {
    ...options,
    env: {
      ELECTRON_RUN_AS_NODE: "1",
      ...options.env
    }
  });
}

async function ensureDirectoryStructure() {
  await fs.mkdir(getDataRoot(), { recursive: true });
  await fs.mkdir(getBackupRoot(), { recursive: true });
}

async function runDatabaseMigrations() {
  await logLine(`Running Prisma migrations at ${getDatabasePath()}`);
  await runAsNode(getPrismaCliPath(), ["migrate", "deploy"], {
    env: {
      DATABASE_URL: toDatabaseUrl(getDatabasePath()),
      PRISMA_HIDE_UPDATE_MESSAGE: "1"
    }
  });
}

async function runSeedScript() {
  await logLine("Running seed script");
  await runAsNode(getSeedScriptPath(), [], {
    env: {
      DATABASE_URL: toDatabaseUrl(getDatabasePath()),
      PRISMA_HIDE_UPDATE_MESSAGE: "1"
    }
  });
}

async function runBackup() {
  if (!(await fileExists(getDatabasePath()))) return;

  await logLine("Running startup backup");
  const snapshotFolder = new Date().toISOString().replace(/[:.]/g, "-");
  const targetDir = path.join(getBackupRoot(), snapshotFolder);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.copyFile(getDatabasePath(), path.join(targetDir, "dev.db"));

  const backupDirs = await fs.readdir(getBackupRoot(), { withFileTypes: true });
  const orderedBackups = [];

  for (const entry of backupDirs) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(getBackupRoot(), entry.name);
    const stats = await fs.stat(fullPath);
    orderedBackups.push({ fullPath, mtimeMs: stats.mtimeMs });
  }

  orderedBackups.sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const backup of orderedBackups.slice(BACKUP_RETENTION_LIMIT)) {
    await fs.rm(backup.fullPath, { recursive: true, force: true });
    await logLine(`Pruned old backup: ${backup.fullPath}`);
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function bootstrapDatabase() {
  await logLine("Bootstrap starting");
  await ensureDirectoryStructure();
  process.env.DATABASE_URL = toDatabaseUrl(getDatabasePath());
  process.env.RX_PAD_DB_PATH = getDatabasePath();
  process.env.RX_PAD_BACKUP_ROOT = getBackupRoot();
  process.env.PRISMA_HIDE_UPDATE_MESSAGE = "1";

  await runDatabaseMigrations();
  await runSeedScript();
}

async function startServer() {
  await logLine("Starting Next server");
  const nextApp = next({
    dev: false,
    dir: getAppRoot()
  });

  await nextApp.prepare();
  const handle = nextApp.getRequestHandler();

  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      Promise.resolve()
        .then(() => handle(req, res))
        .catch((error) => {
          console.error("[Rx Pad] Request failed:", error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end("Rx Pad encountered an unexpected server error.");
          }
        });
    });

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Rx Pad server failed to acquire a local port."));
        return;
      }

      void logLine(`Server listening on http://127.0.0.1:${address.port}`);
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function createLoadingPage(message) {
  const escapedMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${APP_NAME}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe8;
        --panel: #fffaf3;
        --text: #2b241d;
        --muted: #6a5d52;
        --accent: #8f5b38;
      }
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        font-family: Segoe UI, system-ui, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(143, 91, 56, 0.14), transparent 34%),
          linear-gradient(180deg, #fbf7f1 0%, var(--bg) 100%);
        color: var(--text);
      }
      body {
        display: grid;
        place-items: center;
      }
      .card {
        width: min(560px, calc(100vw - 48px));
        padding: 32px 30px;
        border-radius: 24px;
        background: var(--panel);
        box-shadow: 0 20px 50px rgba(60, 38, 18, 0.14);
        border: 1px solid rgba(143, 91, 56, 0.12);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 30px;
        line-height: 1.1;
      }
      p {
        margin: 0;
        font-size: 16px;
        line-height: 1.6;
        color: var(--muted);
      }
      .bar {
        margin-top: 22px;
        height: 8px;
        border-radius: 999px;
        background: rgba(143, 91, 56, 0.12);
        overflow: hidden;
      }
      .bar::after {
        content: "";
        display: block;
        width: 40%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, transparent, var(--accent), transparent);
        animation: slide 1.4s ease-in-out infinite;
      }
      .note {
        margin-top: 16px;
        font-size: 13px;
        color: #8a7a6d;
      }
      @keyframes slide {
        0% { transform: translateX(-120%); }
        100% { transform: translateX(320%); }
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>${APP_NAME}</h1>
      <p>${escapedMessage}</p>
      <div class="bar" aria-hidden="true"></div>
      <div class="note">This window will switch to the app automatically.</div>
    </main>
  </body>
</html>`)}`;
}

async function showLoadingWindow(message) {
  if (!mainWindow) {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 960,
      minWidth: 1200,
      minHeight: 800,
      backgroundColor: "#f4efe8",
      title: APP_NAME,
      show: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    });

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  }

  await mainWindow.loadURL(createLoadingPage(message));
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = null;
    }
  } finally {
    app.exit(code);
  }
}

async function startApp() {
  try {
    await showLoadingWindow("Starting Rx Pad and preparing your local database.");

    await withTimeout(
      bootstrapDatabase(),
      STARTUP_TIMEOUT_MS,
      "Startup timed out while preparing the database."
    );
    const url = await startServer();
    if (!mainWindow) {
      await showLoadingWindow("Launching the app window.");
    }
    await mainWindow.loadURL(url);
    void runBackup().catch((error) => {
      console.warn("[Rx Pad] Startup backup failed:", error);
    });
  } catch (error) {
    await logLine(
      `Startup failed: ${error instanceof Error ? error.stack || error.message : String(error)}`
    );
    console.error("[Rx Pad] Failed to start:", error);
    dialog.showErrorBox(
      "Rx Pad could not start",
      error instanceof Error ? error.message : "An unexpected startup error occurred."
    );
    if (mainWindow) {
      await showLoadingWindow("Rx Pad could not start. Please close this window and try again.");
    }
    await shutdown(1);
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
  process.exit(0);
}

app.setAppUserModelId("com.rxpad.app");

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    void shutdown(0);
  }
});

app.on("before-quit", () => {
  shuttingDown = true;
});

app.whenReady().then(() => {
  void logLine("App ready");
  void startApp();
});
