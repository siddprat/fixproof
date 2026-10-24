# Accessibility audit

Owner: friend's lane. Target: WCAG 2.2 AA.

## Run 1: Sat Oct 24, 2026, about 7pm (mock data)

Build: `web/` at the Phase 4 commit, `VITE_USE_MOCK=true`. Tested in headless Chromium. Not yet tested against the real API. Re-run on the final build (F39).

### Automated results

| Tool | Scope | Result |
| --- | --- | --- |
| axe-core 4.10.3, tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice | 18 screen states x 2 viewports (375 px and 1280 px) = 36 runs | 0 violations |
| Lighthouse 12.6.1, mobile, production build | `/`, `/new`, `/report` | Accessibility 100, Best Practices 100 on all three. Performance 96, 95, 99. |
| `npm run contrast` (our script, `web/scripts/contrast.mjs`) | every text and UI color pair in `styles.css` | all 21 pairs pass. Lowest text pair 6.73:1 (need 4.5). Lowest non-text pair 4.29:1 (need 3). |

The 18 states: log empty, log with entries, delete dialog open, capture empty, capture with photos and a file error, capture while analyzing, capture with an AI error, analysis (hazard), analysis after save, analysis (low confidence), analysis (not a housing problem), entry not found, email empty, email form, email result, report empty, report with entries, 404.

### Scripted checks (Playwright)

| Check | Result |
| --- | --- |
| Keyboard only, full flow: add photo, dictate, analyze, change urgency with arrow keys, save, write email, copy, report, delete dialog | Works with no mouse |
| Tab walk from the top of each page (log, capture, 3 analysis states, email, report) | Skip link is the first stop on every page. Every stop shows a 3 px focus ring. No traps. |
| Tap targets | Every button and form control is at least 44 px. (Inline text links are exempt.) |
| Focus after navigation | Moves to the page `h1` on every route change. Not on first load, so the skip link stays first. |
| Focus after analysis | Lands on the analysis page `h1` |
| Focus on errors | Capture error, email error, empty observations, and "pick at least one problem" all move focus to the message or field |
| Delete dialog | Native `<dialog>` with `showModal()`. Opens on Cancel. Escape closes it. Focus returns to "Delete my case". The page behind cannot take focus. |
| Headings | One `h1` per view, no skipped levels, document title changes per route |
| Landmarks | `header`, `nav`, `main`, `footer` on every page |
| Images | Every image has alt text. Photo alt text comes from the AI and is editable on the analysis screen. |
| Live regions | Analyzing, saving, copying, deleting, dictation start and stop, and fingerprint checks are announced through `role="status"`. Errors and the hazard banner use `role="alert"`. |
| Reflow | No horizontal scroll at 320 px, 375 px, a 640 px viewport (200 percent zoom of 1280 px), or 200 percent text size |
| Reduced motion | Spinner and transitions are turned off under `prefers-reduced-motion` |

### What we fixed in this pass

- First load moved focus to the `h1` in development (React StrictMode ran the effect twice), so the skip link was not the first Tab stop. Fixed by only moving focus on real navigation.
- More than one primary button per screen. Now: capture shows "Take a photo" as primary until a photo is added, then "Analyze". The analysis screen has one primary, "Save changes". The email screen's "Write the email" stops being primary once the draft exists, so "Copy email" is the one primary action.
- Photos on the analysis and report screens now reserve their space before they load, so the page does not jump.
- The observations box was too short on phones and cut off text. It now grows with its content.
- The email screen used photo wording for AI errors ("Your photos were not saved"). It now has its own wording.
- Added "Dictate your note" (F28). It is hidden when the browser has no speech recognition, uses `aria-pressed`, and announces start and stop. It says plainly that the browser's speech service may send audio to Google or Apple.

### What remains (needs a person or the real API)

- [ ] HUMAN: a real screen reader pass. VoiceOver on an iPhone at minimum, NVDA on Windows if possible. The automated checks above cannot judge how it actually sounds.
- [ ] HUMAN: on a real phone, check the on-screen keyboard does not hide the note box or the Analyze button.
- [ ] Dictation was tested with a fake speech engine only. Try it on a real phone (Chrome on Android, Safari on iPhone).
- [ ] Re-run axe and Lighthouse against the deployed Cloud Run build with the real API (F39).

### Contrast detail

```
PASS  14.57:1  (need 4.5)  text on bg  body text
PASS  15.65:1  (need 4.5)  text on surface  card text
PASS  13.90:1  (need 4.5)  text on surface-alt  hover / hash block text
PASS   7.05:1  (need 4.5)  text-muted on bg  muted text on page
PASS   7.58:1  (need 4.5)  text-muted on surface  muted text in cards and footer
PASS   6.73:1  (need 4.5)  text-muted on surface-alt  disabled button text
PASS   6.85:1  (need 4.5)  primary on bg  links on page
PASS   7.36:1  (need 4.5)  primary on surface  links in cards
PASS   8.52:1  (need 4.5)  primary-hover on surface-alt  link hover
PASS   7.36:1  (need 4.5)  on-primary on primary  primary button
PASS   9.60:1  (need 4.5)  on-primary on primary-hover  primary button hover
PASS   8.14:1  (need 4.5)  hazard-text on hazard-bg  hazard banner
PASS   9.31:1  (need 4.5)  hazard-text on surface  danger button, field errors
PASS   7.87:1  (need 4.5)  warn-text on warn-bg  warning panel
PASS   7.65:1  (need 4.5)  ok-text on ok-bg  ok notice
PASS   8.78:1  (need 4.5)  info-text on info-bg  info notice
PASS   4.61:1  (need 3)  border-strong on surface  input borders (non-text)
PASS   4.29:1  (need 3)  border-strong on bg  button borders on page (non-text)
PASS   5.28:1  (need 3)  focus on bg  focus ring on page (non-text)
PASS   5.67:1  (need 3)  focus on surface  focus ring in cards (non-text)
PASS   5.29:1  (need 3)  hazard-border on surface  danger button border (non-text)
```
