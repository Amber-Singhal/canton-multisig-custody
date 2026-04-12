# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Support for rotating signatory keys within a quorum.
- Integration with Canton Network's identity and verifiable credential services.

### Changed
- Improved performance of audit trail queries by optimizing contract observers.

## [0.1.0] - 2024-10-26

### Added
- **Initial Release** of the Canton Multi-Signature Custody library.
- **M-of-N Quorum Approval**: Core `Quorum` and `ApprovalRequest` templates for multi-party authorization of critical operations.
- **Time-Locked Execution**: `TimeLock` template to enforce a mandatory cooling-off period before a transaction can be executed, preventing immediate unauthorized actions.
- **Emergency Asset Freeze**: `EmergencyFreeze` contract and associated workflow, allowing designated administrators to temporarily halt all outgoing transfers from a custody account in case of a security incident.
- **Hardware Wallet Attestation**: `HardwareWalletAttestation` template to cryptographically verify that a transaction was signed by a specific, registered hardware device (e.g., Ledger, Trezor). This is crucial for SOC 2 compliance.
- **Comprehensive Audit Trail**: `AuditTrail` template and helper choices that create an immutable, append-only log of every significant action, such as approval requests, executions, and configuration changes.
- **Daml Script Tests**: Initial test suite in `daml/test/CustodyTest.daml` covering the primary workflows for quorum approval and time-locking.
- **Project Configuration**: `daml.yaml` and `.gitignore` set up for a standard DPM project.