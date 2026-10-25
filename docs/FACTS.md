# Checked project facts

Last checked on 2026-10-25. Cloud setup and live diagnostic results were supplied by Sid from Terminal unless noted.

| Fact | Value | Status |
| --- | --- | --- |
| Project ID | `fixproof-512621` | Confirmed |
| Region | `us-east1` | Confirmed |
| Firestore | `(default)`, native mode | Live create, save, edit, and delete passed |
| Photo bucket | `fixproof-512621-fixproof-photos` | Live upload, download, hash check, and cleanup passed |
| Bucket access | Uniform access and public access prevention requested at creation | Independent settings read-back pending |
| Required Cloud APIs | Run, Build, Artifact Registry, Firestore, Storage, Secret Manager | Enable operation succeeded |
| Exact Gemma model ID | `gemma-4-26b-a4b-it` | Live access and generation passed |
| Model license | [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) | Listed by [Google model card](https://ai.google.dev/gemma/docs/core/model_card_4) |
| Hosted API terms | https://ai.google.dev/gemini-api/terms | Official terms link |
| Cloud Run URL | https://fixproof-774631300212.us-east1.run.app | Health confirmed in Chrome on 2026-10-25; last revision reported by Sid was `fixproof-00003-ljj` |
| App identity | `fixproof-run@fixproof-512621.iam.gserviceaccount.com` | Dedicated service account |
| API key storage | Secret Manager, `gemini-api-key`, version 2 | Validated, saved, and attached to the live revision |
| Hackathon credit and budget alert | Pending confirmation | Not verified |

Never put API keys in this file.

## Gemma API capabilities

The direct diagnostic passed for the selected model on 2026-10-24:

- Model access and basic text generation.
- Image input with a system instruction.
- FixProof's JSON MIME type and response JSON schema in the same request.

Several images in one real model request still need testing. The API's three-photo upload path passes local tests. The [official Gemma API guide](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api) also documents image input and system instructions.

## Live validation

Sid ran `scripts/update-key.sh` successfully. The generated solid-color image completed photo upload, model analysis, entry save, hash verification, edit, and deletion. Email was skipped because the image was not a housing concern. Case deletion checks that the stored files and entry records are gone before returning success.

This proves connectivity and the basic pipeline. It does not establish model accuracy on real apartment photos. Sid subsequently reported that the real-photo phone flow worked, including email generation, copying, printing, and deletion. Adversarial-photo evaluation and a final check after the newest frontend changes remain pending.

The expanded API also builds and passes 15 local checks. Route tests use in-memory storage. The container build for both frontend and API passed during the full-app deployment.

## Resolved setup issues

The original saved credential was rejected by the Gemini API with HTTP 401 and `ACCESS_TOKEN_TYPE_UNSUPPORTED`. The replacement key passed model access but encountered HTTP 402 while the prepaid balance was empty. Sid resolved account setup and billing. The subsequent generation and live pipeline checks passed. No secret values were recorded.

## Privacy and local mode

Hosted mode sends processed photos and notes to Google through the Gemini API. Local mode uses Ollama for inference; this deployment still stores photos and reports in Google Cloud. Local inference has not yet been tested on a laptop.

## Repository check

A scan of all locally available Git history on 2026-10-24 found no candidate Google API keys, GitHub tokens, Google access tokens, or private-key blocks. This pattern scan is not a guarantee against every secret format.

## Submission audit, 2026-10-25

- Live health returned `ok: true`, model `gemma-4-26b-a4b-it`, mode `hosted` in Chrome.
- API build and 15 automated tests passed again. All 25 frontend contrast checks passed.
- GitHub metadata confirms the repository is public and its license is MIT.
- Latest fetched frontend commit: `c1b93a5`, real-API fixes from F22 testing. Deployment of that exact commit is not yet confirmed.
- All six evaluation photos are missing from the repository, and EVAL records NOT RUN for them.
- Interview and timing result tables are empty. Personas have not been supplied.
- Final deployed accessibility checks, human screen-reader testing, the video link, and official deadline confirmation remain outstanding.
