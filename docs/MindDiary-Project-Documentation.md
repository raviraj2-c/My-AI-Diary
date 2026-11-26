# MindDiary: AI-Supported Mental Wellness & Journaling Platform
## Comprehensive Technical Project Documentation & Specification

---

## 1. Executive Summary & System Blueprint

### 1.1 Vision & Clinical Philosophy
MindDiary is a full-stack, privacy-first personal sanctuary designed to bridge the gap between daily expressive writing, holistic wellness tracking, and non-diagnostic emotional reflection. Designed specifically for individuals navigating stress, burnout, and emotional fatigue, MindDiary provides an empathetic digital space that fosters emotional awareness without commodifying user vulnerability.

The core tenets of MindDiary are:
1. **Dignity & Non-Diagnostic Stance:** The application is strictly a self-care and reflective tool. It never provides medical diagnoses, psychiatric evaluations, or pharmaceutical guidance.
2. **Deterministic Safety Architecture:** Whenever severe distress or crisis phrases are detected, high-risk guardrails intercept the interaction deterministically, presenting verified, localized crisis helplines and one-tap emergency contacts.
3. **Cryptographic Privacy at Rest:** All sensitive narrative fields (diary contents, check-in reflections, CBT thoughts, gratitude entries, clinical screening answers, future letters, and coping plans) are encrypted with AES-256-GCM.
4. **Data Sovereignty & Zero AI Training:** User journal entries are never sold, monetized, or fed into public LLM training datasets. Users retain full data ownership with complete export and cascading hard-deletion capabilities.

### 1.2 Technology Stack
- **Frontend SPA:** React 18, TypeScript, Vite, Tailwind CSS, TipTap Rich Text Editor, Lucide Icons, Recharts, jsPDF, react-i18next.
- **Backend API:** Node.js 18+, Express.js 4, Mongoose 7, MongoDB, JWT (JSON Web Tokens), bcryptjs, Helmet CSP headers, Express Rate Limit, DOMPurify / sanitize-html.
- **External Services:** Anthropic Claude (via `@anthropic-ai/sdk`), Cloudinary CDN (media delivery), Nodemailer SMTP.

### 1.3 How to Read This Document
- **Sections 1–3:** Architectural overview, design philosophy, and complete feature catalog.
- **Sections 4–9:** Deep dive into authentication, journaling, wellness tracking, student companion, safety guardrails, and AI reflection engines.
- **Sections 10–13:** Data privacy and field-level encryption, complete 16-collection database schema, comprehensive REST API catalog, and accessibility/internationalization.
- **Sections 14–15:** Environment setup, production deployment guidelines, quality assurance, testing architecture, and known open issues.
- **Section 16:** Academic defense, viva questions, and clinical ethics alignment.

---

## 2. Architecture & Security Model

MindDiary implements a decoupled client-server architecture with defense-in-depth security:

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Tier                           │
│  React 18 + Vite + TypeScript + Tailwind CSS + TipTap Editor│
│  - DOMPurify sanitization    - i18next (en/hi)              │
│  - Offline state handling    - Web Speech voice capture     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Tier                        │
│  - Helmet Content-Security-Policy & Security Headers        │
│  - CORS strict origin whitelist (CORS_ORIGIN / FRONTEND_URL)│
│  - Express Rate Limiter (Auth: 10/15m; General: 100/15m)    │
│  - JWT Bearer Token Authentication & Version Invalidation   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Server                       │
│  - Deterministic Crisis Risk Engine (regex / multi-lingual) │
│  - Field-Level AES-256-GCM Cryptographic Service (enc:v1:)  │
│  - Claude LLM Wrapper with 30 calls/day usage metering      │
│  - sanitize-html server-side XSS filter                     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Database Storage        │ │    Third-Party Services    │
│  MongoDB Atlas (16 models)   │ │  Anthropic Claude API      │
│  Encrypted document fields   │ │  Cloudinary Media Storage  │
│  Strict user-scoped queries  │ │  SMTP Mail Server          │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 3. Complete Feature Catalog

MindDiary includes a rich suite of 14 integrated wellness tools:

