# Core API Architecture Guide

This guide details the architectural decisions, security models, and validation
strategies used to build the Core API service. It explains the reasoning behind
the codebase's design.

## 1. High-Level Design: Hexagonal & Hybrid

We organized this project using a Hybrid Architecture. We combined "Vertical
Slicing" (grouping code by feature) with "Ports & Adapters" (keeping our
business logic safe from HTTP details).

We chose this separation so our Core Logic is testable in isolation. It also
means if we ever need to add a CLI or a Queue Worker later, we can just "plug it
in" without rewriting a single line of business logic.

### Directory Structure

- `src/core/` (The Domain): This is where our pure business logic lives. It
  contains Services, Types, Custom Errors, and Repository Interfaces. Crucially,
  this folder has zero dependencies on delivery frameworks like Express. We do,
  however, make an exception for Zod, because we want input validation rules to
  be the same for every interface.

  - `src/core/common/`: Utilities used across the domain (like crypto.ts and
    make-safe.ts).

  - `src/core/sites/`: The feature-specific logic.

- `src/interfaces/` (The Interface): This is where we handle the outside world.
  It contains our Express App setup, Controllers, and Routers.

  - `src/interfaces/http`: This is where all the code belonging to the HTTP
    interface belongs.

## 2. Feature Walkthrough: Site Registration (POST /sites)

To understand how data flows through the system, we examine the Site
Registration feature. This is the entry point for external adapters (like
WordPress plugins).

### The Request Flow

1. HTTP Request: The client sends a JSON payload to POST `/api/v1/sites`.

2. Controller (Interface): The controller (`site.controller.ts`) catches the
   request. It does not validate data itself. It just passes the raw body
   straight to the Service.

3. Safe Wrapper (The Boundary): We wrapped the Service method in a `makeSafe()`
   utility. This automatically runs our Zod schema validation before any
   business logic can execute. It’s our safety guard.

4. Service (Core):

- This is where we make decisions (`site.service.ts`). We check the `adminEmail`
  to determine if the site should be `active` (for trusted domains) or
  `pending`.

- Then, we call the Repository Port to save it.

5. Repository (Adapter): Finally, the repository generates the UUID and saves
   the data to storage.

### Security & Validation

We follow a "Parse, Don't Validate" philosophy. Instead of checking if data is
good inside our logic, we parse it into a strictly typed structure at the door.
If it's malformed, we reject it immediately.

- Zod Schema: An example is defined in `src/core/sites/site.validation.ts`,
  acting as a source of truth for what valid site input looks like.

- Cryptographic Validation: We use `src/core/common/crypto.ts` to enforce strict
  key requirements:

  - Format: We check that it's a valid PEM string
  - Algorithm: We strictly require Ed25519 keys. We reject RSA/EC/DSA keys to
    prevent algorithm substitution attacks.

### Asymmetric Authentication (Ed25519)

We chose Asymmetric Keys instead of API Keys (HMAC) to avoid the "Shared Secret
Problem."

- Registration: The client generates an Ed25519 key pair

- Request Verification: For future requests, the client signs the payload with
  their Private Key. We verify it using the stored Public Key.

- Why we did this: If our database ever gets compromised, the attacker only
  finds Public Keys. They can't impersonate our clients because they don't have
  the Private Keys.

## 3. How We Test

We use a pyramid testing strategy powered by vitest to make sure everything
works, from the logic to the HTTP response.

### Unit Tests (Domain Logic)

- Target: SiteService (`src/core/sites/site.service.test.ts`).

- Approach: We run these against an In-Memory Repository. This lets us verify
  our business rules (like the status assignment logic) instantly, without
  needing a real database connection or messy mocks.

### Integration Tests (HTTP Layer)

- Target: Express Application
  (`src/interfaces/http/routes/sites/site.router.test.ts`).

- Approach: We use supertest to spin up the actual Express app in memory and
  send real HTTP requests. This tests the wiring: Does the Controller talk to
  the Service? Do we get the right 201 or 400 status codes?

## 4. Repository Pattern & Identity

- UUID Generation: We generate UUIDs in the Application Layer (Node.js), not the
  Database. This gives us a predictable return object and makes our code
  portable across databases like MySql and SQLite, which handle IDs differently.

- Reference Isolation: In our In-Memory Repository, we use `structuredClone()`
  when saving and retrieving objects. This simulates a real network gap,
  ensuring that modifications to a returned object do not inadvertently mutate
  the "stored" data in our fake database.
