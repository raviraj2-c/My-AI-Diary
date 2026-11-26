# MindDiary Data Flow & Screen-to-Database Map

Generated from the current codebase (`frontend/src/` and `server/`).

## 1. Unified Daily Mood Mapping (`server/utils/moodScale.js`)

One canonical **"day mood"** per calendar day (`YYYY-MM-DD` in the user's IANA timezone):
`{ date, score, source: 'checkin' | 'entry', emotions: string[] }`

- **Rule:** If a `CheckIn` exists for that day, `checkIn.moodScore` (1–10) wins (`source: 'checkin'`).
- **Fallback:** Otherwise, average the day's `DiaryEntry` scores (`source: 'entry'`), using `entry.moodScore` if present, or `MOOD_SCORE_MAP[entry.mood]`:

| Entry Mood | Mapped Score (1–10) |
| :--- | :---: |
| `excited` | 9 |
| `happy` | 8 |
| `peaceful` | 7 |
| `neutral` | 5 |
| `anxious` | 4 |
| `sad` | 3 |
| `angry` | 3 |

---

## 2. Screen-by-Screen Data Flow

| Screen | Frontend Hook / Service | API Endpoint | Backend Controller | Collection(s) & Fields | Shown In UI |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard (`/`)** | `useHomeSummary()` | `GET /api/wellness/home-summary` | `wellnessController.getHomeSummary` | `CheckIn` (`dateKey`, `moodScore`), `DiaryEntry` (`_id`, `title`, `entryDate`, `mood`), `FutureLetter` (`deliverOn`, `openedAt`) | Today's check-in pill, 7-day mood strip, streak counter, due letter banner, latest entry card |
| **Write / Diary (`/write`)** | `DiaryContext` + `DiaryService` | `GET /api/diary/entries`, `POST /api/diary/entries`, `PUT /api/diary/entries/:id` | `diaryController` | `DiaryEntry` (`title`, `content` ENC, `mood`, `tags`, `media`, `entryDate`, `aiExcluded`) | Rich editor, emotion wheel, entry list, AI reflect card |
| **Calendar (`/journal?tab=calendar`)** | `useCalendarMonth(month)` + `useEntries(1, day)` | `GET /api/diary/calendar?month=YYYY-MM`, `GET /api/diary/entries?startDate&endDate` | `diaryController.getCalendarMonth`, `getEntries` | `DiaryEntry` (`entryDate`, `dateKey`, `mood`, `media` — no `content` decrypted for month grid) | Month dots/highlights; tapped day's decrypted entries |
| **Search (`/journal?tab=search`)** | `DiaryService.searchEntriesAsync` | `GET /api/diary/entries?search=...` | `diaryController.getEntries` | `DiaryEntry` (latest 500 decrypted in-memory when `search` is present; DB pagination otherwise) | Filtered entry cards + `"searched the latest 500 entries"` metadata |
| **Mood Today (`/mood`)** | `useToday()` | `GET /api/wellness/checkins/today`, `GET /api/wellness/habits/today`, `POST /api/wellness/checkins`, `POST /api/wellness/habits` | `wellnessController` | `CheckIn` (`moodScore`, `emotions`, `sleepHours`, `stress`, `note` ENC), `HabitLog` (`sleepHours`, `waterGlasses`, `exerciseMinutes`, `screenTimeHours`) | 3-step check-in wizard (`Mood -> Body -> Gratitude`) |
| **Mood Trends (`/mood?tab=trends`)** | `useInsights(range)` | `GET /api/wellness/insights?range=week\|month\|3months` | `wellnessController.getInsights` | `CheckIn`, `HabitLog`, `DiaryEntry` via `getMoodDays` (7+ mood days from any source required) | 3 key numbers, `MoodChart`, up to 3 findings, counselor share sheet |
| **Year in Pixels (`/mood?tab=year`)** | `useYearPixels(year)` | `GET /api/wellness/year-pixels?year=YYYY` | `wellnessController.getYearPixels` | `CheckIn`, `DiaryEntry` | 365-day sky-blue pixel grid + legend |
| **Favorites (`/journal?filter=favorites`)** | `useHappyBox()` | `GET /api/wellness/happy-box` | `wellnessController.getHappyBox` | `DiaryEntry` (`isFavorite`, `media`, `entryDate`, `content` ENC) | Favorites, media memories, "On This Day" |
| **Support Talk (`/talk`)** | `ChatService` (`mode: 'general'`) | `GET/POST/DELETE /api/chat/messages` | `chatController` | `ChatMessage` (`role`, `content` ENC, `safetyLevel`, `mode: 'general'`) | Conversational AI companion + safety banner |
| **Ask My Diary (`/talk?mode=diary`)** | `ChatService` (`mode: 'diary'`) | `POST /api/ai/ask-diary`, `GET/DELETE /api/ai/ask-diary/history` | `aiController` | `DiaryEntry` (non-`aiExcluded`), `ChatMessage` (`mode: 'diary'`) | Grounded Q&A answer + source entry citations |
| **SOS Sheet (Global)** | `SOSButton` (`copingPlan` cache on open) | `GET /api/wellness/coping-plan` | `wellnessController.getCopingPlan` | `CopingPlan` (`warningSigns`, `copingStrategies`, `peopleToContact`, `safePlaces`, `reasonsToKeepGoing` — all ENC) | Personal coping plan inside SOS dialog + helplines |
| **Stories (`/stories`, `/export`)** | `AIService` | `POST /api/ai/generate-storybook`, `GET /api/ai/storybooks` | `aiController` | `DiaryEntry` (max 40), `Storybook` (`title`, `theme`, `generatedContent` ENC, `chapters` ENC) | Storybook generator, library, reader, PDF export |
| **Letters (`/letters`)** | `LetterService` | `GET/POST/DELETE /api/letters` | `letterController` | `FutureLetter` (`title`, `content` ENC, `deliverOn`, `openedAt`) | Locked/unlocked future letters |
| **Student (`/student`)** | `StudentService` | `/api/student/exams`, `/study-session`, `/burnout-status`, `/small-wins` | `studentController` | `Exam` (`notes` ENC), `StudySession`, `SmallWin` (`tasks` ENC) | Exam countdowns, Pomodoro, burnout notice, 3 small wins |
| **Self-Check (`/self-check`)** | `WellnessService` | `GET/POST /api/wellness/self-checks` | `wellnessController` | `SelfCheck` (`type`, `score`, `severity`, `answers` ENC) | PHQ-9 / GAD-7 screening & history chart |
| **Settings & Privacy (`/settings`, `/privacy`)** | `AuthService` | `GET /api/auth/me`, `PUT /api/auth/settings`, `GET /api/auth/export-data`, `POST /api/auth/delete-account` | `authController` | `User` + all 15 user-owned collections | Theme, language, AI toggles, PIN lock, export, account deletion |
