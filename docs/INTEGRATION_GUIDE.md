# Integration Guide — Canton Multisig Custody Standard

## Prerequisites

- Daml SDK 3.1.0+
- Canton participant node (self-hosted or NaaS)
- 3–7 registered custodian parties

## Step 1 — Add the library as a dependency

```yaml
# daml.yaml
dependencies:
  - daml-prim
  - daml-stdlib
  - canton-multisig-custody-0.3.0.dar
```

## Step 2 — Create a quorum approval request

```daml
import Custody.QuorumApproval

qCid <- create QuorumApprovalRequest with
  custodyId  = "withdrawal-" <> show transactionId
  authority  = custodyAuthority
  custodians = [bitgo, fireblocks, anchorage]
  threshold  = 2
  payload    = "transfer " <> show amount <> " CC to " <> show recipient
  deadline   = addRelTime now (days 1)
```

## Step 3 — Custodians approve

Each custodian reviews and approves on their own Canton participant:

```daml
exercise qCid GrantApproval with
  approver = fireblocks
  comment  = "Amount verified against withdrawal request WR-4821"
```

## Step 4 — Execute after time-lock

```daml
import Custody.TimeLock

lockCid <- create CustodyTimeLock with
  custodyId     = "withdrawal-" <> show transactionId
  authority     = custodyAuthority
  custodians    = [bitgo, fireblocks, anchorage]
  payload       = ...
  executeAfter  = addRelTime now (hours 24)
  executeBefore = addRelTime now (hours 48)
  approvalCount = 2

-- After 24h review window:
exercise lockCid Execute
```

## Step 5 — Emergency freeze

```daml
import Custody.EmergencyFreeze

exercise freeze InitiateFreeze with
  reason = "Potential key compromise detected"
```

All pending operations halt immediately. Resume requires M-of-N custodian approval.
