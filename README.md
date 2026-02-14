# Rx_Pad

Local-first patient intake and search web app for a small medical practice.

## Features in v1

- Add a new patient with:
  - required: first name, last name, date of birth, gender
  - optional: phone (country code + local number), email, address, notes
- Search patients instantly by:
  - name
  - date of birth (`YYYY-MM-DD`)
  - phone digits (local or full with country code)
- View full patient demographics from search results
- Add prescriptions per selected patient:
  - search/select medication
  - enter strength, dose, frequency, duration, and instructions
  - mark prescriptions active/inactive (without deleting history)
  - view active prescriptions and optional inactive history
- Add patient visit notes directly from patient overview:
  - notes are timestamped and shown in reverse chronological order
- Prescription Dataset:
  - top-level screen to manage frequently used medication presets
  - add new medication entries with default dosage/frequency/duration/instructions
  - select existing entries to edit and save updates
  - delete dataset entries that are no longer needed
  - newly added entries appear in patient prescription search immediately

## Tech Stack

- Next.js (App Router, TypeScript)
- Prisma ORM
- SQLite (`prisma/dev.db`)
- Zod validation
- Tailwind CSS

## Local Setup (Clinic Machine)

1. Install Node.js LTS.
2. Open terminal in `C:\Users\madhu\git\Rx_Pad`.
3. Run one command:

```cmd
start-rx-pad.cmd
```

This script handles all required startup steps automatically:

- creates `.env` from `.env.example` if missing
- installs dependencies
- generates Prisma client
- applies migrations
- seeds test data:
  - 15 medications for search/select
  - 10 test patients with varied demographic permutations
- runs an automatic SQLite backup (if `prisma/dev.db` exists)
- builds the app
- starts the app on `http://localhost:3000`

## Day-to-Day Run

Use the same single command from project root:

```cmd
start-rx-pad.cmd
```

## Development Run

```bash
npm run dev
```

## API Endpoints

- `POST /api/patients`
  - Creates patient
  - Returns `201` and patient JSON
  - Returns `400` with `fieldErrors` on validation failure
- `GET /api/patients?query=&limit=`
  - Returns recent patients when `query` is empty
  - Otherwise searches by name/DOB/phone
- `GET /api/patients/:id`
  - Returns full patient details

## Backup Routine (Local SQLite)

Database file to protect:

- `prisma/dev.db`

Recommended daily backup path:

- `Rx_Pad\backups\database\YYYY-MM-DD_HH-mm-ss\dev.db`

Retention policy:

- backup script keeps only the most recent 10 backup snapshots
- older snapshots are deleted automatically

### Manual Backup Command

From project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-db.ps1
```

### Recovery Procedure

1. Stop the running app (close terminal running `npm run start` / `start-rx-pad.cmd`).
2. Pick the backup snapshot you want from:
   - `Rx_Pad\backups\database\YYYY-MM-DD_HH-mm-ss\dev.db`
3. From project root, restore it over the live DB:

```powershell
Copy-Item -Path .\backups\database\<SNAPSHOT_FOLDER>\dev.db -Destination .\prisma\dev.db -Force
```

4. Start app again:

```cmd
start-rx-pad.cmd
```

Example:

```powershell
Copy-Item -Path .\backups\database\2026-02-13_14-34-14\dev.db -Destination .\prisma\dev.db -Force
```

## Security/Scope Notes

- Designed for local-machine use only in v1 (`localhost`).
- No authentication in this phase (single-practice workflow).
- Not internet-exposed and not a full HIPAA-hardened deployment yet.

## Planned Next Scope

- Prescription writing and management linked to patient records.
