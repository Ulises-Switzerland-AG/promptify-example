# Promptify security model

Binding for every agent and contributor. Terms follow [GLOSSARY.md](./GLOSSARY.md). Any change that weakens a rule here needs explicit approval from the project owner.

## 1. Scope and assumptions

- Internal application; Prompt content is classified **Internal** (not public, not indexable).
- Prompts are free text. The UI warns Users not to include secrets or personal data; there is no automated scanning.
- Out of scope: sign-in, MFA and session lifetime (owned by Entra ID / Easy Auth), network hardening beyond the rules below.

## 2. Authentication and identity

- Easy Auth is set to **Require authentication**; anonymous requests are rejected (HTTP 401 for API/Server Action calls). The app implements no login.
- The App Service must have no unauthenticated path to the app (no public slots, no alternative hostnames without Easy Auth).
- Every **User** in the Entra tenant may access Promptify, **except guests**: the app registration is single-tenant. Entra must be configured to emit the optional `acct` claim; the app rejects the principal unless `acct` is exactly `0` (member). A missing, malformed or any other value is rejected. Do not rely on `userType` (not a token claim).
- The identity is read **only on the server** from the Easy Auth principal (`X-MS-CLIENT-PRINCIPAL`), never from client-supplied data. The stable key is the `oid` claim, not email or name.
- **Fail closed:** a missing, malformed or non-member principal yields 401/403. Trusting these headers is safe only because of the no-bypass rule above; never add a code path that accepts them in a deployment without Easy Auth. Local development uses an explicit dev-only stub, disabled when `NODE_ENV=production`.

## 3. Authorization

| Action | Who |
| --- | --- |
| View Prompts, Categories | Any User |
| Create Prompt | Any User (becomes its Author) |
| Edit Prompt | Author only (Administrators cannot edit others' Prompts) |
| Delete Prompt | Author or Administrator (physical delete) |
| Manage Categories | Administrator |
| Promote / demote Administrator | Administrator |

- All Prompts are visible to all Users; there are no private Prompts or drafts.
- Authorization is enforced **on the server**, on every read/write, including Server Actions and Route Handlers. UI hiding is never a control. Authorship is derived from the authenticated `oid`, never from a request field.
- Mutating operations are never exposed through GET. The one exception is identity provisioning: resolving the authenticated principal creates the User row on first sight and refreshes its display name when it changed (`resolveUser`). It only ever touches the caller's own row, derives it from the server principal, and never writes the Administrator flag.

## 4. Administrator role

- Stored as a flag in the database (not in Entra).
- The first Administrator is created by a seed script run from the pipeline (by `oid`); never through the UI or an open endpoint.
- Only an Administrator can change another User's flag. The last remaining Administrator cannot be demoted (enforced server-side, atomically).
- Every assignment of the Administrator role to a User is logged (who, to whom, when) as an Application Insights event. This is privilege escalation and is always logged.

## 5. Input, output and content

- Prompt content is rendered as **plain text**, always escaped. Never use `dangerouslySetInnerHTML` or render user content as HTML/Markdown.
- Every server entry point validates input with a schema (types, lengths, IDs, Category from the closed list) before touching the database.
- Database access is only via Prisma; no raw SQL built from user input (`$queryRawUnsafe` / `$executeRawUnsafe` are forbidden; tagged-template raw queries only if unavoidable).

## 6. Secrets and database access

- SQL Server is accessed with a **SQL Login** whose credentials live in **Azure Key Vault**, referenced from App Service settings via Key Vault references (read through the App Service Managed Identity). Secrets are never committed (no real values in the repo, `.env*` ignored except an example without values) and never logged.
- The runtime login has only `SELECT/INSERT/UPDATE/DELETE` on the application tables, no DDL and no `db_owner`. Schema migrations use a different login, available only to the deployment pipeline.
- Rotation is manual: at least yearly and immediately on suspected exposure.

## 7. Logging and audit

- Audit and security logging goes to **Application Insights**. For now, the only audited event is the assignment of the Administrator role to a User. Prompt deletes, Category changes and authorization denials are deliberately **not** audited (project owner decision, to be revisited).
- Events record actor `oid`, action, target id and timestamp. **Never log Prompt content** or tokens/secrets.
- Administrator role assignments are always logged (see §4).

## 8. Change checklist (for agents)

Before finishing any change, verify: server-side authz on every new read/write; identity from the server principal only; input validated; no HTML rendering of user content; no secrets in code/logs; new dependencies are justified.
