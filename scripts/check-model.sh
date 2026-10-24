#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../api"
echo 'Checking the saved key directly with Google. No deployment is needed.'
gcloud secrets versions access latest --secret=gemini-api-key --project=fixproof-512621 | node --import tsx scripts/check-model.ts
