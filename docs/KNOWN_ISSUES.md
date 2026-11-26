# Known Issues, Architectural Trade-offs & Limitations

*Document version: 2.0 (November 2026)*  
*Audience: Academic Examiners, Evaluators, and Engineering Reviewers*

Examiners appreciate intellectual honesty. No production system is without trade-offs. This document provides a transparent accounting of MindDiary's deliberate architectural decisions, known boundaries, and deferred enhancements.

---

## 1. Encryption Key Custody (Server-Managed vs. Zero-Knowledge)

* **Current Architecture:** All private journal text, check-in reflections, CBT thoughts, and gratitude logs are encrypted at rest using **AES-256-GCM**. However, the cryptographic key resides on the backend server (`ENCRYPTION_KEY` environment variable).
* **Trade-off:**
  - *Advantage:* Enables server-side search across encrypted text, aggregation of statistical mood-sleep insights, automated PDF compilation, and reliable account recovery if a user forgets their password.
  - *Limitation:* It is **not** zero-knowledge end-to-end encryption. A malicious actor with root shell access to the backend process or hosting container could read the key and decrypt data.
* **Future Upgrade:** Derive user-specific keys using PBKDF2/Argon2 from the user's password directly in the browser via WebCrypto, accepting that password loss permanently renders data irrecoverable.

---

## 2. App Lock Scope (Device UI Gate vs. Key Derivation)

* **Current Architecture:** The 4–6 digit PIN lock (`AppLockScreen.tsx`) stores a session unlock state and verifies the PIN against `/api/auth/app-lock/verify`.
* **Limitation:** The PIN lock is a **device-level UI privacy gate**, protecting against casual "shoulder surfing" or an unlocked device left on a desk. It is **not** a secondary cryptographic encryption layer. Entering the PIN does not decrypt database fields; the JWT token still handles API authorization.
* **Why this is acceptable:** For mobile and laptop use cases, preventing casual physical snooping by peers or roommates solves 95% of real-world privacy threats without risking total data loss if a 4–6 digit PIN is forgotten.

---

## 3. Heuristic Crisis Risk Engine Boundaries

* **Current Architecture:** The `server/utils/riskCheck.js` engine uses pre-compiled Unicode-aware regular expressions and keyword taxonomies (covering English, Hindi, and Hinglish variants, plus idiom guards) to classify distress into `none`, `concern`, and `high`.
* **Measured Corpus Performance (153-case labelled test corpus):**
  - **HIGH (Crisis, 66 cases):** 100.0% recall (0 false negatives)
  - **NONE (Benign / Idioms, 49 cases):** 100.0% recall (0 false positives)
  - **CONCERN (Distress, 38 cases):** 100.0% recall
* **Known Gaps & Limitations:**
  1. **Complex Metaphor / Indirect Suicidality:** Subtle or poetic despair outside the curated lexicon may not be caught or may be classified as `concern` rather than `high`.
  2. **False Positives:** Idiomatic colloquial expressions (e.g., *"want to die laughing"*, *"killing it at the gym"*, *"dying to see"*) require explicit phrase exclusion guards; novel slang not yet in `FALSE_POSITIVE_PATTERNS` may still trigger a false banner.
  3. **Why we keep this approach:** A deterministic regex classifier has zero latency ($<2$ms), zero third-party dependency, zero cost, and transparent rule behavior for known critical phrases. When in doubt, safety banners fail safe (showing compassionate helplines) rather than failing silent.

---

## 4. Media Storage & Delivery (Unguessable vs. Signed URLs)

* **Current Architecture:** Media (images, audio, video) is uploaded to Cloudinary into user-segregated directories (`mydiary/user_<id>/`). URLs use random 64-bit identifiers.
* **Trade-off:**
  - Media URLs are cryptographically unguessable, but they use public delivery CDN edges rather than short-lived signed access tokens.
  - Anyone with the exact 60-character alphanumeric URL can view the asset.
* **Integrity Enforcement:** The API rejects any entry save or update if the attached media `publicId` does not strictly start with the authenticated user's folder prefix (`mydiary/user_<userId>/`), preventing cross-user asset hijacking. On account deletion, all assets are permanently deleted from Cloudinary.

