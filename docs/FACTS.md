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
| Cloud Run URL | Pending deployment | Not deployed |
| Hackathon credit and budget alert | Pending confirmation | Not verified |

No API keys belong in this file.

## Model sources

- https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api lists the selected model and image input.
- https://ai.google.dev/gemma/docs/core/model_card_4 lists Apache 2.0 as the model license.
- Live API support for system instructions, JSON mode, response schemas, and several images still needs testing.

## Deployment identity

The deployment script creates a dedicated `fixproof-run` service account. It can access the API key secret, Firestore, and the photo bucket. The key stays in Secret Manager.
