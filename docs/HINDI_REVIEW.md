# Hindi Translation Review (`hi.json`)

Status: `npm run i18n:check` passes with 100% key parity between `en.json` and `hi.json`.

## Items Flagged for Native Speaker Review
1. **Formal vs. Gentle Tone (`आप` vs. `तुम`):** New U4/U5 keys (`dashboard.howAreYou`: `"आप कैसे हैं?"`, `diary.moodDiscrepancyShort`: `"आपके शब्द आपके मूड से ज़्यादा भारी लग रहे हैं।"`) use respectful `आप`. Confirm consistency with older calm/check-in prompts.
2. **Transliterated Tech Terms:** Terms like `"AI"`, `"PIN"`, `"PDF"`, and `"फ़ोकस मोड"` (`write.focusMode`) are kept in familiar Hinglish/Devanagari forms rather than pure Sanskritized Hindi for clarity among Indian students.
3. **Settings Row Labels:** `settings.rowLook` (`"दिखावट"`), `settings.rowSafety` (`"सुरक्षा"`), `settings.rowPrivacy` (`"AI और गोपनीयता"`), `settings.rowAccount` (`"खाता"`) — short 1–3 word labels matching U4 text budget; verify natural phrasing on 360px mobile screens.
4. **Safety & Helplines:** Crisis/helpline strings in `sos.*`, `safety.*`, and `copingPlan.*` were intentionally kept complete and unmodified.
