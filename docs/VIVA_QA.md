# MindDiary: 32 Viva Examination Questions & Answers

*Updated: November 2026 for Final Project Evaluation*  
*Matches Real Codebase: Express 4, Mongoose 7, Jest + Supertest, Vitest + React Testing Library, AES-256-GCM, Anthropic Claude*

---

### 1. Security & Cryptographic Architecture

**Q1: How are user reflections encrypted at rest, and why did you choose AES-256-GCM?**  
*Answer:*  
All private user journal entries, check-in reflections, gratitude lists, and CBT thought records are encrypted before being written to MongoDB using **AES-256-GCM** (Galois/Counter Mode). We chose GCM because it is an *authenticated encryption* mode. Unlike CBC, GCM computes a 128-bit authentication tag alongside ciphertext using a unique 96-bit (12-byte) initialization vector (IV) per field write. This ensures both absolute **confidentiality** and **tamper detection** (integrity). If a single byte of ciphertext or the IV is manipulated in the database, decryption immediately fails.

**Q2: Where is the encryption key stored, and can the server read the user's data?**  
*Answer:*  
The 256-bit key is managed on the backend server via the `ENCRYPTION_KEY` environment variable. Yes, the server holds the key and decrypts fields on read. This is a deliberate, documented trade-off: it allows server-side search across encrypted entries, generation of wellness insight correlations, automated PDF storybook compilation, and reliable account recovery if a password is forgotten. It protects against database leaks, stolen backups, and multi-tenant unauthorized access, but is not zero-knowledge client-side encryption. We document this honestly in `docs/PRIVACY_AND_ETHICS.md`.

**Q3: How does the 4-digit App Lock PIN work, and what are its cryptographic limits?**  
*Answer:*  
When enabled, the user's 4-digit PIN is hashed using `bcrypt` and verified via `/api/auth/app-lock/verify`. On the frontend, `AppLockScreen.tsx` gates UI access if the app is backgrounded or inactive. Its limitation is that it is a **device-level UI privacy gate**, not a second cryptographic key derivation layer. It protects against casual physical snooping (e.g. roommates or colleagues looking at an open screen), but does not encrypt the underlying database documents.