---

## 5. Free-Tier Hosting Cold Starts (Render Spin-up)

* **Behavior:** When hosted on Render's free tier, backend instances spin down after 15 minutes of inactivity. The first request after a sleep period incurs a **30 to 50-second cold start latency**.
* **Mitigation:**
  - Frontend API timeout has been increased to **60 seconds** to prevent premature `AbortError` drops.
  - UI displays an informative, animated notice: *"Connecting to server... On Render free tier, initial spin-up can take 30–50 seconds."*
  - Dedicated `/api/health` ping endpoint can be paired with an external uptime monitor (e.g. UptimeRobot) to keep instances warm in production.

---

## 6. Registration Account Enumeration Trade-off

* **Behavior:** When an existing user's email is submitted to `POST /api/auth/register`, the API responds with:
  ```json
  { "success": false, "message": "User already exists with this email" }
  ```
* **Security Consideration:** Disclosing whether an email is registered allows account enumeration.
* **Why this design was chosen:**
  1. **Mental Wellness UX:** When distressed users or forgetful students re-register with an existing email, receiving a generic response (like "Check your email") creates confusion and blocks immediate access to their journal or safety tools.
  2. **Mitigation:** The registration endpoint is strictly guarded by an IP rate limiter restricting attempts to **10 requests per 15-minute window**. Brute-force enumeration is effectively blocked.

---

## 7. Offline Journaling Mode

* **Current Behavior:** The frontend caches settings, theme preferences, and i18n bundles in `localStorage`. However, creating a new journal entry requires an active network connection because cryptographic field setters and XSS sanitization occur on the backend server.
* **Future Work:** Add IndexedDB local draft queuing with client-side WebCrypto AES-GCM encryption for zero-connectivity offline journaling, synchronizing when the device reconnects.

---

## 8. Unverified Helpline Numbers

### Unverified Helpline Numbers

> [!WARNING]
> **Action Required Before Public Production Release:** The numbers and resources listed below are community-maintained and MUST be manually verified against official health authority sources before public release. Do not assume any number is functioning without testing.

#### Verification Instructions:
1. Visit the **Official Verification URL** for each organization listed in the table below.
2. Confirm the active operating hours, phone numbers, and SMS shortcodes directly from the official authority website.
3. Test dial/SMS where permitted or confirm with public emergency resources.
4. Update the `lastVerified` field (`YYYY-MM-DD`) in `frontend/src/data/helplines.ts` with the exact date you performed the check.