1. **Expressive Journaling Core (`/write`, `/entries`):**
   - TipTap WYSIWYG rich text editor with auto-save drafts.
   - Cloudinary photo, video, and audio memo uploads with client-side canvas downscaling.
   - Tag management, emotional tagging, 10-point mood tracking, and favorites/pins.
   - Encrypted search querying titles, tags, and decrypted entries in memory.

2. **Daily Micro Check-In (`/check-in`):**
   - 10-point mood slider, 20+ fine-grained emotional tags.
   - Sleep hours, physical energy (1–5), stress levels (1–5), and optional encrypted reflective notes.

3. **Habit Tracker & Wellness Routines:**
   - Daily logs for meditation, hydration (water glasses), exercise minutes, screen time, and consistent sleep.

4. **Year in Pixels (`/pixels`):**
   - 12 × 31 interactive yearly mood grid providing an immediate visual tapestry of emotional progression.
   - Uses a colorblind-friendly palette and clear legend; empty days display soft neutrals without punitive language.
   - Interactive modal inspection of daily notes and one-click "Download as Image" (canvas to PNG) export.

5. **Letters to Future Self (`/letters`):**
   - Time-capsule letters sealed and scheduled for delivery on a future date ($\ge 1$ day ahead).
   - Strict server-side projection guarantees letter `content` is never returned in API payloads before `deliverOn`.
   - Visual wax-seal design with countdown indicators, delivery notices, and full AES-256-GCM encryption.

6. **Safety Coping Plan (`/settings#coping-plan`):**
   - Interactive, personalized crisis safety plan based on standard clinical templates.
   - Covers personal warning signs, self-soothing coping strategies, safe places, emergency people to contact, and personal reasons to hold on.
   - Encrypted at rest and instantly accessible inside the SOS slide-over sheet.

7. **Ask My Diary (`/ask`):**
   - AI assistant that answers questions using ONLY the user's authentic journal entries.
   - Scans the user's last 500 entries, ranks relevance via Unicode-aware tokenization and recency weighting, and sends only the top 5–8 excerpts to Claude.
   - Transparent citations showing which entries were referenced; refuses to answer if information is not found.

8. **Storybook Library & Reader (`/stories`):**
   - Transform journal entries over a selected date range into an illustrated multi-chapter storybook.
   - Full storybook library to browse, read with a book-like interface, edit titles/chapters, delete, and export as PDF.
   - All chapter contents and generated narratives are fully encrypted at rest with AES-256-GCM.

9. **AI Companion Sanctuary (`/chat`):**
   - Conversational wellness companion powered by Claude with empathetic reflective listening.
   - Attached daily check-in context for personalized continuity.
   - Quota tracking (30 calls/day) and pre-flight crisis intercept.

10. **CBT Thought Challenger (`/ai`):**
    - Step-by-step cognitive distortion identification (Situation $\to$ Automatic Thought $\to$ Evidence For/Against $\to$ Balanced Reframe).

11. **Calm Sanctuary & Grounding (`/calm`):**
    - 4-7-8 Breathing, Box Breathing, 5-4-3-2-1 Sensory Grounding, Progressive Muscle Relaxation, Ambient Nature Soundscapes, and Guided Loving-Kindness.

12. **Student Academic Companion (`/student`):**
    - Exam countdowns, Pomodoro focus timer (25/5), daily small wins checklist, and non-diagnostic burnout early warnings.

13. **Clinical Self-Checks (`/self-check`):**
    - Standardized PHQ-9 (Depression) and GAD-7 (Anxiety) self-screening assessments with longitudinal history.

14. **Expiring Counselor Summary (`/counselor-share`):**
    - 7-day expiring cryptographic token sharing aggregated numerical mood, sleep, and screening metrics with a therapist—strictly omitting personal journal narratives.

---

## 4. Authentication, Authorization & User Management

### 4.1 Registration & Password Security
- Passwords must be 8–72 characters and contain both letters and numbers, hashed via `bcryptjs` with salt cost factor 10.
- Forgot-password flow generates 32-byte crypto-random tokens stored as SHA-256 hashes with 30-minute expiration.
- Password change and logout-all increment `tokenVersion`, instantly invalidating existing JWT tokens across all sessions.

