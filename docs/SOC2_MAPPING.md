# SOC 2 Control Mapping

This document maps the Canton Multisig Custody Standard to SOC 2 Type II controls.

## CC6 — Logical and Physical Access Controls

| SOC 2 Control | Implementation |
|---|---|
| CC6.1 — Logical access restrictions | Canton's signatory model restricts all operations to registered custodians only |
| CC6.2 — Prior to issuing credentials | `ProviderRegistry` pattern ensures only approved custodians appear in quorum lists |
| CC6.3 — Access removal | Custodian removal requires new quorum contract with updated custodian list |
| CC6.6 — External threats | Canton's BFT consensus resists Byzantine operators; no single custodian can execute unilaterally |
| CC6.7 — Transmission of data | All Canton traffic is TLS-encrypted; contracts visible only to signatories/observers |

## CC7 — System Operations

| SOC 2 Control | Implementation |
|---|---|
| CC7.1 — Vulnerability detection | `canton-security-audit-framework` provides static analysis on every PR |
| CC7.2 — Monitor system components | `canton-node-health-dashboard` exports Prometheus metrics for all custody nodes |
| CC7.3 — Evaluate security events | `AuditTrail.daml` creates immutable on-ledger records of every custody event |

## CC8 — Change Management

| SOC 2 Control | Implementation |
|---|---|
| CC8.1 — Change management process | All custody parameter changes require M-of-N quorum approval via `QuorumApprovalRequest` |
| CC8.1 — Time-locks | `CustodyTimeLock` enforces mandatory review periods before high-value operations execute |

## CC9 — Risk Mitigation

| SOC 2 Control | Implementation |
|---|---|
| CC9.2 — Business disruption | `EmergencyFreeze` can halt all operations instantly with a single security officer action |
| CC9.2 — Recovery | Freeze can be lifted with M-of-N custodian quorum; audit trail preserved |

## ISO 27001 Alignment

The custody contracts also satisfy key ISO 27001:2022 controls:
- **A.8.2** — Privileged access rights managed via Canton signatory model
- **A.8.15** — Logging via `AuditTrail.daml` (immutable, tamper-proof)
- **A.8.24** — Cryptographic key management via HSM attestation contract
