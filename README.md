# MindDiary 🌿

> A private, AI-supported journal for mental wellness, gentle self-reflection, and inner calm.

MindDiary is a full-stack personal diary and emotional sanctuary application that helps users record thoughts, track daily habits, practice guided mindfulness, complete clinically-validated screening self-checks, and securely store memories with authenticated encryption.

> [!IMPORTANT]
> **Wellness & Safety Disclaimer:** MindDiary is designed as a supportive self-reflection and emotional wellness companion. It is **not** a healthcare provider, therapy service, or clinical diagnostic emergency tool. If you are experiencing immediate danger or acute distress, please contact national helplines or trusted medical professionals immediately.

---

## 🏗️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS, TipTap Editor, date-fns, jsPDF, Lucide React, React Router 7
- **Backend:** Node.js, Express 4, Mongoose 7, MongoDB
- **Security & Privacy:**
  - **Encryption at Rest:** AES-256-GCM cipher with random IV and authentication tag (`server/utils/encrypt.js`)
  - **App Lock:** 4-6 digit passcode with bcrypt hashing, inactivity timeouts, and 5-attempt/60s lockout freeze
  - **Sanitization:** `sanitize-html` (backend content sanitization), `dompurify` (frontend XSS protection), `helmet`, `express-rate-limit`, `bcryptjs`, `validator`
  - **Crisis Signals:** In-memory non-logging keyword/phrase scanner (English, Hindi, Hinglish) returning immediate compassionate support banners
- **Deployment:** Vercel (Frontend), Render (Backend), MongoDB Atlas (Database), Cloudinary (Media)

---

## 📁 Project Structure

```text
My-AI-Diary/
├── frontend/                     # React 18 + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/             # LoginForm, SignUpForm, ForgotPassword
│   │   │   ├── common/           # Layout, Sidebar, MobileBottomBar, SOSButton, AppLockScreen, Modal, Toast
│   │   │   ├── Diary/            # DiaryEditor, DiaryEntry, DiaryList, CalendarView, MediaUploader, VoiceInput
│   │   │   ├── Export/           # StorybookExport
│   │   │   ├── Search/           # SearchBar, FilterPanel
│   │   │   ├── Settings/         # UserSettings, PrivacySettings
│   │   │   └── Wellness/         # SafetyBanner, BreathingCircle, SoundPlayer, CheckIn
│   │   ├── config/               # api.ts (centralized API client with 401 handling)
│   │   ├── contexts/             # AuthContext.tsx, DiaryContext.tsx
│   │   ├── data/                 # helplines.ts, questionnaires.ts (PHQ-9, GAD-7)
│   │   ├── hooks/                # useDiary.ts, useSettings.ts, useSpeechToText.ts, useReminders.ts
│   │   ├── pages/                # Dashboard, DiaryPage, CalmPage, SelfCheckPage, PrivacyPage, InsightsPage, etc.
│   │   ├── services/             # authService, diaryService, wellnessService, uploadService, aiService
│   │   ├── types/                # index.ts (TypeScript interfaces)
│   │   └── utils/                # sanitize.ts, moods.ts, soundSynth.ts (Web Audio synthesis)
│   ├── .env.example              # Frontend environment template
│   ├── .env.development          # Local development environment defaults
│   ├── package.json
│   └── vite.config.ts
├── server/                       # Express + MongoDB backend
│   ├── config/
│   │   ├── cloudinary.js         # Cloudinary SDK client
│   │   ├── database.js           # Mongoose connection setup
│   │   └── models.js             # User, DiaryEntry, CheckIn, HabitLog, GratitudeEntry, CalmSession, SelfCheck
│   ├── controllers/
│   │   ├── aiController.js       # Storybook generator handlers
│   │   ├── authController.js     # Register, Login, Me, Settings, AppLock, Export, DeleteAccount
│   │   ├── diaryController.js    # CRUD, search, tags, stats, streaks, safety risk checks
│   │   ├── exportController.js   # JSON export & download tracking
│   │   ├── uploadController.js   # Cloudinary image/video/audio uploads & deletion
│   │   └── wellnessController.js # Check-in, habits, gratitude, calm logs, self-checks, insights
│   ├── data/
│   │   └── riskKeywords.js       # Curated crisis & concern keyword/phrase dictionary
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── errorHandler.js       # Centralized error & CORS handler
│   ├── routes/
│   │   ├── ai.js                 # /api/ai endpoints
│   │   ├── auth.js               # /api/auth endpoints (rate-limited)
│   │   ├── diary.js              # /api/diary endpoints
│   │   ├── export.js             # /api/export endpoints
│   │   ├── upload.js             # /api/upload endpoints
│   │   └── wellness.js           # /api/wellness endpoints
│   ├── scripts/
│   │   └── encryptExisting.js    # AES-256-GCM migration script for legacy entries
│   ├── services/
│   │   └── aiService.js          # Narrative storybook synthesis
│   ├── utils/
│   │   ├── encrypt.js            # AES-256-GCM encryption & decryption helpers
│   │   ├── riskCheck.js          # Crisis & hopelessness text evaluator
│   │   ├── insights.js           # Deterministic wellness statistics & correlations
│   │   └── validate.js           # Input validation and regex escaping helpers
│   ├── .env.example              # Server environment template
│   ├── index.js                  # Server entry point
│   └── package.json
├── package.json                  # Root monorepo workspace scripts
└── README.md
```

