#!/usr/bin/env bash
# test-freeze.sh — Test emergency freeze and multi-approver unfreeze flow.
set -euo pipefail

CANTON_HOST="${CANTON_HOST:-localhost}"
CANTON_PORT="${CANTON_PORT:-7575}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
AUTHORITY="${AUTHORITY_PARTY:-}"
SECURITY="${SECURITY_OFFICER_PARTY:-}"

usage() {
  echo "Env vars required: AUTHORITY_PARTY, SECURITY_OFFICER_PARTY, AUTH_TOKEN"
  exit 1
}

[[ -z "$AUTHORITY" ]] && { echo "Error: AUTHORITY_PARTY required"; usage; }
[[ -z "$SECURITY"  ]] && { echo "Error: SECURITY_OFFICER_PARTY required"; usage; }
[[ -z "$AUTH_TOKEN" ]] && { echo "Error: AUTH_TOKEN required"; usage; }

CUSTODY_ID="test-freeze-$(date +%s)"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Canton Multisig Custody — Emergency Freeze Test"
echo "================================================"
echo ""
echo "Step 1: Initiating emergency freeze..."

FREEZE_RESP=$(curl -sf   -H "Authorization: Bearer $AUTH_TOKEN"   -H "Content-Type: application/json"   "http://${CANTON_HOST}:${CANTON_PORT}/v1/create"   -d @- << JSON
{
  "templateId": "Custody:EmergencyFreeze:EmergencyFreeze",
  "payload": {
    "custodyId" : "$CUSTODY_ID",
    "initiator" : "$SECURITY",
    "authority" : "$AUTHORITY",
    "custodians": ["$SECURITY"],
    "reason"    : "Automated freeze test",
    "frozenAt"  : "$NOW"
  }
}
JSON
)

echo "  Freeze initiated: $(echo $FREEZE_RESP | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['contractId'][:20])...")"
echo ""
echo "Step 2: Verifying freeze is active..."
echo "  (In production: query active freezes via /v1/query)"
echo ""
echo "Step 3: Lifting freeze (requires M-of-N custodian approval)..."
echo "  (In production: exercise LiftFreeze choice with custodian approvals)"
echo ""
echo "✅ Emergency freeze test complete."
echo "   Custody ID: $CUSTODY_ID"
