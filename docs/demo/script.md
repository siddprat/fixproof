# Demo script (2 to 3 minutes)

Owner: friend's lane. One person drives the phone, one narrates. Practice twice before recording.

Anything in [PENDING: ...] must be filled with real data before recording. If we do not have it, cut that line. Never make up a quote or a number.

## Before you start

- Phone: brightness up, Do Not Disturb on, notifications off, battery over 50 percent.
- Open the deployed Cloud Run app. Start with a fresh case (Delete my case, then confirm).
- Have ready: one clear photo of a real minor problem, and `02-blurry.jpg` from `docs/test-photos/`.
- Second tab ready: the README architecture diagram and `docs/a11y-audit.md`.
- Confirm the model id is still `gemma-4-26b-a4b-it` and the real model request has passed (check `docs/FACTS.md`).

## Script

### 1. Problem (about 15 seconds)

> First leases in Blacksburg come with repair problems. Reporting them usually means a text that gets lost and no record of when you asked.

[PENDING: one real quote from `docs/interviews.md`, with permission. Read it word for word.]

> FixProof turns a phone photo into a dated report, a landlord email, and a record you can check later.

### 2. Live flow (about 90 seconds)

| Time | Driver does | Narrator says |
| --- | --- | --- |
| 0:15 | Tap "Add a problem", take or choose the photo, type a short note | "Take a photo of the problem. Add a note if you want." |
| 0:25 | Tap Analyze. Wait for the result. | "Gemma 4 describes only what it can see. It doesn't guess the cause or give legal advice." |
| 0:40 | Scroll: observations, "What the photo can't tell us" | "It also lists what the photo can't tell us." |
| 0:50 | Change one field, for example urgency. Tap Save changes. | "It's a draft. You check and fix every field." |
| 1:05 | Tap "Write an email about this", then "Write the email" | "It writes a short, neutral email from the facts you approved." |
| 1:20 | Tap "Copy email" | "FixProof never sends anything. You read it and send it yourself." |
| 1:30 | Go to Report. Show the date, the fingerprint, "Unchanged since saved". | "Every photo gets a server timestamp and a fingerprint. If the photo changes, the fingerprint changes. Timestamped and verifiable." |
| 1:45 | Tap "Print or save as PDF" | "One tap gives a printable report for the landlord or a housing office." |

Do not say "legally admissible", "court-ready", or "proof of what happened". Say "timestamped and verifiable".

### 3. Failure case (about 15 seconds)

| Driver does | Narrator says |
| --- | --- |
| Add the blurry photo, Analyze | "When the photo isn't clear, it says so instead of guessing." |
| Show the "This photo isn't clear enough" panel | "It asks you to retake it." |

### 4. Rubric proof (about 30 seconds)

Show each briefly. Skip any line that is not true on demo day.

- Model: "Gemma 4, `gemma-4-26b-a4b-it`, through the Gemini API. Apache 2.0 license." (README, Model and license)
- Validation: "Every model answer is checked against a schema. Bad output gets one retry, then a clear error."
- Privacy: "Hosted mode sends photos to Google, and we say that on every page. Photos are stripped of GPS. Delete my case removes everything." Then tap Delete my case and confirm.
- Accessibility: "Keyboard only, screen reader labels, 44 pixel targets. axe found zero issues and Lighthouse accessibility is 100." (Show `docs/a11y-audit.md`.) [PENDING: re-run on the final build before saying the numbers.]
- Architecture: show the README diagram. "One Cloud Run service, Firestore, and a private bucket."
- Local mode: [PENDING: only mention if local Ollama mode was actually tested. Otherwise cut.]

### 5. Impact (about 10 seconds)

[PENDING: the real median times from `docs/timing-test.md`, with how many people ran it. Example shape only: "With N people, writing a request by hand took a median of X. With FixProof it took Y." Cut this if the test did not happen.]

> FixProof. Take a photo of a repair problem. We write it up and keep the record.

## Shot list

1. Title card: "FixProof" and the tagline (2 seconds)
2. Phone screen recording: the full live flow (sections 2 and 3)
3. Laptop screen: README model section, architecture diagram, a11y audit (section 4)
4. Phone: Delete my case and the empty log
5. Closing card: tagline, repo link, team names

## Recording checklist

- [ ] Quiet room, door closed, fan or AC off if loud
- [ ] Test the mic with a 10 second clip and listen back
- [ ] Phone screen recording on (iPhone: Control Center, Screen Recording; Android: Quick Settings, Screen record)
- [ ] Phone in Do Not Disturb, no personal notifications or names on screen
- [ ] Use a demo case only. No real addresses or names in notes or the email.
- [ ] Record one full take, watch it, then record a backup take
- [ ] Save the backup video in two places (laptop and cloud drive)
- [ ] Time it. Stay under 3 minutes.
