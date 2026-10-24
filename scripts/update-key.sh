#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo 'Paste the Gemini API key from Google AI Studio. Input stays hidden. Press Enter when done.'
IFS= read -r -s FIXPROOF_NEW_KEY
echo
if [ -z "$FIXPROOF_NEW_KEY" ]; then
  echo 'No key entered. Stopping.' >&2
  exit 1
fi

echo 'Checking the new key before changing the saved secret...'
printf '%s' "$FIXPROOF_NEW_KEY" | (cd api && node --import tsx scripts/check-model.ts)

echo 'Saving the checked key...'
FIXPROOF_SECRET_NAME=$(printf '%s' "$FIXPROOF_NEW_KEY" | gcloud secrets versions add gemini-api-key --project=fixproof-512621 --data-file=- --format='value(name)')
unset FIXPROOF_NEW_KEY
FIXPROOF_SECRET_VERSION=${FIXPROOF_SECRET_NAME##*/}
if ! [[ "$FIXPROOF_SECRET_VERSION" =~ ^[0-9]+$ ]]; then
  echo 'Could not identify the new secret version. Stopping.' >&2
  exit 1
fi

echo 'Restarting the existing app with the new secret version. No image rebuild is needed...'
gcloud run services update fixproof --project=fixproof-512621 --region=us-east1 \
  --update-secrets="GEMINI_API_KEY=gemini-api-key:$FIXPROOF_SECRET_VERSION" --quiet

FIXPROOF_RUN_URL=$(gcloud run services describe fixproof --project=fixproof-512621 --region=us-east1 --format='value(status.url)')
npm run smoke --prefix api -- "$FIXPROOF_RUN_URL"
