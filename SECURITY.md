# Security policy

VendKit stores business, customer, and payment data, so security reports are
taken seriously.

## Supported versions

VendKit is pre-1.0. Security fixes are applied to the latest release and the
`main` branch. Older releases may not receive backports.

## Reporting a vulnerability

**Do not open a public issue for a security vulnerability.**

Use GitHub's private vulnerability reporting:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Include the affected version or commit, reproduction steps, impact, and any
   suggested fix.

Please avoid accessing, modifying, or deleting data that does not belong to
you while investigating. We aim to acknowledge reports within three business
days and will coordinate disclosure after a fix is available.

## Scope

Reports are especially useful for:

- Authentication, session, or authorization bypasses
- Access to another user's or business's data
- SQL injection, command injection, or unsafe file handling
- Backup and restore data exposure or integrity issues
- Invoice or CSV data leaking unintended information
- Cross-site scripting or request forgery

Deployment misconfiguration, missing HTTPS, exposed database ports, weak
operator-chosen secrets, and third-party infrastructure are generally outside
this policy.

## Deployment responsibilities

Operators are responsible for:

- Serving the app over HTTPS
- Setting strong, unique `JWT_SECRET`, `API_KEY`, and database credentials
- Keeping the host, database, and application updated
- Restricting direct access to the database and API ports
- Maintaining and testing backups

See the deployment notes in [README.md](README.md).