**Q4: How does MindDiary prevent Cross-Site Scripting (XSS)?**  
*Answer:*  
We apply strict defense-in-depth:
1. **Server-Side Sanitization:** Every entry title and content passes through `sanitize-html` (`server/utils/sanitize.js`), stripping `<script>`, `<iframe>`, `onerror`, `onload`, and all unwhitelisted tags and attributes.
2. **Client-Side Sanitization:** Before rendering rich text in the browser, content is sanitized via `DOMPurify` (`frontend/src/utils/sanitize.ts`).
3. **HTTP Headers:** Helmet applies Content Security Policy (CSP), `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.

**Q5: How does the password reset flow work securely without third-party identity providers?**  
*Answer:*  
When a user requests a reset, `crypto.randomBytes(32).toString('hex')` generates a 256-bit unguessable token. Only the **SHA-256 hash** of this token is stored in MongoDB with a 30-minute expiration (`resetPasswordExpires`). The plaintext token is emailed to the user. When submitted to `POST /api/auth/reset-password`, the incoming token is hashed and matched via constant-time lookup, the new password is encrypted via bcrypt (12 rounds), and both token fields are permanently cleared to prevent replay attacks.

---

### 2. Clinical Safety & Crisis Management

**Q6: What is the Crisis Safety detection system and how is it triggered?**  
*Answer:*  
When any entry, check-in, or chat message is received, `server/utils/riskCheck.js` normalizes the text (collapses repeated characters like *"suuuicide"*, strips punctuation, converts to lowercase) and matches it against calibrated regex patterns in English, Hindi, and Hinglish. It classifies distress into `none`, `concern`, or `high`.

**Q7: What happens when a user submits text with "high" suicide or self-harm risk?**  
*Answer:*  
Three critical safeguards execute:
1. **The external AI (Claude) is NEVER called.** This eliminates latency, hallucination risk, and third-party transmission of acute distress.
2. An immediate, caring response is generated locally (*"I hear how painful things feel right now. You matter, and you do not have to carry this alone..."*).
3. The response payload returns `safety: { level: 'high' }`, which triggers the persistent `SafetyBanner` and `SOSButton` with one-tap, direct-dial phone links to verified national helplines (e.g. Tele-MANAS 14416 or 988). The user's entry is never lost or discarded.

**Q8: How do you handle false positives like "killing it at the gym" or "overdose in the news"?**  
*Answer:*  
In `riskCheck.js`, we implemented explicit false-positive guards. Colloquial phrases (such as *"killing it at the gym"*, *"killer workout"*, *"dying of laughter"*, *"pain killer"*) and third-party media contexts (*"overdose in the news"*, *"article about overdose"*) are explicitly classified as `none`. However, as documented in `KNOWN_ISSUES.md`, complex poetic metaphors remain a boundary where we intentionally choose to fail safe.

**Q9: What are the PHQ-9 and GAD-7 screeners, and why is there a medical disclaimer?**  
*Answer:*  
PHQ-9 (Patient Health Questionnaire-9) and GAD-7 (Generalized Anxiety Disorder-7) are gold-standard clinical self-report questionnaires. MindDiary scores them and logs severity over time. In accordance with ethical digital health standards, MindDiary prominently displays a disclaimer that these tools are strictly for self-reflection and personal awareness, **never a medical diagnosis or substitute for professional psychiatric care**.

---

### 3. AI Architecture & Guardrails

**Q10: Which AI provider is used, and how is it integrated?**  
*Answer:*  
We integrate Anthropic's Claude using `@anthropic-ai/sdk` from the **server only** (`server/services/llmClient.js`). The model name (`AI_MODEL`, defaulting to `claude-3-haiku-20240307`) and `ANTHROPIC_API_KEY` are read strictly from environment variables. The frontend has zero access to AI credentials.

**Q11: What guardrails exist in the AI system prompt (`safetyPrompt.js`)?**  
*Answer:*  
All AI features share a strict system prompt instructing Claude to:
1. Be warm, concise, and reflective in plain language.
2. Ask at most one gentle question and suggest small actions.
3. **NEVER diagnose**, suggest medications or dosages, or claim to be a doctor or therapist.
4. **NEVER encourage self-harm or give method information.**
5. If suicidal ideation is detected, append `[CRISIS_SIGNAL_DETECTED]` so the server can escalate the UI safety level to `high`.

**Q12: How are API costs and runaway usage controlled?**  
*Answer:*  
1. **Daily User Quota:** Each user is capped at **30 AI calls per calendar day**, tracked atomically in the MongoDB user document (`dailyAICalls`, `lastAICallDate`). Excess requests receive a `429 Too Many Requests`.
2. **Token Caps & Timeouts:** Requests enforce a 15-second timeout, 1 retry, and strict `maxTokens` limits (500 tokens for chat, 300 for reflections).

**Q13: How does the AI Storybook feature work?**  
*Answer:*  
Users select a date range and narrative theme (e.g., Adventure, Reflective, Comedy). The backend aggregates the user's diary entries for that window and prompts Claude with a structured JSON schema constraint. If the AI returns invalid or unparseable JSON, the server catches it and returns a clean `502 Bad Gateway` rather than crashing.

---

### 4. Database, Architecture & Multi-Tenancy

**Q14: How is strict multi-tenant isolation enforced in MongoDB?**  
*Answer:*  
Every database collection (`DiaryEntry`, `CheckIn`, `HabitLog`, `Exam`, `SmallWin`, `Storybook`, `ThoughtRecord`) has a required, indexed `user: ObjectId` field. Every single controller query scopes operations strictly by `req.user.id` extracted from the cryptographically verified JWT token. As proven by our comprehensive `ownership.test.js` test suite (10 automated tests), User B receives a `404 Not Found` or `403 Forbidden` if attempting to read, update, or delete User A's data.

**Q15: What indexes are configured in MongoDB for query performance?**  
*Answer:*  
- Compound query indexes: `{ user: 1, entryDate: -1 }` on `DiaryEntry`, `{ user: 1, date: -1 }` on `CheckIn`, and `{ user: 1, dateKey: 1 }` (unique) on `SmallWin`.
- Expiration index: TTL index on reset tokens and counselor report share expiration (`expiresAt`).

**Q16: How does Counselor Summary Sharing preserve privacy?**  
*Answer:*  
Under `/wellness/counselor-share`, the server aggregates only statistical trends (average mood, sleep-mood correlation, PHQ-9/GAD-7 history) into an immutable snapshot referenced by a SHA-256 token hash. **Zero raw diary entries or narrative text are included.** The resulting link (`/shared/:token`) is read-only, sets `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`, expires automatically after 7 days, and can be revoked instantly by the user.

---

### 5. Student Mode & Wellness Mathematics

**Q17: What is Student Mode and how does the Burnout Early Warning work?**  
*Answer:*  
Student Mode (`/student`) provides an exam date countdown, a 25/5 Pomodoro focus timer with breathing prompts, and a daily 3 "Small Wins" checklist. The burnout evaluator (`server/utils/burnout.js`) analyzes check-ins over the last 7 days. If the student reports stress $\ge 4$ on 5 or more days AND average sleep is below 6.5 hours, it flags a gentle, non-alarmist warning recommending rest and campus counseling.

**Q18: What is the "7+ data points" rule in Wellness Insights?**  
*Answer:*  
In `server/utils/insights.js`, the algorithm checks whether the user has at least 7 check-ins. If fewer than 7 check-ins exist, `hasEnoughData` is `false`, and correlation calculations (such as mood lift from sleep) are withheld. This prevents statistically misleading conclusions derived from tiny sample sizes.

**Q19: How is multi-language (Hindi) implemented?**  
*Answer:*  
We configured `react-i18next` with complete translation key parity (200+ keys across English and Hindi in `en.json` and `hi.json`). Navigation menus, check-in prompts, calm breathing cues, and safety banners dynamically update when the language is toggled. An automated check (`npm run i18n:check`) verifies key parity during development and testing.

---

### 6. Testing, CI & Production Deployment

**Q20: What testing framework is used and how are tests organized?**  
*Answer:*  
- **Backend:** `Jest` (with `--experimental-vm-modules`), `Supertest`, and an in-memory MongoDB replica via `mongodb-memory-server`. Tests hit real Express routes and real database collections without needing an external database. There are **9 test suites and 44 passing tests** covering boot, auth, ownership isolation, diary entries, encryption-at-rest, insights math, risk checks, mocked AI endpoints, and account export/deletion.
- **Frontend:** `Vitest` with `@testing-library/react` and `jsdom`. There are **9 test suites and 20 passing tests** covering UI components, accessibility, settings sync, and i18n parity.
- **Total:** **64 tests passed with 0 failures.**

**Q21: How does the Continuous Integration (CI) pipeline work?**  
*Answer:*  
GitHub Actions (`.github/workflows/ci.yml`) runs on Node 20 and Node 22 for all pushes and PRs to `main`. It installs dependencies, runs frontend ESLint, executes frontend Vitest tests, runs backend Jest tests against MongoDB Memory Server, and compiles the production Vite bundle.

**Q22: How can users delete their account under GDPR / DPDP right-to-erasure?**  
*Answer:*  
`POST /api/auth/delete-account` requires the user's password. Once verified, it deletes the user's Cloudinary media assets and performs a cascading `deleteMany` across all 12 MongoDB collections, leaving zero orphaned personal data.

**Q23: How do you handle cold starts on free-tier hosting (e.g. Render)?**  
*Answer:*  
Render spins down free containers after 15 minutes of inactivity, resulting in a 30-50 second wake-up delay. We handled this by:
1. Extending API client timeout to 60 seconds (`TIMEOUT: 60000`).
2. Adding a responsive loading message in `App.tsx`, `LoginForm`, and `SignUpForm` after 3.5 seconds informing the user that the server is waking up.
3. Exposing `/api/health` so external uptime monitors can ping the server periodically.
