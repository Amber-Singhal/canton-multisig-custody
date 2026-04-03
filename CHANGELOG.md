# Changelog — Canton Multisig Custody Standard

## [0.3.0] — 2026-04-03

### Added
- `Custody/QuorumApproval.daml` — M-of-N approval with deadline enforcement
- `Custody/TimeLock.daml` — mandatory review window before execution
- `Custody/EmergencyFreeze.daml` — instant halt with multi-approver unfreeze
- `Custody/HardwareWalletAttestation.daml` — HSM-signed operation verification
- `Custody/AuditTrail.daml` — immutable on-ledger audit event log
- `CustodyTest.daml` — 2-of-3, emergency freeze, and time-lock test scenarios
- `BitGoPattern.daml` — concrete BitGo-style custody workflow example
- SOC 2 and ISO 27001 control mapping documentation
- React `ApprovalQueue` UI with progress rings
- CI pipeline for all custody scenario tests
- Full integration guide for custodians

## [0.2.0] — 2026-03-25

### Added
- Initial Daml contracts: QuorumApproval, TimeLock, EmergencyFreeze, HardwareWalletAttestation

## [0.1.0] — 2026-03-18

### Added
- Initial scaffolding, README, daml.yaml
