# MindDiary: Privacy, Data Security & Ethical Architecture

*Last reviewed and verified: November 19, 2026*  
*Helpline contact data verification date: November 2026*

---

## 1. What Data is Stored

MindDiary stores user data exclusively to provide wellness tracking, reflection support, and student tools.

| Data Category | Stored Attributes | Database Collection | Storage Format |
| :--- | :--- | :--- | :--- |
| **User Profile** | Name, Email, Password Hash, Country, Language, UI Theme, Font preference, AI opt-in flag | `users` | Bcrypt hash for password; plaintext metadata |
| **Diary Entries** | Title, Content, Mood enum, Tags, Date, Media metadata, Favorite/Pin status | `diaryentries` | Title, content, and notes encrypted via AES-256-GCM |
| **Daily Check-Ins** | Mood score (1-5), Stress score (1-5), Sleep hours, Date, Reflection Note | `checkins` | Note encrypted via AES-256-GCM; scores numeric for trends |
| **Habit Tracking** | Date, Boolean habit map (meditation, exercise, hydration, reading, sleep) | `habitlogs` | Plain boolean flags indexed by date |
| **Gratitude Logs** | Array of 3 gratitude items, Timestamp | `gratitudeentries` | Items array encrypted via AES-256-GCM |
| **Clinical Screeners** | Questionnaire type (PHQ-9, GAD-7), Score, Severity string, Answers array, Date | `selfchecks` | Raw answers encrypted via AES-256-GCM; score numeric |
| **AI Conversations** | Role (user/assistant), Message content, Safety tier ('none'/'concern'/'high'), Timestamp | `chatmessages` | Message content encrypted via AES-256-GCM |
| **CBT Thought Records**| Situation, Automatic thought, Emotion, Intensity, Cognitive distortion, Rational thought | `thoughtrecords` | Thought, situation, and reframe encrypted via AES-256-GCM |
| **Student Data** | Exam subject, Date, Exam notes; Pomodoro session duration; Daily small wins | `exams`, `studysessions`, `smallwins` | Notes and small win tasks encrypted via AES-256-GCM |
| **Counselor Shares** | SHA-256 Token hash, Anonymized summary metrics, Expiration timestamp, Active flag | `counselorreports` | Aggregated statistical scores only; NO raw journal text |

---

## 2. Encryption Architecture: What Is and Isn't Encrypted

### What is Encrypted at Rest
All private, descriptive user thoughts and emotional notes are encrypted using **AES-256-GCM** with a unique 96-bit (12-byte) initialization vector (IV) per field write and a 128-bit authentication tag.
- Field format in MongoDB: `enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>`.
- Any modification of ciphertext or tag results in an authenticated decryption rejection.
- **Protected Fields:** Diary entry bodies (`DiaryEntry.content`), media captions (`DiaryEntry.media[].caption`), check-in notes (`CheckIn.note`), gratitude items (`GratitudeEntry.items`), AI chat companion conversations (`ChatMessage.content`), CBT thought records (`ThoughtRecord.situation`, `thought`, `balancedThought`), storybook chapters and generated content (`Storybook.generatedContent`, `chapters[].content`), clinical screener raw answers (`SelfCheck.answers` stored as an encrypted JSON string), exam preparation notes (`Exam.notes`), and daily small win tasks (`SmallWin.tasks[].text`).
- **Plaintext by Design:** Titles, tags, mood categories, and dates are stored in plain text to enable database-level sorting, indexing, and tag filtering without loading the entire database into server memory.

### Media Delivery Architecture (Cloudinary)
- **Folder Isolation:** Uploaded user photos, audio voice reflections, and video clips are organized inside a per-user isolated folder prefix: `mydiary/user_<userId>/`.
- **Honest Delivery Model:** Media files are served via Cloudinary's public CDN edge using cryptographically unguessable random public IDs and tokens. They are **not** access-controlled via session-authenticated signed access URLs. Anyone possessing the exact media URL can view the asset.
- **Why this model was chosen:** Authenticated delivery requires paid Cloudinary add-on tiers or short-lived token signing that creates operational fragility, breaks browser client caching, breaks offline / PWA presentation, and causes PDF book compilations to fail if links expire.
- **Permanent Purge:** When an entry or an account is deleted, the backend issues direct administrative deletion requests to Cloudinary to permanently destroy all associated assets.

