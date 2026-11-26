# MindDiary Backend REST API Documentation

Base URL: `http://localhost:5000/api` (Production: configurable via `VITE_API_URL` / `API_BASE_URL`)  
Authentication: Bearer Token in `Authorization` header (`Authorization: Bearer <JWT_TOKEN>`)  
Security Headers: `Helmet`, `CORS`, `no-store` on sensitive routes, `X-Robots-Tag: noindex, nofollow` on reports.

---

## 1. System Health

### `GET /api/health`
* **Auth:** None (Public)
* **Headers:** `Cache-Control: no-store`
* **Response (200):**
```json
{
  "status": "ok",
  "service": "minddiary-server",
  "timestamp": "2026-11-19T08:00:00.000Z",
  "database": "connected"
}
```

---

## 2. Authentication & Account Management (`/api/auth`)

Rate Limit on Auth: 10 requests per 15 minutes per IP (`429 Too Many Requests`).

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user (18+). Body: `{ name, email, password, ageConfirmed: true }` |
| `POST` | `/api/auth/login` | Public | Sign in user. Body: `{ email, password }` |
| `GET` | `/api/auth/me` | User | Get current authenticated profile & settings |
| `PUT` | `/api/auth/settings` | User | Sync user settings `{ theme, fontSize, fontFamily, language, country, trustedContact, allowAIFeatures }` |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset email. Body: `{ email }` |
| `POST` | `/api/auth/reset-password` | Public | Reset password with token. Body: `{ token, newPassword }` |
| `POST` | `/api/auth/change-password`| User | Update password. Body: `{ currentPassword, newPassword }` |
| `POST` | `/api/auth/logout-all` | User | Invalidate all active tokens (increments tokenVersion) |
| `POST` | `/api/auth/app-lock/setup` | User | Enable 4–6 digit PIN lock. Body: `{ pin, password }` |
| `POST` | `/api/auth/app-lock/verify` | User | Verify PIN lock. Body: `{ pin }` |
| `POST` | `/api/auth/app-lock/disable`| User | Disable PIN lock. Body: `{ password }` |
| `GET` | `/api/auth/export-data` | User | Export complete decrypted backup JSON archive |
| `POST` | `/api/auth/delete-account` | User | Hard delete account & all collections. Body: `{ password }` |

---

## 3. Diary Entries (`/api/diary`)

All private entry fields (`title`, `content`, `location`) are encrypted at rest with AES-256-GCM.

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/diary/entries` | User | List entries with pagination & search (`?page=1&limit=10&search=keyword&mood=happy&tag=Work`) |
| `POST` | `/api/diary/entries` | User | Create new journal entry. Body: `{ title, content, mood, tags, entryDate, media }` |
| `GET` | `/api/diary/entries/:id` | User | Fetch single entry (User ownership enforced) |
| `PUT` | `/api/diary/entries/:id` | User | Update entry (User ownership enforced) |
| `DELETE`| `/api/diary/entries/:id` | User | Delete entry |
| `GET` | `/api/diary/calendar` | User | Lightweight month grid metadata (`?month=YYYY-MM`) without decrypting entry content |
| `GET` | `/api/diary/tags` | User | Get user's distinct tags |
| `GET` | `/api/diary/stats` | User | Get total entries, streak counters, and mood breakdown |

---

## 4. AI Companion & CBT Tools (`/api/ai` & `/api/chat`)

Requires `allowAIFeatures: true`. Enforces quota of 30 requests/day. Pre-flight risk check blocks crisis prompts from hitting external LLM.

### AI Chat (`/api/chat`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/chat/messages` | User | Get conversation history |
| `POST` | `/api/chat/messages` | User | Send message. Local crisis check intercepts high distress. Body: `{ message }` |
| `DELETE`| `/api/chat/messages` | User | Clear conversation history |

### AI Tools (`/api/ai`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/generate-storybook`| User | Generate structured storybook from journal range. Body: `{ theme, startDate, endDate }` |
| `GET` | `/api/ai/storybooks` | User | Get user's generated storybooks (metadata only: title, theme, date range, chapter count) |
| `GET` | `/api/ai/storybooks/:id` | User | Get single storybook with full decrypted chapters |
| `PUT` | `/api/ai/storybooks/:id` | User | Update storybook title or chapter content |
| `DELETE`| `/api/ai/storybooks/:id` | User | Delete storybook |
| `POST` | `/api/ai/ask-diary` | User | Ask questions answered strictly from user's journal entries with citations. Body: `{ question, filters: { startDate, endDate, mood } }` |
| `GET` | `/api/ai/ask-diary/history` | User | Get Ask Diary conversation memory history |
| `DELETE`| `/api/ai/ask-diary/history` | User | Clear Ask Diary conversation memory history |
| `POST` | `/api/ai/reflect` | User | Get compassionate reflection on entry. Body: `{ content, mood, entryId }` |
| `POST` | `/api/ai/analyze-mood` | User | Gentle emotion nuance suggestion. Body: `{ text }` |
| `POST` | `/api/ai/challenge-thought` | User | CBT cognitive reframe suggestion. Body: `{ thought, situation }` |
| `POST` | `/api/ai/writing-starters` | User | Get 3 gentle journaling prompts based on mood. Body: `{ mood }` |
| `GET` | `/api/ai/usage` | User | Check daily AI call count and remaining quota |
| `GET` | `/api/ai/thoughts` | User | List saved CBT thought records |
| `POST` | `/api/ai/thoughts` | User | Save thought record. Body: `{ situation, thought, emotion, intensity, cognitiveDistortions, rationalAlternative }` |
| `DELETE`| `/api/ai/thoughts/:id` | User | Delete thought record |