### 4.2 App Lock PIN Screen
- Optional 4-digit PIN stored as a bcrypt hash (`appLockPin`).
- 5 consecutive failed attempts lock the device interface for 5 minutes.
- Verified on the server; PIN recovery requires validating the master account password.

---

## 5. Expressive Journaling Core

- **Rich Text Architecture:** Built with TipTap WYSIWYG editor supporting bold, italic, headings, bullet lists, blockquotes, code blocks, and horizontal rules.
- **Sanitization Pipeline:** Client uses DOMPurify; backend enforces `sanitize-html` allowing only safe tags (`<p>`, `<b>`, `<i>`, `<h1>`, `<h2>`, `<ul>`, `<li>`, `<blockquote>`, `<code>`) and stripping scripts, iframes, and inline event handlers.
- **Media Validation:** Validates file magic bytes (rejects executables disguised as images), enforces 50 MB limits, and verifies that uploaded media paths belong to `mydiary/user_<userId>/`.

---

## 6. Holistic Wellness & Mental Health Tracking

- **Check-In Architecture:** Stores daily ratings for mood (1–10), energy, stress, sleep, and anxiety.
- **Insights Engine:** Requires at least 7 check-ins before computing statistical summaries to prevent premature conclusions.
- **Happy Box:** Curates uplifting entries, gratitude logs, and favorite memories for instant mood elevation.

---

## 7. Student Academic Companion & Burnout Prevention

- **Exam Stress Tracking:** Visualizes days remaining until examinations alongside current stress levels.
- **Burnout Evaluator:** Triggers a gentle, non-alarmist notice if a student logs stress $\ge 4$ on 5 or more of the past 7 days and average sleep $< 6.5$ hours.

---

## 8. Clinical Safety, Crisis Intervention & Emergency Routing

### 8.1 Deterministic Pre-Flight Risk Engine
The risk engine (`server/utils/riskCheck.js`) executes before any external AI call:
- Evaluates English, Hindi, and Hinglish keywords across suicide, self-harm, and hopelessness taxonomies.
- Strips punctuation, diacritics, and character stretching (e.g. *"dieeeee"*, *"mar jaana"*).
- Slang exclusions prevent false positives on phrases like *"killing it at the gym"* or *"dying of laughter"*.

### 8.2 Crisis UI Response
- **Level Concern:** Gentle in-page caring card with listening-ear resources.
- **Level High:** Full-screen modal overlay blocking AI interactions, displaying one-tap helpline call links, trusted contact messaging, and grounding exercises.
- **Helplines Verification:** All helplines include `source` and `lastVerified`. If verification is older than 6 months (>180 days), the UI displays *"Please verify this number"*.

---

## 9. AI Architecture, Safety Guardrails & Quota System

### 9.1 Claude Wrapper & Usage Metering
- SDK client initialized with 25-second timeouts, single retry, and strict daily quota of 30 interactions per user.
- System prompts strictly prohibit diagnosing, prescribing medication, or claiming human consciousness.

### 9.2 Demo AI & Production Availability
- In development/test environments without an Anthropic API key, deterministic simulated responses are returned for testing.
- In production (`NODE_ENV === 'production'`) without `ANTHROPIC_API_KEY`, all AI endpoints return a clean HTTP 503 (`{ "success": false, "message": "AI service is temporarily unavailable." }`).

### 9.3 Storybook Engine & Closed Gaps Analysis
The storybook generator compiles journal entries into thematic multi-chapter narratives.
All previously identified storybook gaps have been resolved:
- **Date Boundary Handling:** Resolved; client creates ISO timestamps using local day boundaries (`00:00:00.000` to `23:59:59.999`) and validates $start \le end$ ($\le 366$ days).
- **Markdown Formatting:** Resolved; chapters render with structured JSX headings and paragraphs instead of raw markdown symbols.
- **Storybook Library Management:** Resolved; complete `/stories` route allows browsing, reading, updating, and deleting generated books.
- **Encrypted Storage:** Resolved; storybook `generatedContent` and each chapter's `content` are encrypted at rest with AES-256-GCM.