### Token Expiration & Session Security
- **JWT Lifetime:** Access tokens expire after 24 hours (`JWT_EXPIRES_IN=24h`).
- **Session Revocation (`tokenVersion`):** The user document maintains an integer `tokenVersion`. Whenever a user resets their password, changes their password, or clicks "Log Out Everywhere", `tokenVersion` increments, immediately invalidating all active JWT tokens across all devices.
- **Rate Limiting:** Authentication routes are strictly limited to 10 requests per 15 minutes per IP. Authenticated API traffic is keyed per user ID (`user_<id>`) with generous capacity (600 requests / 15 min) to prevent false-positive lockouts during continuous active journaling.

### Limitations: Why the Server Can Still Read Data
- **Server-Managed Key Architecture:** Encryption and decryption occur on the backend application server using the secret `ENCRYPTION_KEY` environment variable.
- **Why this model was chosen:** It enables server-side search across encrypted entries, scheduled aggregate trend computations, PDF book compilation, and safe data recovery if a user forgets their device password.
- **Honest security trade-off:** This is *encryption-at-rest against unauthorized database exposure, disk theft, and multi-tenant database cross-read*, **NOT end-to-end zero-knowledge encryption**. Any party possessing root access to the running backend application server process or the `ENCRYPTION_KEY` environment variable can decrypt the stored records.

---

## 3. Limits of App Lock (PIN Protection)

- **Device-Level UI Guard Only:** The 4–6 digit App Lock is a client-side gate stored hashed in local state and validated against the backend `/api/auth/app-lock/verify` endpoint.
- **Not a Separate Key Derivation Layer:** The PIN does **not** derive the database encryption key (unlike Signal or 1Password).
- **Intended Purpose:** It protects the user from casual snooping (e.g., a friend, partner, or colleague picking up an unlocked phone or laptop while the browser tab is open). If someone intercepts the raw database or server memory, the PIN does not provide additional cryptographic resistance.

---

## 4. Third-Party AI Data Transmission (Anthropic Claude)

MindDiary integrates Anthropic's Claude API for optional AI reflections and companion chat. Strict boundaries are enforced:

### When Data Is Sent to AI
- Data is sent **only** when the user explicitly triggers an AI action (e.g., clicks "Reflect", sends a chat message, or requests a storybook).
- AI features are completely disabled if the user turns off "Allow AI Features" in Settings (`allowAIFeatures: false`).
- Reading diary entries for the "Ask My Diary" feature requires a **separate, dedicated consent switch** (`allowDiaryAI: false` by default). Even if AI features are enabled, the assistant cannot read past entries unless `allowDiaryAI` is explicitly turned ON by the user.

### What is Sent
- The specific prompt or entry snippet the user asked to analyze.
- For "Ask My Diary": only the top 6 matching entry excerpts (up to 500 characters around the best-matching sentence) retrieved in memory. Entries flagged with `aiExcluded: true` are completely excluded.
- The shared wellness system prompt (`safetyPrompt.js`), which enforces data isolation (treating diary excerpts as pure data, never instructions), strict citation limits (max 15 words per quote), pattern descriptions as possibilities, non-diagnostic framing, and compassionate boundaries.
- No database IDs, no email addresses, no real names, and no IP addresses are ever attached to AI payloads.
- Recent conversation context in Ask My Diary (last 6 messages) is stored encrypted at rest with AES-256-GCM (`mode: 'diary'`) and can be permanently erased at any time via "Forget this chat" (`DELETE /api/ai/ask-diary/history`).

