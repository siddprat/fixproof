# Checked project facts

Checked on 2026-10-24. Cloud setup results were supplied by Sid from Terminal.

| Fact | Value | Status |
| --- | --- | --- |
| Project ID | `fixproof-512621` | Confirmed by Sid |
| Region | `us-east1` | Confirmed in Firestore output |
| Firestore | `(default)`, native mode | Creation succeeded |
| Photo bucket | `fixproof-512621-fixproof-photos` | Create command returned without error; read-back check pending |
| Bucket access | Uniform access and public access prevention requested | Read-back check pending |
| Required Cloud APIs | Run, Build, Artifact Registry, Firestore, Storage, Secret Manager | Enable operation succeeded |
| Exact Gemma model ID | `gemma-4-26b-a4b-it` | Selected with Sid on 2026-10-24; live request pending |
| Model license URL | https://www.apache.org/licenses/LICENSE-2.0 | Listed by Google model card on 2026-10-24 |
| Hosted API terms URL | https://ai.google.dev/gemini-api/terms | Review pending |
| Cloud Run URL | https://fixproof-774631300212.us-east1.run.app | Full app revision fixproof-00002-zg4 deployed; Sid supplied successful output on 2026-10-24 |
| Hackathon credit and budget alert | Pending confirmation | Not verified |

No API keys belong in this file.

## Model sources

- https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api lists the selected model and image input.
- https://ai.google.dev/gemma/docs/core/model_card_4 lists Apache 2.0 as the model license.
- Google documents system instructions and image input for this model. JSON mode and response schema support are not documented on that Gemma page. The service attempts structured output and falls back to prompt-only JSON only after an explicit unsupported-feature error. Live capability testing is still pending.

## Deployment identity

The deployment script creates a dedicated `fixproof-run` service account. It can access the API key secret, Firestore, and the photo bucket. The key stays in Secret Manager.

## Validation status

- Sid ran the initial build and two checks successfully before the first deploy.
- The expanded API builds locally and passes 15 automated checks as of 2026-10-24.
- Local route checks use in-memory test storage. They do not prove Cloud permissions or model quality.
- The next deploy includes the frontend and runs a generated-image smoke check against real storage and the configured model. It deletes its test case afterward.
- A human photo, adversarial-photo evaluation, phone test, and joint frontend test remain pending.

## Live check of revision fixproof-00002-zg4

Sid supplied the deployment output on 2026-10-24. Both frontend and API built and deployed. The generated-image request returned `502 AI_UNAVAILABLE`. The test case was deleted successfully. Key validity and model request compatibility are not yet established. Do not call the real-model integration complete.

## Authentication failure confirmed in Cloud Run logs

On 2026-10-24, the browser-visible Cloud Run logs for the 18:22:35 EDT test show `model_request_failed` with provider status `401`. The entries request lasted about 274 milliseconds. This identifies an authentication failure, not a timeout or a 429 rate-limit response. The validity and intended service of the saved key still need the direct diagnostic; no replacement key has been requested or installed.

## Direct saved-key diagnostic

Sid supplied the direct diagnostic output on 2026-10-24. Both GetModel and ListModels returned HTTP 401, UNAUTHENTICATED, with reason ACCESS_TOKEN_TYPE_UNSUPPORTED from generativelanguage.googleapis.com. The saved credential is not accepted by the Gemini API. This fails before image input or JSON options are tested. A correctly created AI Studio key must be checked before updating the service.
