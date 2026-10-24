#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_ID=fixproof-512621
REGION=us-east1
RUN_SA="fixproof-run@${PROJECT_ID}.iam.gserviceaccount.com"
MODEL=gemma-4-26b-a4b-it

echo 'Getting the latest shared code...'
git pull --rebase origin main

echo 'Installing and checking the API...'
npm ci --prefix api --no-audit --no-fund
npm run build --prefix api
npm test --prefix api
git push origin main

echo 'Checking Google Cloud access...'
gcloud projects describe "$PROJECT_ID" --format='value(projectId)'

echo 'Creating the identity used by the running app...'
if ! gcloud iam service-accounts describe "$RUN_SA" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create fixproof-run --display-name='FixProof app' --project="$PROJECT_ID"
fi

if ! gcloud secrets describe gemini-api-key --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo 'Paste your Gemini API key below. It will stay hidden. Press Enter when done.'
  IFS= read -r -s API_KEY
  echo
  if [ -z "$API_KEY" ]; then
    echo 'No key entered. Stopping.' >&2
    exit 1
  fi
  printf '%s' "$API_KEY" | gcloud secrets create gemini-api-key --replication-policy=automatic --data-file=- --project="$PROJECT_ID"
  unset API_KEY
else
  echo 'Using the API key already stored in Secret Manager.'
fi

gcloud secrets add-iam-policy-binding gemini-api-key --member="serviceAccount:$RUN_SA" --role=roles/secretmanager.secretAccessor --project="$PROJECT_ID" --quiet >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$RUN_SA" --role=roles/datastore.user --condition=None --quiet >/dev/null
gcloud storage buckets add-iam-policy-binding "gs://${PROJECT_ID}-fixproof-photos" --member="serviceAccount:$RUN_SA" --role=roles/storage.objectAdmin --quiet >/dev/null

echo 'Building and deploying the API. This can take a few minutes...'
gcloud run deploy fixproof --source . --project="$PROJECT_ID" --region="$REGION" \
  --service-account="$RUN_SA" --allow-unauthenticated \
  --max-instances=2 --concurrency=1 --memory=512Mi --timeout=60 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GCS_BUCKET=${PROJECT_ID}-fixproof-photos,GEMMA_MODEL=$MODEL,AI_MODE=hosted" \
  --set-secrets=GEMINI_API_KEY=gemini-api-key:latest --quiet

RUN_URL=$(gcloud run services describe fixproof --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')
echo "API deployed. Open: $RUN_URL/api/health"
echo 'Checking a generated test image through the live API...'
npm run smoke --prefix api -- "$RUN_URL"