---

## 5. Wellness & Holistic Health (`/api/wellness`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/wellness/checkins` | User | Save daily check-in (`date`, `moodScore` 1-5, `stressLevel` 1-5, `sleepHours`, `note`) |
| `GET` | `/api/wellness/checkins` | User | Get past check-ins (`?limit=30`) |
| `GET` | `/api/wellness/checkins/today`| User | Get today's check-in if submitted |
| `POST` | `/api/wellness/habits` | User | Log daily habit checkmarks (`date`, `habits: { meditation, exercise, hydration, reading, sleepOnTime }`) |
| `GET` | `/api/wellness/habits` | User | Get habit history |
| `GET` | `/api/wellness/habits/today` | User | Get today's habit log |
| `POST` | `/api/wellness/gratitude` | User | Save gratitude item list. Body: `{ items: ['item 1', 'item 2', 'item 3'] }` |
| `GET` | `/api/wellness/gratitude` | User | List all gratitude entries |
| `GET` | `/api/wellness/gratitude/random`| User | Retrieve one random past gratitude memory |
| `DELETE`| `/api/wellness/gratitude/:id` | User | Delete gratitude entry |
| `POST` | `/api/wellness/favorites/:id`| User | Toggle favorite on diary entry |
| `POST` | `/api/wellness/pins/:id` | User | Toggle pinned status on diary entry |
| `GET` | `/api/wellness/happy-box` | User | Aggregated mood lifters (favorited entries, gratitude, positive memories) |
| `GET` | `/api/wellness/mood-days` | User | Unified daily mood scores 1–10 (`?from=YYYY-MM-DD&to=YYYY-MM-DD`, check-in wins, entry average fallback) |
| `GET` | `/api/wellness/home-summary` | User | Aggregated Home payload: streak, today's mood, 7-day dots, due letter flag, last entry |
| `GET` | `/api/wellness/insights` | User | Empirical metrics: sleep-mood lift, best/hardest day, 7+ mood-day rule |
| `GET` | `/api/wellness/year-pixels` | User | 12x31 yearly mood visualization grid (`?year=YYYY`) |
| `GET` | `/api/wellness/coping-plan` | User | Get personal safety coping plan (warning signs, strategies, contacts, anchors) |
| `PUT` | `/api/wellness/coping-plan` | User | Save/update personal safety coping plan (encrypted at rest) |
| `POST` | `/api/wellness/calm-sessions` | User | Log completed breathing or grounding session (`durationSeconds`, `exerciseType`) |
| `POST` | `/api/wellness/self-checks` | User | Save PHQ-9 or GAD-7 screening result (`type`, `score`, `severity`, `answers`) |
| `GET` | `/api/wellness/self-checks` | User | Get history of clinical screenings |
| `POST` | `/api/wellness/counselor-share` | User | Generate expiring read-only counselor share link. Body: `{ range: 'month', durationDays: 7 }` |
| `DELETE`| `/api/wellness/counselor-share/:token` | User | Revoke active counselor share link |
| `GET` | `/api/wellness/shared/:token` | **Public** | Read-only counselor summary view. Rate limited (60 req/15min). Headers: `noindex, nofollow, no-store`. |

---

## 6. Student Mode (`/api/student`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/exams` | User | Get upcoming exams list sorted by date |
| `POST` | `/api/student/exams` | User | Add exam date. Body: `{ subject, date, notes }` |
| `DELETE`| `/api/student/exams/:id` | User | Delete exam |
| `POST` | `/api/student/study-session`| User | Log study session. Body: `{ durationMinutes, technique }` |
| `GET` | `/api/student/study-stats` | User | Get total study minutes and weekly breakdown |
| `GET` | `/api/student/burnout-status`| User | Evaluates stress $\ge 4$ on 5+ of last 7 days + low sleep |
| `GET` | `/api/student/small-wins` | User | Get daily small wins for date (`?date=YYYY-MM-DD`) |
| `POST` | `/api/student/small-wins` | User | Save 3 tiny tasks. Body: `{ dateKey, tasks: [{ text, completed }] }` |

---

## 7. Media & Uploads (`/api/upload`)

Enforces 50 MB file limit, magic byte validation (rejects spoofed extensions), authenticated folder paths, and rate limit of 30 uploads/hour/user.

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/upload` | User | Upload image, video, or voice audio (`multipart/form-data`, key: `file`) |
| `DELETE`| `/api/upload/*` | User | Delete media asset by publicId. Path must belong to user folder (`mydiary/user_<id>/`) |

---

## 8. Export (`/api/export`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/export/entries` | User | Export diary entries in JSON format |
| `GET` | `/api/export/storybook/:id/download` | User | Download generated storybook as standalone file |

---

## 9. Letters to Future Self (`/api/letters`)

Time-capsule letters encrypted at rest. Server-side projection enforces that `content` is never sent to the client before `deliverOn`.

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/letters` | User | List user's future letters (omits `content` if currently locked) |
| `GET` | `/api/letters/due` | User | Get count and metadata of future letters that are now unlocked and ready to open |
| `POST` | `/api/letters` | User | Create sealed future letter. Body: `{ title, content, deliverOn }` (min 1 day in future) |
| `GET` | `/api/letters/:id` | User | Fetch letter. Returns 403 if still locked before `deliverOn`; decrypts content and marks `openedAt` if delivered |
| `DELETE`| `/api/letters/:id` | User | Permanently delete future letter |
