#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-dev_owner_1}"
ORG_HEADER="${ORG_HEADER:-org_replace_me}"

common_headers=(
  -H "Authorization: Bearer ${AUTH_TOKEN}"
  -H "Content-Type: application/json"
  -H "x-org-id: ${ORG_HEADER}"
)

echo "Create organization"
curl -sS -X POST "${API_URL}/organizations" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Real Elite Contracting","slug":"real-elite-contracting"}'

echo "Create job"
curl -sS -X POST "${API_URL}/jobs" "${common_headers[@]}" \
  -d '{"name":"Smith Roof Replacement","budgetTotalCents":2500000,"budgetMaterialsCents":1400000,"budgetLaborCents":800000}'

echo "Create upload URL"
UPLOAD_RESPONSE=$(curl -sS -X POST "${API_URL}/receipts/upload" "${common_headers[@]}" \
  -d '{"fileName":"receipt.jpg","contentType":"image/jpeg"}')

echo "${UPLOAD_RESPONSE}"

echo "Queue OCR processing"
RECEIPT_ID=$(echo "${UPLOAD_RESPONSE}" | sed -n 's/.*"receiptId":"\([^"]*\)".*/\1/p')
if [[ -n "${RECEIPT_ID}" ]]; then
  curl -sS -X POST "${API_URL}/receipts/${RECEIPT_ID}/process" "${common_headers[@]}"
fi

echo "List receipts"
curl -sS -X GET "${API_URL}/receipts" "${common_headers[@]}"
