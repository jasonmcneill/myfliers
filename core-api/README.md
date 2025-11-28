# Core API (Library Catalog Service)

The Core API is the central search index and registry for the MyFliers system.
It acts as a "Library Catalog," storing metadata about fliers hosted on external
sites (like WordPress).

It is a "Headless" service: it has no UI. It speaks JSON.

## Quick Start

Prerequisites: You need Docker installed.

### 1. Run the Service

This command starts the API server on http://localhost:3000.

```sh
# Starts the API (and watches for file changes)
docker compose up --watch
```

### 2. Run the Tests

This starts the test runner in "Watch Mode." It re-runs tests instantly when you
save a file. It also starts the API server, so I would run this command while
you’re developing.

```sh
# Starts the test suite
docker compose --profile test up --watch
```

## How to Interact (The Contract)

We use Bruno as our primary API client and documentation source.

- Location: `core-api/api-design/`

- Setup: Open Bruno, use the local dev environment.

### Example: Register a New Site

This is the main entry point for new plugins/adapters.

Request: `POST /api/v1/sites`

```sh
curl --request POST \
  --url http://localhost:3000/api/v1/sites \
  --header 'content-type: application/json' \
  --data '{
  "siteName": "Test ICC",
  "siteUrl": "https://testicc.org",
  "adminEmail": "testicc@usd21.org",
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAB3R5kkC5Xq0AHmkEA8wpfJ0YG56Psf/jPB1I0ioq/5I=\n-----END PUBLIC KEY-----",
  "adapterMetadata": {
    "adapterType": "wordpress",
    "siteLanguage": "en-US",
    "timezone": "America/Phoenix",
    "wpAdminWhoInstalled": "pastor@usd21.org",
    "pluginInstaller": "tech-guy@gmail.com",
    "wordpressVersion": "1.1.1"
  }
}'
```

Response (Success): `201 Created`

```json
{
  "status": "active",
  "createdAt": "2025-11-27T23:45:52.185Z"
}
```

Note: If the `adminEmail` is not `@usd21.org`, the `status` will be `pending`.

## Architecture & Context

Once you have it running, you can dive into why it works this way.

This service is built using Hexagonal Architecture (Vertical Slices) to keep the
core business logic independent of the HTTP framework.

- Documentation: See `docs/ARCHITECTURE.md` for a deep dive on:

  - The folder structure (`src/core` vs `src/interfaces`).
  - The Security Model (Ed25519 Asymmetric Keys).
  - The Validation Strategy ("Parse, Don't Validate").
