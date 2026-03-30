# Rx Pad Authentication

Rx Pad does not implement its own username/password system. The simplest setup for this app is to put **Cloudflare Access** in front of the Pages site and use **One-time PIN** email login with an approved email allowlist.

That gives you:

- one sign-in flow for non-technical users
- session management handled by Cloudflare
- app and API route protection without adding login code to Rx Pad
- a single place to manage who is allowed to use the app

## Recommended Model

Use **email allowlist + One-time PIN**.

How it works:

1. A user opens the app.
2. Cloudflare Access asks for their email.
3. If the email is approved, Cloudflare sends a one-time code.
4. The user enters the code and gets a Cloudflare-managed session.
5. All Pages routes and API requests stay protected by that session.

This is the easiest model for a non-technical end user because they do not need to remember another password or create a separate account.

## Cloudflare Setup

Set up Cloudflare Access in the Cloudflare dashboard:

1. Open **Zero Trust**.
2. Go to **Access**.
3. Create an **application** for the Rx Pad Pages site.
4. Add the Rx Pad production hostname and the preview/testing hostname you want protected.
5. Create an access policy that allows only approved email addresses.
6. Enable **One-time PIN** as the sign-in method.
7. Set a session duration that fits your workflow, such as a workday or a week.

If you later want separate access tiers, add them in Cloudflare Access with groups or multiple policies. Do not add a custom role system inside Rx Pad unless you really need one.

## What Lives Where

- **Cloudflare Access**: authentication, sessions, allowlist, logout
- **Rx Pad app**: patient workflows, prescriptions, notes, and API routes
- **Repo code**: no custom login page, no password storage, no session table

## Operational Notes

- Add or remove users in Cloudflare Access, not in the application database.
- Keep the allowlist small and explicit.
- Use the same access model for both production and preview if you want consistent behavior.
- If a user is not approved, Cloudflare should stop them before the app loads.