---

## 🔒 Privacy & Encryption at Rest

MindDiary encrypts sensitive text fields (`DiaryEntry.content`, `DiaryEntry.media[].caption`, `CheckIn.note`, `GratitudeEntry.items`, `ChatMessage.content`, `ThoughtRecord.situation/thought/balancedThought`, `Storybook.generatedContent/chapters`, `SelfCheck.answers`, `Exam.notes`, `SmallWin.tasks[].text`) using **AES-256-GCM**:

1. **Format:** Ciphertext is saved in MongoDB prefixed with `enc:v1:` containing the initialization vector (IV), encrypted data, and authentication tag.
2. **Key Storage:** The master key is read from `server/.env` via `ENCRYPTION_KEY` (32 bytes hex or string).
3. **Legacy Migration:** Run `node server/scripts/encryptExisting.js [--dry-run] [--collection=<name>]` to safely encrypt pre-existing plaintext records with zero downtime.
4. **Search Implementation:** Because AES-256-GCM produces randomized ciphertext, MongoDB cannot perform `$regex` lookups on encrypted text. MindDiary queries `title` and `tags` at the database level, and decrypts the authenticated user's records in-memory (capped at 500 recent entries) to perform full-text matching.
5. **Media Storage:** Media attachments are stored on Cloudinary in user-isolated folders (`mydiary/user_<id>/`) with cryptographically random unguessable URLs. They use standard CDN delivery (not authenticated signed tokens). Media is purged via Cloudinary's Admin API when an entry or account is deleted.
6. **Token Lifetime & Revocation:** JWTs default to 24-hour expiration. An incrementing `tokenVersion` on each user account immediately invalidates all active sessions upon password reset or change.
7. **Rate Limiting:** Auth endpoints are strictly throttled to 10 requests per 15 minutes per IP; authenticated API endpoints are keyed by user ID with high burst allowances.

> [!WARNING]
> **Key Loss Risk:** If `ENCRYPTION_KEY` is lost or overwritten, encrypted journal entries cannot be decrypted or recovered by anyone. Always securely back up your `ENCRYPTION_KEY`.
>
> **Security Transparency:** Encryption at rest protects database dumps and storage backups. During an active authenticated user session, the server runtime possesses the decryption key to deliver entries to the client.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance running on `localhost:27017` or MongoDB Atlas URI)

### 1. Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/your-username/My-AI-Diary.git
cd My-AI-Diary
npm run install:all
```

### 2. Environment Configuration

#### Backend (`server/.env`)

Copy `server/.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

