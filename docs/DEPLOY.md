# MindDiary: Production Deployment Guide & Checklist

This guide covers deploying the **MindDiary** full-stack system:
- **Backend API:** Hosted on [Render](https://render.com) (or Railway / AWS ECS).
- **Frontend SPA:** Hosted on [Vercel](https://vercel.com) (or Netlify / Cloudflare Pages).
- **Database:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) M0 Free or Serverless.
- **Media Storage:** [Cloudinary](https://cloudinary.com).
- **AI Intelligence:** [Google Gemini](https://aistudio.google.com).

---

## 1. Environment Variables Checklist

### A. Render (Backend Web Service)
* **Root Directory:** `server` (or run commands from root: `npm --prefix server start`)
* **Build Command:** `npm --prefix server install`
* **Start Command:** `node server/index.js`

| Variable Name | Required | Description / Example Value |
| :--- | :---: | :--- |
| `NODE_ENV` | Yes | `production` |
| `NODE_VERSION` | Yes | `20` (ensures Node >=20.19 on Render) |
| `PORT` | Yes | `5000` (or leave default assigned by Render) |
| `MONGODB_URI` | Yes | `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/minddiary?retryWrites=true&w=majority` |
| `JWT_SECRET` | Yes | Cryptographic secret (minimum 32 characters). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Yes | `7d` |
| `FRONTEND_URL` | Yes | `https://your-app.vercel.app` (no trailing slash) |
| `CORS_ORIGIN` | Yes | `https://your-app.vercel.app` (must match frontend origin) |
| `ENCRYPTION_KEY` | **CRITICAL** | 64-character hex string (32 bytes for AES-256-GCM). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API Secret |
| `GEMINI_API_KEY` | Optional | `AIza...` (required for Gemini AI reflections and chat) |
| `AI_MODEL` | Optional | `gemini-2.5-flash` |
| `SMTP_HOST` | Optional | E.g. `smtp.sendgrid.net` or `smtp.gmail.com` |
| `SMTP_PORT` | Optional | `587` |
| `SMTP_USER` | Optional | SMTP username |
| `SMTP_PASS` | Optional | SMTP password or App Password |
| `EMAIL_FROM` | Optional | `MindDiary <noreply@yourdomain.com>` |

> [!CAUTION]
> **BACK UP `ENCRYPTION_KEY` SEPARATELY!**  
> If your server environment is destroyed and you restore MongoDB from a backup without the exact same `ENCRYPTION_KEY`, **all encrypted diary entries and check-in notes will be permanently lost and unrecoverable**. Store a copy of `ENCRYPTION_KEY` in a secure password manager (e.g., 1Password, Bitwarden).

---

### B. Vercel (Frontend Single Page Application)
* **Framework Preset:** Vite
* **Root Directory:** `frontend`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **SPA Routing:** Configured via `frontend/vercel.json` (`{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`) so deep links and page refreshes never 404 while keeping static assets working.

| Variable Name | Required | Description / Example Value |
| :--- | :---: | :--- |
| `VITE_API_URL` | Yes | `https://minddiary-server.onrender.com/api` (points to your Render backend URL with `/api` suffix) |

---

## 2. Cold-Start Handling on Render Free Tier

Render's free tier spins down idle web services after 15 minutes of inactivity. When a user opens the application after a sleep interval, the first request will take **30 to 50 seconds** to wake up.

### Built-in Mitigations:
1. **Extended Timeout:** `frontend/src/config/api.ts` configures a 60-second abort timeout (`TIMEOUT: 60000`) so the browser does not terminate early.
2. **User-Facing Sleep Notice:** When an authentication or initial app load request exceeds 3.5 seconds, `App.tsx`, `LoginForm.tsx`, and `SignUpForm.tsx` automatically show:
   > *"Connecting to server... On Render free tier, initial spin-up can take 30–50 seconds. Please hold on."*
3. **Uptime Ping Recommendation:** To keep the service warm during presentations or working hours, set up a free monitor at [UptimeRobot.com](https://uptimerobot.com) to ping `GET https://your-server.onrender.com/api/health` every 10 minutes.

---

## 3. Post-Deployment Verification Checklist (10 Essential Verification Steps)

Run through this test sequence immediately after deploying to production:

- [ ] **Step 1: `/api/health` Probe**  
  Open `https://your-server.onrender.com/api/health` in your browser. Verify it returns status 200 with JSON:  
  `{ "status": "ok", "service": "minddiary-server", "database": "connected" }`.
- [ ] **Step 2: Sign Up (Registration Flow)**  
  Register a new test account from the signup screen. Confirm instant validation, password length checks, smooth redirect to Dashboard, and JWT token persistence.
- [ ] **Step 3: Password-Reset Email**  
  From login, submit a forgot-password request. Verify the reset link arrives via email (or logs token in server console if SMTP is unconfigured), and resets the password securely with single-use invalidation.
- [ ] **Step 4: Media Upload**  
  In the Write page, attach an image and voice recording. Confirm client canvas downscaling, magic-byte validation, user-segregated Cloudinary storage, and proper preview rendering.
- [ ] **Step 5: AI Reply**  
  Enable AI features in Settings, then send a message in the AI Sanctuary (`/chat`) or request an entry reflection. Confirm Gemini replies within 2–4 seconds (or returns clean 503 if API key is unconfigured) and the daily 30-call quota tracks accurately.
- [ ] **Step 6: Safety Screen**  
  Type a severe distress phrase (e.g., *"I want to end my life"*) into check-in or chat. Confirm immediate intercept by the high-risk guardrail, blocking external AI calls and surfacing the full-screen crisis safety dialog with national helplines and trusted contact actions.
- [ ] **Step 7: SOS Button**  
  Click the floating SOS button on any screen. Verify the slide-over crisis sheet opens with localized helplines, stale verification badges (if older than 6 months), personal Coping Plan quick-view, trusted contact dialing, and the 5-4-3-2-1 grounding exercise.
- [ ] **Step 8: Delete Account**  
  Go to Settings, scroll to Danger Zone, and enter your password to delete account. Verify cascading hard deletion of all 16 collections and Cloudinary folder assets, followed by immediate session termination.
- [ ] **Step 9: Hindi Switch (i18n)**  
  In Settings or top navigation, toggle language between English (`en`) and Hindi (`hi`). Verify full interface localization across navigation, buttons, forms, tooltips, and prompts without broken layout.
- [ ] **Step 10: App Lock**  
  In Settings, configure a 4–6 digit PIN lock. Lock the application or wait for inactivity timeout, then verify that the PIN screen protects the interface and correctly unlocks upon entering the right PIN.
- [ ] **Step 11: Vercel SPA Routing & Deep Links**  
  Open `https://your-app.vercel.app/reset-password/test` and `https://your-app.vercel.app/shared/test` directly in the browser, and refresh `https://your-app.vercel.app/calendar`. Confirm all three load the SPA cleanly without a Vercel 404.

---

## 4. Database Backup & Disaster Recovery

### Creating a Manual Backup (`mongodump`)
To back up the production MongoDB database from your command line:
```bash
mongodump --uri="mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/minddiary" --out="./backup_$(date +%Y%m%d)"
```

### Restoring from Backup (`mongorestore`)
```bash
mongorestore --uri="mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/minddiary" "./backup_20261119/minddiary"
```
*(Ensure `ENCRYPTION_KEY` matches the key used when the backup was dumped).*

---

## 5. Seed Demo User in Production (Optional)

To seed the 30-day presentation profile on your production MongoDB Atlas cluster:
```bash
MONGODB_URI="mongodb+srv://..." DEMO_PASSWORD="YourSecurePassword123!" node server/scripts/seedDemo.js
```
This populates 30 days of check-ins, habits, CBT thoughts, student exams, and reflections ready for demonstration.