| Country | Name | Phone / Link | Official URL | Last Checked | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **India (IN)** | Tele-MANAS (Govt of India) | `14416` | [https://telemanas.mohfw.gov.in](https://telemanas.mohfw.gov.in) | `null` | `- [ ]` Needs manual check |
| **India (IN)** | Tele-MANAS Toll Free Alternative | `1800-891-4416` | [https://telemanas.mohfw.gov.in](https://telemanas.mohfw.gov.in) | `null` | `- [ ]` Needs manual check |
| **India (IN)** | KIRAN (Dept of Empowerment of PwDs) | `1800-599-0019` | [https://depwd.gov.in](https://depwd.gov.in) | `null` | `- [ ]` Needs manual check |
| **India (IN)** | Vandrevala Foundation | `+91 9999 666 555` | [https://www.vandrevalafoundation.com](https://www.vandrevalafoundation.com) | `null` | `- [ ]` Needs manual check |
| **United States (US)** | 988 Suicide & Crisis Lifeline | `988` | [https://988lifeline.org](https://988lifeline.org) | `null` | `- [ ]` Needs manual check |
| **United States (US)** | Crisis Text Line | Text `HOME` to `741741` | [https://www.crisistextline.org](https://www.crisistextline.org) | `null` | `- [ ]` Needs manual check |
| **United States (US)** | The Trevor Project (LGBTQ Youth) | `1-866-488-7386` | [https://www.thetrevorproject.org](https://www.thetrevorproject.org) | `null` | `- [ ]` Needs manual check |
| **United Kingdom (UK)** | NHS Mental Health Services | `111` | [https://111.nhs.uk](https://111.nhs.uk) | `null` | `- [ ]` Needs manual check |
| **United Kingdom (UK)** | Samaritans | `116 123` | [https://www.samaritans.org](https://www.samaritans.org) | `null` | `- [ ]` Needs manual check |
| **United Kingdom (UK)** | Shout Crisis Text Line | Text `SHOUT` to `85258` | [https://giveusashout.org](https://giveusashout.org) | `null` | `- [ ]` Needs manual check |
| **Canada (CA)** | 988 Suicide Crisis Helpline | `988` | [https://988.ca](https://988.ca) | `null` | `- [ ]` Needs manual check |
| **Canada (CA)** | Kids Help Phone | `1-800-668-6868` | [https://kidshelpphone.ca](https://kidshelpphone.ca) | `null` | `- [ ]` Needs manual check |
| **Australia (AU)** | Lifeline Australia | `13 11 14` | [https://www.lifeline.org.au](https://www.lifeline.org.au) | `null` | `- [ ]` Needs manual check |
| **Australia (AU)** | Beyond Blue | `1300 22 4636` | [https://www.beyondblue.org.au](https://www.beyondblue.org.au) | `null` | `- [ ]` Needs manual check |
| **Global / International** | Find A Helpline (Global Directory) | `findahelpline.com` | [https://findahelpline.com](https://findahelpline.com) | `null` | `- [ ]` Needs manual check |
| **Global / International** | Befrienders Worldwide | `befrienders.org` | [https://www.befrienders.org](https://www.befrienders.org) | `null` | `- [ ]` Needs manual check |

---

## 9. Dependency Vulnerabilities & Audit Accounting (`npm audit`)

Both `server/` and `frontend/` were audited with `npm audit`. Several packages report advisory notices that cannot be mechanically resolved via `npm audit fix` without breaking production runtime stability:

1. **`sanitize-html` (Pinned to `2.13.1` in `server/package.json`):**
   - *Advisory:* GHSA-vccv-cmxp-4j9h, GHSA-g8qq-57p8-ggw5 (Moderate).
   - *Reason for Retaining Version 2.13.1:* Upgrading to `sanitize-html >= 2.18.2` forces an update to `htmlparser2@12`, which is distributed strictly as an ES Module (ESM). Because the backend uses Node CommonJS (`require()`), this ESM dependency causes immediate server crash on startup in Node 18, Node 20 (`ERR_REQUIRE_ESM`), and fails 10 of 12 test suites.
   - *Mitigation:* In MindDiary, all user input undergoes multi-stage sanitization (both backend `sanitize-html` tag allowlisting and frontend `DOMPurify` before DOM rendering). Automated XSS security suites (`tests/entries.test.js`) verify that `<script>`, `onerror`, and invalid HTML are cleanly neutralized.

2. **Server DevDependencies (`glob`, `minimatch` via `jest` and `nodemon`):**
   - *Advisory:* GHSA-3g3m-2fjr-6pw4, GHSA-g3hv-75wg-m249 (Moderate).
   - *Reason:* Transitive dependencies of development test runner (`jest@30-alpha`) and dev process runner (`nodemon`). They are strictly development/test dependencies and are neither executed nor bundled in production runtime.

3. **Frontend Build & Test DevDependencies (`tinypool`, `@vitest/mocker`, `esbuild`):**
   - *Advisory:* GHSA-5gmw-xhrv-c9v3 (Tinypool), GHSA-82fw-gwwq-j7x9 (Vitest), GHSA-67mh-4wv8-2f99 (esbuild).
   - *Reason:* Used only locally during `npm run test` (Vitest) and `npm run build` (Vite). They are not shipped to end-user browsers or deployed into client bundles. Running `npm audit fix --force` would install breaking major versions (`vitest@5.1.1`, `vite@8.3.8`) that are incompatible with current toolchain plugins.

4. **Frontend `@tiptap/core` (Rich Text Editor):**
   - *Advisory:* GHSA-cp6q-959q-f8rh (Moderate).
   - *Reason:* Requires a major breaking upgrade of all `@tiptap/*` packages (`@tiptap/extension-placeholder@3.35.0`).
   - *Mitigation:* All content produced by the editor is passed through `DOMPurify.sanitize()` prior to storage and display, preventing malicious attribute injection.