Key variables:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend port | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/mydiary` |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | *(32+ char secret string)* |
| `JWT_EXPIRES_IN` | Token expiration period | `7d` |
| `ENCRYPTION_KEY` | 32-byte AES key (64 hex characters) | *(Generated hex key)* |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name (optional for media) | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_api_secret` |

To generate a secure 32-byte hex encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Frontend (`frontend/.env.development`)

Preconfigured defaults:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Running Locally

```bash
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧭 Crisis Safety & Helplines

MindDiary provides an **SOS button** on every view and automated compassionate safety banners:
- **Verified Helplines:**
  - **India:** Tele-MANAS (`14416` / `1800-891-4416`), KIRAN (`1800-599-0019`), Vandrevala Foundation (`9999 666 555`)
  - **USA & Canada:** Suicide & Crisis Lifeline (`988`)
  - **United Kingdom:** NHS Mental Health (`111`), Samaritans (`116 123`)
  - **Australia:** Lifeline (`13 11 14`)
  - **International:** Find A Helpline (`https://findahelpline.com`)
- **Trusted Contact:** Users can store a single emergency contact (Name, Phone, Relation). MindDiary **never** contacts anyone automatically; clicking opens the native phone dialer or SMS application.
- **Safety Policy:** Crisis keywords are never persisted to the database and never transmitted to external services.

---

## 📊 Automated Verification & Lighthouse Audit

### Automated Test Suites
Unlike legacy mocks, all tests run against **real Express routes, real MongoDB schemas (via in-memory replica), and real React components**:

* **Backend Test Suite (`Jest` + `Supertest` + `mongodb-memory-server`):**
  - **19 Test Suites**, **217 Tests Passed** (100% pass rate)
  - Suites: `securityHardening` (19), `ownership` (12), `threeFeatures` (9), `ai` (22), `auth` (16), `passwordAndAppLock` (5), `aiHardening` (13), `askDiary` (13), `elevenFixes` (12), `encryption` (9), `timezone` (12), `partL` (9), `entries` (7), `upload` (6), `accountExport` (2), `riskCheck` (8), `modules` (36), `boot` (3), `insights` (4).
* **Frontend Test Suite (`Vitest` + `@testing-library/react` + `jsdom`):**
  - **14 Test Files**, **45 Tests Passed** (100% pass rate)
  - Suites: `sanitize` (5), `EmotionWheel` (3), `CheckIn` (1), `SafetyBanner` (4), `SOSButton` (6), `AppLockScreen` (2), `useSettings` (3), `AuthContext` (2), `authSafeguards` (4), `i18n` (1), `i18nComplete` (6), `storage` (2), `newFeatures` (3), `DiaryEntryReflect` (3).
* **Total Automated Tests:** **262 tests passed, 0 failures, 0 skipped**.

### Real Lighthouse Production Audit
Generated via headless Chrome audit against production preview build ([view HTML report](docs/lighthouse/report.report.html)):

| Category | Score | Real Audit Metric |
| :--- | :---: | :--- |
| **Performance** | **99 / 100** | First Contentful Paint: 0.9s, Speed Index: 1.1s, Largest Contentful Paint: 1.2s |
| **Accessibility** | **92 / 100** | High contrast text, ARIA roles, keyboard focus outlines |
| **Best Practices** | **100 / 100** | HTTPS-ready, modern ES modules, zero console errors |
| **SEO** | **82 / 100** | Viewport meta, document title, legible font sizing |

---

## 📋 Features: Done / Partly Done / Future

