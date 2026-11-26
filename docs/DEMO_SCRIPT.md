# MindDiary - 5-Minute Live Demonstration Script

**Target Audience:** Project Examiners, Evaluators, and Review Committee  
**Total Duration:** 5 Minutes  
**Demo Account:** `demo@minddiary.app` / Password: `DemoSafe123!` (seeded via `npm run seed:demo`)

---

## ⏱ Timeline Overview

| Timestamp | Screen / Feature | Key Focus & Examiner Highlights |
| :--- | :--- | :--- |
| **0:00 - 0:45** | Login & Architecture Overview | Security at boundary, PIN app lock, AES-256-GCM encryption architecture |
| **0:45 - 1:45** | Dashboard & Wellness Insights | 30-day mood score, stress trends, sleep correlation, burnout threshold logic |
| **1:45 - 2:45** | Journaling & Multi-Language (EN/HI) | XSS sanitization, emotion taxonomy, live English ↔ Hindi i18n switch |
| **2:45 - 3:45** | AI Sanctuary & Safety Guardrails | Tiered risk analysis (none/concern/high), crisis intercept without LLM call |
| **3:45 - 4:30** | Student Mode & Grounding Tools | Exam countdown, 25/5 Pomodoro timer, 4-7-8 breathing circle, small wins |
| **4:30 - 5:00** | Privacy Controls & Data Portability | Counselor view link (read-only/expiring), full JSON export, hard account wipe |

---

## Step-by-Step Walkthrough & Speaker Notes

### 1. Introduction & Security Boundary (0:00 - 0:45)
* **Action:** Open application at `http://localhost:5173`. Show login page.
* **What to Say:**
  > "Good morning, respected examiners. Today I am presenting **MindDiary**, a private, AI-supported mental wellness journal built with Express, MongoDB, React, and TypeScript.
  > Mental health records are among the most sensitive personal data. Unlike traditional journal apps, MindDiary treats security and safety as first-class constraints. 
  > All private diary text, check-in notes, gratitude lists, and thought records are encrypted at rest using authenticated **AES-256-GCM** before touching MongoDB. Even database administrators cannot read user reflections in plaintext."
* **Action:** Sign in with `demo@minddiary.app` and enter the 4–6 digit PIN when prompted.

---

### 2. Dashboard & Empirical Insights (0:45 - 1:45)
* **Action:** Land on Dashboard. Scroll through the 30-day streak, check-in cards, and navigate to **Insights** (`/insights`).
* **What to Say:**
  > "Here on the Dashboard, our seeded profile demonstrates 30 days of active reflection. 
  > Notice the Wellness Insights tab. Rather than making vague claims, our algorithms follow strict statistical rules:
  > - We enforce a **7+ check-in minimum** before showing mood-sleep correlations, preventing misleading statistical noise.
  > - We calculate day-of-week averages, identifying the user's hardest and best days.
  > - Our burnout early warning algorithm monitors if stress levels remain at 4 or 5 for five out of seven consecutive days combined with low sleep, gently nudging the user toward rest."

---

### 3. Journaling, Emotion Wheel & Hindi UI (1:45 - 2:45)
* **Action:** Go to **Write** (`/write`). Open the emotion picker. Then click Language in Header/Sidebar and switch to **हिन्दी**.
* **What to Say:**
  > "Writing is supported by an accessible Emotion Wheel covering 5 core emotions and 20 nuanced sub-emotions.
  > Every entry is sanitized against XSS on both client and server via `sanitize-html`.
  > Furthermore, mental wellness should not be restricted by language barriers. By switching to Hindi, all navigation, check-in labels, calm prompts, and safety buttons instantly update using `react-i18next` with natural, culturally validated phrasing."
* **Action:** Switch back to English or keep Hindi for demonstration.

---

### 4. AI Support with Hard Safety Guardrails (2:45 - 3:45)
* **Action:** Navigate to **AI Companion** (`/chat`).
* **What to Say:**
  > "A core innovation in MindDiary is how we manage generative AI. Many wellness apps blindly stream prompts into LLMs. In MindDiary:
  > 1. AI is strictly opt-in and rate-limited to 30 requests per user per day.
  > 2. Every input is evaluated *prior to sending* by our local `checkRisk` engine.
  > 3. If high-distress crisis indicators (such as self-harm or suicidal intent in English, Hindi, or Hinglish) are detected, **the external LLM is never called**. Instead, an immediate caring response is returned locally, the crisis safety banner is triggered, and verified national helplines (such as Tele-MANAS 14416 or 988) are provided with direct click-to-call links."

---

### 5. Student Mode & Calm Grounding (3:45 - 4:30)
* **Action:** Navigate to **Student Mode** (`/student`) and **Calm** (`/calm`).
* **What to Say:**
  > "Recognizing that students face acute academic pressure, Student Mode integrates:
  > - An **Exam countdown tracker** mapping stress trends as test dates approach.
  > - A **Pomodoro 25/5 study timer** with integrated breathing pauses.
  > - A daily 'Small Wins' checklist capped at 3 tiny, manageable tasks to counter overwhelm.
  > In the Calm sanctuary, interactive SVG visualizers provide clinically backed 4-7-8 and Box breathing pacing with sound and haptic feedback."

---

### 6. Privacy, Counselor Sharing & Account Deletion (4:30 - 5:00)
* **Action:** Navigate to **Settings** (`/settings`) $\to$ **Privacy** (`/privacy`).
* **What to Say:**
  > "Finally, MindDiary offers true user autonomy:
  > - **Counselor Sharing:** Users can generate a temporary, expiring (e.g. 7-day) read-only link for their therapist or counselor. This link includes only high-level wellness summaries and no raw diary entries, and can be revoked at any instant.
  > - **Data Portability:** Users can download a full, decrypted JSON archive of their entire account with one click.
  > - **Right to be Forgotten:** A single password-verified account deletion permanently cascades across all 12 MongoDB collections and Cloudinary media assets.
  > MindDiary provides a secure, ethical, and clinically grounded digital sanctuary."

---

## 💡 Potential Examiner Questions (Quick Answers)

1. **Q: Why AES-256-GCM instead of standard AES-CBC?**  
   *A:* GCM is an authenticated encryption mode. It provides both confidentiality and data integrity verification via a 128-bit authentication tag, preventing tampering and padding oracle attacks.
2. **Q: Can the server read the user's data?**  
   *A:* Yes, this is server-side encryption with key in environment variables (like standard database-at-rest encryption). The user is protected against database dumps, log leaks, and unauthorized multi-tenant queries. We document this honestly in `PRIVACY_AND_ETHICS.md`.
3. **Q: Why don't you send crisis queries to Gemini/GPT?**  
   *A:* Relying on third-party LLMs for active suicidal ideation introduces latency, hallucinations, potential refusal errors, and privacy leakage. Deterministic local safety intercept ensures immediate, reliable helpline guidance.