---

## 10. Data Privacy, Compliance & Security Analysis

### 10.1 Privacy Commitments
- **Zero AI Training:** User diaries are never used to train foundation models.
- **Data Minimization:** AI calls pass only the immediate active excerpt, never the entire diary history.
- **Right to Erasure:** Deleting an account initiates a cascading delete removing all database records and Cloudinary assets.

### 10.2 Field-Level Encryption Matrix (AES-256-GCM)

| Collection | Encrypted Fields (`enc:v1:`) | Readable / Indexed Fields |
| :--- | :--- | :--- |
| `DiaryEntry` | `content` | `title`, `tags`, `mood`, `moodScore`, `entryDate`, `isFavorite` |
| `CheckIn` | `note` | `moodScore`, `energy`, `stress`, `sleepHours`, `date` |
| `GratitudeEntry` | `items[]` | `date` |
| `ThoughtRecord` | `situation`, `automaticThought`, `rationalAlternative` | `emotion`, `intensity`, `cognitiveDistortions` |
| `SelfCheck` | `answers[]` (JSON string) | `type`, `score`, `severity`, `date` |
| `Storybook` | `generatedContent`, `chapters[].content` | `title`, `theme`, `timeframe`, `protagonist.name`, `createdAt` |
| `FutureLetter` | `content` | `title`, `writtenOn`, `deliverOn`, `openedAt` |
| `CopingPlan` | `warningSigns[]`, `copingStrategies[]`, `safePlaces[]`, `reasonsToKeepGoing[]` | `peopleToContact[].name`, `updatedAt` |
| `Exam` | `notes` | `subject`, `date` |
| `SmallWin` | `tasks[].text` | `dateKey`, `tasks[].completed` |

*Note: Titles, search tags, and numerical metrics are kept readable at the database level to enable high-performance indexing, date queries, and statistical analytics.*

---

## 11. Comprehensive Database Schema Specification (16 Collections)

1. **`User`:** User accounts, credentials (bcrypt), app lock PIN, language (`en` or `hi`), settings, and daily AI quota.
2. **`DiaryEntry`:** Personal journal entries with AES-256-GCM encrypted content.
3. **`CheckIn`:** Daily wellness check-in tracking mood, stress, energy, and sleep.
4. **`HabitLog`:** Daily lifestyle habits (meditation, water, exercise, screen time).
5. **`GratitudeEntry`:** 3-good-things gratitude submissions with encrypted items.
6. **`CalmSession`:** Breathing, grounding, and meditation practice logs.
7. **`SelfCheck`:** Clinical screening results (PHQ-9 and GAD-7) with encrypted responses.
8. **`Exam`:** Academic exam schedule, stress ratings, and encrypted notes.
9. **`StudySession`:** Pomodoro and study tracking logs.
10. **`SmallWin`:** Daily 3-item achievement checklist.
11. **`ThoughtRecord`:** CBT thought restructuring logs with encrypted reframes.
12. **`ChatMessage`:** AI Sanctuary conversation logs with safety flags.
13. **`Storybook`:** Multi-chapter illustrated narratives with encrypted stories.
14. **`CounselorReport`:** 7-day expiring token summary records.
15. **`FutureLetter`:** Sealed time-capsule letters delivered on future dates with encrypted content.
16. **`CopingPlan`:** Personalized safety coping plans with encrypted strategies and safe anchors.

---

## 12. Comprehensive REST API Route Reference