| Feature Area | Status | Honest Implementation Scope & Architecture |
| :--- | :---: | :--- |
| **AES-256-GCM Encryption at Rest** | ✅ **Done** | Title, content, check-in notes, gratitude items, and thoughts encrypted before writing to MongoDB. |
| **Dual-Layer XSS Sanitization** | ✅ **Done** | Server-side `sanitize-html` tag whitelist + client-side `DOMPurify` before DOM insertion. |
| **Crisis Safety Guardrail** | ✅ **Done** | Local `checkRisk` regex scanner. **External LLM is NEVER called on high distress.** Verified national helplines surfaced with direct dial links. |
| **Student Mode & Burnout Alert** | ✅ **Done** | Exam countdown, 25/5 Pomodoro timer, 3 daily Small Wins, and non-diagnostic burnout threshold alert (stress $\ge 4$ on 5+ days + low sleep). |
| **Calm Space & Grounding** | ✅ **Done** | 4-7-8 and Box breathing SVG animated pacing, ambient Web Audio synthesis, 5-4-3-2-1 grounding. |
| **Year in Pixels Mood Grid** | ✅ **Done** | 12x31 yearly pixel grid mapping daily check-in mood scores with canvas PNG download and direct day entry linking. |
| **Letters to Future Self** | ✅ **Done** | Time-capsule letters encrypted at rest (`enc:v1:`). Server-side projection enforces content is completely hidden until delivery date. |
| **Personal Safety Coping Plan** | ✅ **Done** | User-defined coping strategies, warning signs, contacts, safe places, and reasons to keep going. Encrypted at rest and surfaced in SOS modal. |
| **Ask My Diary (RAG Companion)** | ✅ **Done** | Answers user questions strictly based on decrypted personal entries with date phrases, Unicode Hindi matching, and citation badges. |
| **Storybook Library & Reader** | ✅ **Done** | Multi-chapter narrative story generation, paginated book-style reader, read-aloud TTS, chapter editing, and single-day boundary coverage. |
| **"Reflect with me" Diary Button** | ✅ **Done** | In-situ gentle AI reflection and question under saved entries with loading spinner, AI-off settings link, 429 quota friendly text, and crisis safety interception. |
| **Clinical Screeners & Trend Chart** | ✅ **Done** | Evidence-based PHQ-9 and GAD-7 screening questionnaires with lazy-loaded Recharts score trend chart and clinical non-diagnostic disclaimers. |
| **Multi-Language UI (EN / HI)** | ✅ **Done** | Complete translation key parity (200+ keys) between English and Hindi via `react-i18next`. |
| **Counselor Summary Sharing** | ✅ **Done** | 7-day expiring token link showing **only** statistical averages and scores; **zero raw diary text is exposed**. |
| **Data Export & Right to Erasure** | ✅ **Done** | One-click JSON backup export; password-verified account deletion cascading across all 16 MongoDB collections and Cloudinary. |
| **Automated Test Coverage & CI** | ✅ **Done** | 262 tests across Jest (217) and Vitest (45); GitHub Actions workflow for Node 20/22 with lint, type-check, test, and build. |
| **Demo Seeder & Script** | ✅ **Done** | `npm run seed:demo` generates 30 days of realistic reflections and trends for viva evaluation. |
| **Media Delivery** | 🟡 **Partly Done** | Files upload to user-scoped folders (`mydiary/user_<id>/`) with random unguessable IDs, but deliver over public CDN URLs rather than signed tokens. |
| **App Lock Scope** | 🟡 **Partly Done** | 4-digit PIN lock provides a device-level UI privacy gate against physical snooping, but is not a second cryptographic key derivation layer. |
| **Key Custody Architecture** | 🟡 **Partly Done** | Encryption key is managed by backend server in environment variables (database-at-rest protection), not zero-knowledge client derivation. |
| **Client-Side Zero-Knowledge Encryption**| 🔮 **Future** | Derive encryption keys from user master password via WebCrypto PBKDF2/Argon2 directly in the browser. |
| **Offline Journaling Support** | 🔮 **Future** | Service Worker draft queue with IndexedDB local encryption syncing upon reconnection. |
| **Native Push Notifications** | 🔮 **Future** | Progressive Web App (PWA) push notifications for daily reflection reminders. |

---

## 🎓 5-Minute Examiner Demo Walkthrough Order

For project evaluation and viva examinations, present the application following this structured 5-minute flow:

