# Rx_Pad

Rx Pad is a local-first patient intake and prescription management app for a small medical practice.

## Source Code

This repository contains the app source code, schema, scripts, and local development helpers.

## Development

Install Node.js LTS, then from the project root:

```cmd
npm install
```

Start the app in development:

```cmd
npm run dev
```

Or use the clinic helper script:

```cmd
start-rx-pad.cmd
```

The helper script:

- creates `.env` from `.env.example` if needed
- installs dependencies
- generates the Prisma client
- applies migrations
- seeds test data
- runs a local backup when `prisma/dev.db` exists
- builds the app
- starts the local server

## Data And Backups

Development database:

- `prisma/dev.db`

Manual backup command:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-db.ps1
```

Retention:

- keeps the most recent 10 backup snapshots

## Notes

- Designed for local-machine use only.
- No authentication in v1.
- Not internet-exposed.
- No generated release files should be committed.