### Authentication & Account (`/api/auth`)
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - User login, returns JWT and user settings
- `GET /api/auth/me` - Current profile and settings
- `PUT /api/auth/settings` - Update user settings (allows only `en` and `hi`)
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout-all` - Invalidate all active user sessions
- `POST /api/auth/app-lock/setup` - Set 4-digit PIN lock
- `POST /api/auth/app-lock/verify` - Verify PIN lock
- `POST /api/auth/app-lock/disable` - Disable PIN lock
- `GET /api/auth/export-data` - Export complete decrypted data archive
- `POST /api/auth/delete-account` - Permanent cascading account deletion

### Diary Management (`/api/diary`)
- `GET /api/diary/entries` - List entries with search and filters
- `POST /api/diary/entries` - Create encrypted journal entry
- `GET /api/diary/entries/:id` - Fetch single entry (ownership enforced)
- `PUT /api/diary/entries/:id` - Update entry (ownership enforced)
- `DELETE /api/diary/entries/:id` - Delete entry (ownership enforced)
- `GET /api/diary/tags` - Distinct user tags
- `GET /api/diary/stats` - Entry counts, streaks, and mood breakdown

### AI Sanctuary & Storybooks (`/api/ai` & `/api/chat`)
- `POST /api/chat/messages` - Send message to Claude AI companion
- `GET /api/chat/messages` - Conversation history
- `DELETE /api/chat/messages` - Clear chat history
- `POST /api/ai/reflect` - Gentle reflection on journal entry
- `POST /api/ai/analyze-mood` - Nuanced emotion suggestion
- `POST /api/ai/challenge-thought` - CBT distortion reframing
- `POST /api/ai/writing-starters` - 3 sentence opening starters
- `POST /api/ai/ask-diary` - Q&A over journal entries with citations
- `POST /api/ai/generate-storybook` - Create multi-chapter storybook
- `GET /api/ai/storybooks` - List user storybooks (metadata only)
- `GET /api/ai/storybooks/:id` - Fetch single storybook with full text
- `PUT /api/ai/storybooks/:id` - Update storybook title/chapters
- `DELETE /api/ai/storybooks/:id` - Delete storybook
- `GET /api/ai/usage` - Daily AI call quota status
- `GET /api/ai/thoughts` - List CBT thought records
- `POST /api/ai/thoughts` - Save CBT thought record
- `DELETE /api/ai/thoughts/:id` - Delete CBT thought record

### Wellness, Pixels & Coping Plan (`/api/wellness`)
- `POST /api/wellness/checkins` - Save daily check-in
- `GET /api/wellness/checkins` - Check-in history
- `GET /api/wellness/checkins/today` - Today's check-in
- `POST /api/wellness/habits` - Log daily habits
- `GET /api/wellness/habits` - Habit history
- `GET /api/wellness/habits/today` - Today's habit log
- `GET /api/wellness/year-pixels` - 12x31 yearly mood grid (`?year=YYYY`)
- `GET /api/wellness/coping-plan` - Get personal safety coping plan
- `PUT /api/wellness/coping-plan` - Save personal safety coping plan
- `POST /api/wellness/gratitude` - Save gratitude entries
- `GET /api/wellness/gratitude` - List gratitude entries
- `GET /api/wellness/gratitude/random` - Random past gratitude memory
- `DELETE /api/wellness/gratitude/:id` - Delete gratitude entry
- `POST /api/wellness/favorites/:id` - Toggle entry favorite
- `POST /api/wellness/pins/:id` - Toggle entry pinned status
- `GET /api/wellness/happy-box` - Aggregated positive memories
- `GET /api/wellness/insights` - Empirical mood and sleep metrics
- `POST /api/wellness/calm-sessions` - Log calming exercise session
- `POST /api/wellness/self-checks` - Save PHQ-9 / GAD-7 screening
- `GET /api/wellness/self-checks` - Clinical screening history
- `POST /api/wellness/counselor-share` - Generate 7-day counselor link
- `DELETE /api/wellness/counselor-share/:token` - Revoke counselor link
- `GET /api/wellness/shared/:token` - Public read-only counselor summary

### Future Letters (`/api/letters`)
- `GET /api/letters` - List letters (content projected only if unlocked)
- `POST /api/letters` - Create future letter (delivery $\ge 1$ day in future)
- `GET /api/letters/:id` - Fetch single letter (returns 403 if still locked)
- `DELETE /api/letters/:id` - Delete future letter

### Student Mode (`/api/student`)
- `GET /api/student/exams` - List upcoming exams
- `POST /api/student/exams` - Add exam date and notes
- `DELETE /api/student/exams/:id` - Delete exam
- `POST /api/student/study-session` - Log Pomodoro study session
- `GET /api/student/study-stats` - Weekly study statistics
- `GET /api/student/burnout-status` - Check burnout indicators
- `GET /api/student/small-wins` - Small wins for date
- `POST /api/student/small-wins` - Save daily small wins

### Uploads & Export (`/api/upload` & `/api/export`)
- `POST /api/upload` - Secure media upload (magic byte validation)
- `DELETE /api/upload/*` - Delete user-owned Cloudinary media asset
- `GET /api/export/entries` - Export journal entries JSON archive
- `GET /api/export/storybook/:id/download` - Download storybook file

---

## 13. Internationalization (i18n) & Accessibility (a11y) Architecture

- **i18next Framework:** Full end-to-end English (`en`) and Hindi (`hi`) translation keys across all screens, modals, empty states, error messages, and ARIA labels.
- **Accessibility:** High contrast compliance (WCAG 2.1 AA), semantic headings, clear focus rings (`focus-visible:ring-2`), and complete keyboard navigation with Escape key dismissals.

---

## 14. Environment Configuration & Production Deployment Guide

### 14.1 Production Startup Checks
On startup in production (`NODE_ENV === 'production'`), the server enforces:
1. `MONGODB_URI` is present.
2. `JWT_SECRET` is present and $\ge 32$ characters.
3. `ENCRYPTION_KEY` is present and exactly 64 hexadecimal characters (32 bytes).
4. `CORS_ORIGIN` or `FRONTEND_URL` is configured.
5. Secret values are never logged or exposed.

### 14.2 Hosting Blueprint
- **Backend:** Render Web Service (Node.js 18 runtime, start: `node server/index.js`).
- **Frontend:** Vercel SPA (Vite preset, build: `npm run build`, output: `dist`).
- **Database:** MongoDB Atlas M0 Free / Serverless Cluster.
- **Storage:** Cloudinary CDN with authenticated user directories.

---

## 15. Quality Assurance, Testing Architecture & Known Issues

### 15.1 Testing Architecture
- **Frontend Tests (Vitest + React Testing Library):** 11 suites, 28 tests verifying component rendering, i18n switching, auth context, SOS buttons, safety banners, and sanitization.
- **Backend Tests (Jest + mongodb-memory-server):** 12 suites, 95 tests verifying ownership isolation across all collections, AES-256-GCM encryption, crisis risk detection, upload magic bytes, and AI quota handling.

### 15.2 Known Open Issues & Architectural Boundaries

| Area | Current Behavior | Open Item / Future Roadmap |
| :--- | :--- | :--- |
| **Offline Journaling** | Client caches theme and settings; creating an entry requires an active network connection. | Add IndexedDB offline draft storage with local encryption sync. |
| **Key Custody** | Encrypted with AES-256-GCM using server-managed `ENCRYPTION_KEY`. | Client-side key derivation (Argon2 / WebCrypto) for zero-knowledge privacy. |
| **Crisis Detection** | Fast, deterministic regex engine covering English, Hindi, and Hinglish keywords. | Incorporate small local on-device transformer models for complex metaphorical distress. |
| **Media Delivery** | Unguessable 64-bit random Cloudinary identifiers in user-scoped folders. | Short-lived signed CDN URLs for media access. |
| **Render Cold Start** | Free tier spins down after 15 minutes of inactivity (30–50s wake-up). | Mitigated with 60s client timeout, visual spin-up notices, and `/api/health` ping monitors. |

---

## 16. Academic Project Defense & Viva Preparation

- **Why AES-256-GCM?** Provides authenticated encryption ensuring both confidentiality and data integrity with tamper detection.
- **Why deterministic crisis checks before calling the LLM?** Eliminates network latency, prevents hallucinated non-caring replies, guarantees localized helpline presentation, and adheres to strict medical ethics.
- **Why are storybook chapters stored encrypted?** Generative storybooks contain derivative reflections of private journal entries and must uphold the same zero-leakage privacy guarantee.