1. **Minute 1: The Sanctuary (Dashboard & Aesthetic):**
   - Log into the app. Point out the calm color palette, dark mode toggle, and privacy reassurance.
   - Show the **Daily Affirmation** card and the **Soundtrack for Your Mood** (demonstrate clicking YouTube/Spotify search without copyrighted media).
   - Complete a quick **10-Second Wellness Check-In** (slider for mood 1-10, sleep, stress tags).

2. **Minute 2: Expressive Journaling & Safety Guardrail:**
   - Navigate to `/write`. Demonstrate TipTap rich text, audio dictation via Web Speech API, and uploading an image (mentioning automatic 1600px canvas compression).
   - Type a gentle, expressive entry and save it.
   - Explain the **Crisis Safety Filter** (`riskCheck.js`): explain that if acute distress or self-harm keywords in English or Hinglish are entered, the system saves the entry safely while presenting an immediate compassionate support card with localized emergency hotlines (e.g. Tele-MANAS 14416 or 988).

3. **Minute 3: Student Mode & Academic Balance:**
   - Open `/student`.
   - Show the **Exam Countdown Tracker** with scheduled exams and days remaining.
   - Start the **Pomodoro Flow Timer** (25m study / 5m break) and explain the gentle break prompts.
   - Show the **Burnout Early Notice**: explain how deterministic evaluation (5+ days with stress $\ge 4$ and sleep $< 6.5\text{h}$) triggers a non-diagnostic, compassionate suggestion to rest.
   - Check off an item in **Today's 3 Small Wins**.

4. **Minute 4: Ethical AI & Clinical Self-Checks:**
   - Open `/self-check` to show validated **PHQ-9** and **GAD-7** screening tests.
   - Open `/chat` or use the **CBT Thought Challenger** (`/ai/thoughts`): show Situation $\to$ Automatic Thought $\to$ Evidence Examination $\to$ Balanced Reframing.
   - Emphasize the AI guardrails: strict daily quota (max 30 requests/day), warm non-diagnostic tone, and absolute zero training on user diaries.

5. **Minute 5: Privacy Sovereignty & Counselor Summary Sharing:**
   - Go to Insights and click **Share Summary with Counselor**: generate a 7-day expiring link.
   - Open the link in an Incognito window (`/shared/:token`): show that the therapist sees **only** numerical averages, screening scores, and sleep-mood correlations; **zero personal diary text is exposed**.
   - Show `docs/PROJECT_REPORT_OUTLINE.md`, `docs/API.md`, `docs/VIVA_QA.md`, and run `npm test` and `npm run test:frontend` in the terminal to demonstrate all 262 automated tests passing across Jest (217) and Vitest (45).

---

## 🌐 Production Deployment Guide

### 1. Database (MongoDB Atlas)
- Create a free M0 cluster on MongoDB Atlas.
- In Network Access, allow your deployment server IPs (or `0.0.0.0/0` with strong password authentication).
- Set `MONGODB_URI` in your production environment variables.

### 2. Backend (Render / Railway / Heroku)
- Connect repository and set root directory to `server`.
- Build command: `npm install`
- Start command: `node index.js`
- Set required environment variables:
  - `NODE_ENV=production`
  - `PORT=5000`
  - `JWT_SECRET` (at least 32 characters)
  - `MONGODB_URI`
  - `ENCRYPTION_KEY` (32 bytes hex)
  - `FRONTEND_URL` (your deployed Vercel domain)
  - `ANTHROPIC_API_KEY` (Claude API key)
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 3. Frontend (Vercel / Netlify)
- Connect repository and set root directory to `frontend`.
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables:
  - `VITE_API_URL=https://your-backend-app.onrender.com/api`

---

## 📄 Academic Documentation References

- [Project Report Outline](docs/PROJECT_REPORT_OUTLINE.md)
- [REST API Reference](docs/API.md)
- [30 Viva Examination Questions & Answers](docs/VIVA_QA.md)
- [Classmate Usability Survey Form](docs/SURVEY_FORM.md)

---

## 📄 License

MIT License. Designed and maintained for college project research and mental wellness companion development.
