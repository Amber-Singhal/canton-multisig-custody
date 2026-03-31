# Canton Multisig Custody Library

This library provides a robust and secure foundation for implementing M-of-N quorum approvals, time-locked execution, emergency asset freeze, and hardware wallet integration within the Canton Network. It aims to meet stringent security standards like SOC 2 and ISO 27001, making it suitable for institutional custody operations.

## Overview

The core of this library revolves around the concept of multi-signature (multisig) control over assets. It enables a distributed group of signers to jointly authorize transactions, enhancing security and preventing single points of failure.

**Key Features:**

*   **M-of-N Quorum Approval:** Requires a specified number (M) of signers from a designated group (N) to approve any operation.
*   **Time-Locked Execution:** Allows transactions to be scheduled for execution at a future time, subject to multisig approval.
*   **Emergency Asset Freeze:** Provides a mechanism to freeze assets in case of a security breach or other emergency, requiring a separate multisig threshold for activation and deactivation.
*   **Hardware Wallet Integration:** Designed to be compatible with hardware wallets, ensuring that private keys are securely stored and transactions are signed offline.
*   **Compliance-Focused:** Built with SOC 2 and ISO 27001 requirements in mind, providing a framework for compliant custody operations.

## Architecture

The library leverages Daml smart contracts to define and enforce the multisig custody logic.  Key Daml templates include:

*   **CustodianRole:**  Defines the parties authorized to act as custodians.  Each custodian is a signatory on key contracts.
*   **MultisigRequest:** Represents a request for a specific action, such as transferring assets. Requires M-of-N approvals from custodians before execution.
*   **TimeLockedTransaction:**  Schedules a transaction for future execution, requiring multisig approval both for scheduling and execution.
*   **EmergencyFreeze:**  Implements the asset freeze mechanism, governed by a separate multisig threshold.

## Integration Guide

### 1. Prerequisites

*   Daml SDK (version 3.1.0 or later)
*   Canton Network access
*   Understanding of Daml and Canton concepts

### 2. Installation

Clone the repository:

```bash
git clone <repository_url>
cd canton-multisig-custody
```

Build the Daml archive (DAR):

```bash
daml build
```

This will create a `.dar` file in the `dist/` directory.

### 3. Deployment

Deploy the DAR file to your Canton participant.  Consult your Canton operator for specific deployment procedures.

### 4. Setting up Custodians

Create `CustodianRole` contracts for each authorized custodian party.  This establishes their role and permissions within the custody system.

```daml
-- Example: Creating a CustodianRole contract

template CustodianRole
  with
    custodian : Party
  where
    signatory custodian
    observer custodian
    controller custodian
    choice Activate : ContractId CustodianRole
      controller custodian
      do
        return contractId
```

### 5. Submitting a Multisig Request

To initiate an action, create a `MultisigRequest` contract, specifying the desired operation and requiring M-of-N approvals from the custodians.

```daml
-- Example: Creating a MultisigRequest contract

template MultisigRequest
  with
    signers : [Party]
    threshold : Int
    payload : Text  --  Data representing the requested action
    approvals : [Party]
    executed : Bool
  where
    signatory signers
    ensure threshold > 0 && threshold <= length signers
    controller signers
    choice Approve : ContractId MultisigRequest
      controller signer
      do
        -- Logic to approve the request
        return contractId
```

### 6. Approving a Multisig Request

Each custodian can exercise the `Approve` choice on the `MultisigRequest` contract to register their approval. Once the required threshold of approvals is reached, the request can be executed.

### 7. Executing a Multisig Request

After reaching the approval threshold, exercise a choice (defined within the `MultisigRequest` or related contract) to execute the requested action.  This typically involves transferring assets or performing other operations.

### 8. Time-Locked Transactions

To schedule a transaction for future execution, create a `TimeLockedTransaction` contract. This contract will hold the transaction details and a timestamp for execution.  Multisig approval is required both for scheduling the transaction and for authorizing its execution when the time lock expires.

### 9. Emergency Asset Freeze

In emergency situations, create an `EmergencyFreeze` contract to freeze the assets. This requires a separate multisig threshold for activation and deactivation, ensuring that the freeze can only be initiated and lifted with appropriate authorization.

### 10. Hardware Wallet Integration

When creating `MultisigRequest` contracts and exercising approval choices, integrate with hardware wallets to securely sign transactions offline. This ensures that private keys are never exposed to the online environment.  (Consult your hardware wallet's documentation for API integration details).

## Example Scenario: Asset Transfer

1.  A user initiates a request to transfer 100 tokens from a custody account.
2.  A `MultisigRequest` contract is created, specifying the transfer details and requiring 2-of-3 custodian approvals.
3.  Two of the three custodians approve the request by exercising the `Approve` choice on the `MultisigRequest` contract, using their hardware wallets to sign the approval transactions.
4.  Once the approval threshold is reached, a designated party can exercise the execution choice to transfer the tokens.

## API Endpoints (Example)

The following endpoints provide a simplified example of interacting with the contracts.  These are illustrative and require adaptation based on your specific implementation and Canton setup.

*   **Create Custodian Role:**

    `POST /v1/create`

    ```json
    {
      "templateId": "ModuleName:CustodianRole",
      "payload": {
        "custodian": "Participant1"
      }
    }
    ```

*   **Create Multisig Request:**

    `POST /v1/create`

    ```json
    {
      "templateId": "ModuleName:MultisigRequest",
      "payload": {
        "signers": ["Participant1", "Participant2", "Participant3"],
        "threshold": 2,
        "payload": "Transfer 100 tokens"
      }
    }
    ```

*   **Approve Multisig Request:**

    `POST /v1/exercise`

    ```json
    {
      "contractId": "ContractIdOfMultisigRequest",
      "choice": "Approve"
    }
    ```

## Security Considerations

*   **Key Management:**  Securely store and manage private keys for all custodians, preferably using hardware wallets.
*   **Auditing:** Implement comprehensive auditing mechanisms to track all transactions and approvals.
*   **Regular Security Reviews:** Conduct regular security reviews and penetration testing to identify and address potential vulnerabilities.

## Disclaimer

This library is provided as-is, without any warranty.  Use it at your own risk.  It is essential to conduct thorough testing and security reviews before deploying it in a production environment.