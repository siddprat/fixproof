# FixProof

Photo-based repair documentation for renters.

Status: hackathon build in progress

## What it does <!-- owner: shared -->

## Demo <!-- owner: shared -->

## Usage <!-- owner: friend -->

Open the app on your phone. There is no account and no login. Your case lives in this browser.

1. **Add a problem.** Tap "Add a problem". Take a photo or choose up to 3 from your phone. Add a short note if you want, by typing or with "Dictate your note". Tap Analyze.
2. **Check the draft.** FixProof lists what it can see, the type of problem, where it is, and how urgent it looks. It also lists what the photo can't tell us. Every field is an AI draft. Fix anything that is wrong and tap Save changes.
3. **Write an email.** Tap "Write an email". Pick the problems to include. Choose first email or follow-up. Add your name, your landlord's name, and your unit if you want (kept only in this browser). Edit the draft, then tap "Copy email" or "Open in my mail app". FixProof never sends anything for you.
4. **Print a report.** Tap "Print report". It lists each problem oldest first with photos, the server time it was saved, and a fingerprint (SHA-256) for each photo. It checks each fingerprint and shows "Unchanged since saved". Tap "Print or save as PDF".
5. **Delete my case.** On the log screen, tap "Delete my case" and confirm. This deletes every photo and note on the server and clears this browser. It cannot be undone.

If a photo is unclear, the app says so and asks for a retake. If it is not a housing problem, the app says so and turns off email for that entry. If something may be urgent, a red banner says to call 911 if anyone is in danger, or the landlord's emergency maintenance line.

For frontend development without the API: `cd web && cp .env.example .env.local && npm install && npm run dev`. Add `?mock=seed` to the URL for sample entries, `?mock=fail-ai` or `?mock=invalid` to see error states, and `?mock=off` to go back to normal.

## Accessibility <!-- owner: friend -->

Target: WCAG 2.2 AA. Full results and what is still open: [docs/a11y-audit.md](docs/a11y-audit.md).

- Works with a keyboard alone. A "Skip to main content" link comes first, focus moves to each new page's heading, and every focused control has a visible outline.
- Screen readers: every control has a label, every photo has alt text (written by the AI and editable), and status messages and errors are announced.
- Text contrast is at least 4.5 to 1 for every color pair, checked by `npm run contrast` in `web/`.
- Tap targets are at least 44 px. Layout works at 320 px wide and at 200 percent zoom with no sideways scrolling.
- Respects reduced motion. Prints in black on white.
- Optional voice note with the browser's speech recognition. The app says this may send audio to Google or Apple.

Automated results so far, on mock data: axe-core found 0 issues across 36 screen states, and Lighthouse accessibility scored 100. A real screen reader pass on a phone is still to do.

## Personas, composites <!-- owner: friend -->

Pending. These will be written from our real interviews at the event ([script](docs/interviews.md)) and labeled as composites, not real people.

## Impact <!-- owner: friend -->

Pending. We will report only measured results from the [timing test](docs/timing-test.md) and quotes people gave permission to use.

## Architecture <!-- owner: Sid -->

The phone browser, frontend, and API share one Cloud Run address. See [the architecture and data model](docs/ARCHITECTURE.md).

```mermaid
flowchart LR
  Phone[Phone browser] --> Run[Cloud Run: frontend and API]
  Run --> Model[Gemma 4 through Gemini API]
  Run --> DB[Firestore: reports]
  Run --> Photos[Private Cloud Storage: photos]
  Secrets[Secret Manager] --> Run
```

## Model and license <!-- owner: Sid -->

The selected model is `gemma-4-26b-a4b-it`, accessed through the Gemini API. Model access, image input, system instructions, and structured JSON passed live checks. A generated image completed the save, edit, verify, and delete flow. Real housing-photo and email checks remain pending.

