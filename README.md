 # Rx_Pad  

Rx Pad is a browser-based patient intake and prescription workflow app that can be deployed on Cloudflare Pages.

## What Cloudflare Will Handle

- Hosting the web app
- Deploying automatically from GitHub on every push
- Running the API endpoints through Pages Functions
- Providing the D1 database backing store
- Creating the database tables and starter records automatically on first app use

## One-Time Cloudflare Setup

You still need to create the Cloudflare project and attach the D1 database once.
After that, Cloudflare handles the rest.

## Step By Step Deployment

1. Push this repository to GitHub.
2. Sign in to Cloudflare.
3. Go to **Workers & Pages**.
4. Select **Create application**.
5. Choose **Pages**.
6. Select **Connect to Git**.
7. Pick your GitHub account and this repository.
8. Set the branch to deploy, usually `main`.
9. Use these build settings:
   - Build command: `npm run build`
   - Build output directory: `out`
10. Create a new **D1** database in Cloudflare.
11. Copy the database ID from the D1 database details page.
12. Paste that ID into [wrangler.toml](/c:/Users/madhu/git/Rx_Pad/wrangler.toml) in the `database_id` field.
13. Save the file and push the change to GitHub.
14. Save and deploy the Pages project.
15. Open the Cloudflare Pages URL that gets created.

## Cloudflare Pages

When you create the Pages project, use these values:

- Project type: `Pages`
- Source: `GitHub`
- Repository: this `Rx_Pad` repo
- Branch: `main` or your production branch
- Build command: `npm run build`
- Build output directory: `out`
- D1 binding name: `DB`
- D1 database ID: set in [wrangler.toml](/c:/Users/madhu/git/Rx_Pad/wrangler.toml)

Recommended project behavior:

- Enable automatic deployments from GitHub.
- Leave the app public so users can open the Pages URL directly.
- Do not add a separate API server; the app already serves its own API routes through Pages Functions.
- If the dashboard says bindings are managed through `wrangler.toml`, that is expected. Use the repo file instead of the UI.

If Cloudflare asks for an environment variable or optional setting you do not understand, leave it blank unless you know the app needs it.

## What Happens On First Launch

The first time the app receives a request, it will:

- create the database tables in D1
- seed the default medication list
- seed the starter patient records

That means there is no manual schema migration step after deployment.

## Ongoing Workflow

- Push changes to GitHub.
- Cloudflare redeploys automatically.
- Users open the Pages URL in a browser.

## Local Development

Run everything with the one-step local testing script:

```bash
.\run_local_for_testing.cmd
```

The script will:

- verify that Node.js is installed
- install dependencies if `node_modules` is missing
- stop any process already using `127.0.0.1:3000`
- build the static app
- seed the local D1 database with test data
- start the app locally at `http://127.0.0.1:3000`
- run through Cloudflare Pages locally so `/api` routes and D1-backed data work during testing

Seed the local D1 database with testing-only sample data for every table:

```bash
npm.cmd run seed:local:test
```

This local seed command:

- recreates the local D1 schema if needed
- clears existing local D1 data
- inserts linked sample records into `Patient`, `PatientNote`, `PatientEvent`, `Medication`, and `Prescription`
- uses `wrangler d1 execute --local`, so it does not modify the remote Cloudflare database

If you want to run the steps manually instead, use:

```bash
npm install
npm.cmd run build
npm.cmd run seed:local:test
.\node_modules\.bin\wrangler.cmd pages dev out --ip 127.0.0.1 --port 3000 --persist-to .wrangler\state
```

Build the static site:

```bash
npm run build
```

Preview with Cloudflare Pages locally:

```bash
npm run pages:dev
```

The repository includes a minimal [wrangler.toml](/c:/Users/madhu/git/Rx_Pad/wrangler.toml) for local Cloudflare development.

## Notes

- This repo is Cloudflare Pages focused.
- The old Windows installer and Prisma/SQLite runtime files were removed.
- No generated build output should be committed.