### When Data Is NOT Sent (Crisis Guardrail & Local Safety Scanning)
- When a user inputs high-risk text (expressions of self-harm, suicidal intent, suicide methods, or acute distress):
  - The local `checkRisk()` heuristic intercepts the request on the server **prior** to any network dispatch.
  - **The external AI API is NEVER called.**
  - An immediate compassionate local response is returned alongside official emergency helplines.
- For "Ask My Diary" retrieval, **every retrieved excerpt is scanned locally with `checkRisk()`**. If any excerpt contains high-risk distress text:
  - **The excerpt is dropped immediately and NEVER sent to the AI provider.**
  - The raw excerpt text is **never logged**.
  - If all matching excerpts were dropped due to crisis markers, the external AI is never called, the daily quota is refunded, and a caring support message is returned.
  - If some excerpts were dropped, a compassionate safety advisory is appended to the prompt instructing the assistant to respond with care without probing painful memories.

---

## 5. Right to Erasure: How to Delete Everything

MindDiary honors full data sovereignty under GDPR / DPDP principles:

1. **Self-Service Hard Delete:** Navigate to **Settings** $\to$ **Delete Account**.
2. **Password Verification:** Requires entering the current account password to prevent unauthorized or accidental clicks.
3. **Cascading Erasure:** The backend issues atomic deletions across all 12 MongoDB collections:
   - `DiaryEntry`, `CheckIn`, `HabitLog`, `GratitudeEntry`, `CalmSession`, `SelfCheck`, `Storybook`, `ChatMessage`, `ThoughtRecord`, `StudySession`, `Exam`, `SmallWin`, and `User`.
4. **Media Purge:** Attached Cloudinary photo and voice assets are deleted via authenticated Cloudinary API calls.
5. **No Soft Deletion:** Deletion is permanent and immediate. Records are not retained in hidden "trash" archives.

---

## 6. Clinical & Medical Disclaimer

> **IMPORTANT NOTICE:** MindDiary is an educational, self-reflection, and productivity companion. It is **not** a medical device, diagnostic tool, psychiatric intervention, or substitute for professional medical care, diagnosis, or clinical therapy.
> 
> The PHQ-9 and GAD-7 questionnaires provided in the app are standard self-report screening instruments intended solely for personal self-awareness. A high score on a self-check does not constitute a formal diagnosis of Major Depressive Disorder or Generalized Anxiety Disorder. Users experiencing persistent emotional distress or symptoms of depression are strongly encouraged to consult a licensed psychiatrist, clinical psychologist, or primary healthcare provider.

---

## 7. Verified Crisis Helplines

All helpline numbers integrated into MindDiary's `SOSButton`, `SafetyBanner`, and crisis responses were verified in **November 2026**:

| Country | Helpline Name | Contact | Type |
| :--- | :--- | :--- | :--- |
| **India (IN)** | **Tele-MANAS** (Ministry of Health) | **14416** or **1800-891-4416** | 24/7 Toll-free, Multilingual Mental Health Support |
| **India (IN)** | **KIRAN** (Govt. of India) | **1800-599-0019** | 24/7 National Mental Health Helpline |
| **India (IN)** | **Vandrevala Foundation** | **+91 9999 666 555** | 24/7 Free Emotional & Crisis Support |
| **United States (US)** | **Suicide & Crisis Lifeline** | **988** (Call or Text) | 24/7 Free, Confidential English & Spanish Support |
| **United States (US)** | **Crisis Text Line** | **Text HOME to 741741** | 24/7 SMS Support |
| **United Kingdom (UK)**| **Samaritans UK** | **116 123** | 24/7 Free Confidential Support |
| **Canada (CA)** | **Suicide Crisis Helpline** | **988** (Call or Text) | 24/7 National Toll-free Support |
| **International** | **Befrienders Worldwide** | [befrienders.org](https://www.befrienders.org) | Global Directory of Crisis Centres |