- [Google's Gemma API guide](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)
- [Model card](https://ai.google.dev/gemma/docs/core/model_card_4) and [Apache 2.0 model license](https://www.apache.org/licenses/LICENSE-2.0)
- [Hosted Gemini API terms](https://ai.google.dev/gemini-api/terms)

Model output is checked against the API schema. Invalid output gets one correction attempt. A schema check does not prove that an observation is accurate. Users must review the draft.

## Setup <!-- owner: Sid -->

Use Node 20.19 or later within Node 20, and npm. The frontend belongs to the separate `web/` lane.

```sh
git clone https://github.com/siddprat/fixproof.git
cd fixproof
npm ci --prefix api
npm ci --prefix web
cp .env.example .env
```

Fill the root `.env` with `GOOGLE_CLOUD_PROJECT`, `GCS_BUCKET`, and `GEMMA_MODEL=gemma-4-26b-a4b-it`. Set `AI_MODE=hosted` and `MOCK_AI=1` for canned model results. Remove optional blank variables or fill them in. Do not commit `.env`.

For real Google storage on your laptop, run `gcloud auth application-default login`. This is separate from `gcloud auth login`. The signed-in account needs access to Firestore and the bucket.

```sh
npm run dev --prefix api
```

In another Terminal:

```sh
VITE_USE_MOCK=false npm run dev --prefix web
```

`MOCK_AI=1` replaces only model calls. Storage is still real. The default canned result is the hazard example. Notes containing `[mock:blurry]` or `[mock:unrelated]` select other fixtures. These are test results, not photo assessments. `VITE_USE_MOCK=true` instead runs the frontend's in-browser fixtures without an API.

For real inference, set `MOCK_AI=0` and supply `GEMINI_API_KEY` in the root `.env` or process environment. To test one photo:

```sh
cd api
npm run try-analyze -- /absolute/path/to/photo.jpg
```

For optional local inference, set `AI_MODE=local`, `OLLAMA_URL=http://localhost:11434`, and `OLLAMA_MODEL` to an installed image-capable model. Local inference has not yet been tested on a laptop. Cloud storage is still used.

```sh
npm run build --prefix api
npm test --prefix api
```

Once the six staged photos listed in `docs/test-photos/README.md` are supplied, run:

```sh
npm run eval --prefix api -- https://fixproof-774631300212.us-east1.run.app
```

This writes `docs/EVAL.md` and deletes its evaluation case. The report records missing photos without inventing results. A human must review observations as well as the automated field checks.

## Deploy to Google Cloud <!-- owner: Sid -->

Project: `fixproof-512621`. Region: `us-east1`. The full app deployed successfully. Revision `fixproof-00003-ljj` passed the live generated-image check. A real housing photo and the full phone flow still need testing.

Services enabled: Cloud Run, Cloud Build, Artifact Registry, Firestore, Cloud Storage, and Secret Manager. Firestore uses native mode. The bucket `fixproof-512621-fixproof-photos` was created with uniform access and public access prevention.

From the repository root:

```sh
bash scripts/deploy.sh
```

The script pulls and pushes main, builds and tests the API, creates a dedicated app identity if needed, privately asks for a key only if no secret exists, and deploys the Dockerfile. The Dockerfile builds both the frontend and API. It sets `VITE_USE_MOCK=false` for the hosted frontend. Deployment uses a maximum of two instances, 512 MiB memory, concurrency one, and a 60-second request timeout. The key comes from Secret Manager. After deployment, the script runs a generated-image smoke check and deletes its own test case.

To check a real housing photo through the deployed API:

```sh
npm run smoke --prefix api -- https://fixproof-774631300212.us-east1.run.app /absolute/path/to/photo.jpg
```

This uploads the chosen photo, checks the report, edits it, requests an email if it shows a housing concern, verifies hashes, and deletes the test case. It does not send email.

## Privacy and data flow <!-- owner: Sid -->

Hosted mode sends processed photos and notes to Google through the Gemini API. It is not private local processing. Stored photos are resized JPEGs with GPS and other metadata removed. Firestore stores notes, server times, unverified camera times, analysis, and photo hashes. Cloud Storage stores the processed images.

There are no accounts, analytics, or email sending. The case ID is the only access key. Keep links and local browser storage private. Anyone with a case ID can read or delete that case.

Delete my case removes its Firestore records and stored photos. This does not erase infrastructure request logs or promise deletion of data retained by an AI provider. Optional Ollama inference avoids sending inputs to the Gemini API; storage in this deployment still uses Google Cloud.

Records are timestamped and verifiable. A hash detects changes to stored bytes. It does not prove when a photo was taken, what it shows, or who took it.

## Known limits <!-- owner: shared -->

## License <!-- owner: Sid -->

FixProof code is available under the [MIT license](LICENSE). The model and hosted service have their own license and terms, linked above.
