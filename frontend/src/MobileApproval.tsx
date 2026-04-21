import React, { useState } from 'react';
import { useLedger, useParty, useStreamFetchByKey } from '@c7/react';
import { Party } from '@daml/types';

// NOTE: This import path assumes DPM codegen has been run for a Daml project
// with name 'canton-multisig-custody' and version '0.1.0'.
// Adjust the path according to your `daml.yaml` and project structure.
import { ApprovalRequest } from '@daml.js/canton-multisig-custody-0.1.0/lib/Custody/PolicyEngine';

/**
 * Props for the MobileApproval component.
 * These values form the key to uniquely identify the ApprovalRequest contract.
 * @param policyCid - The contract ID of the governing Policy contract.
 * @param workflowId - The unique identifier for the transaction workflow.
 */
export interface MobileApprovalProps {
  policyCid: string;
  workflowId: string;
}

// --- Helper UI Components ---

const LoadingSpinner: React.FC = () => (
  <div className="w-6 h-6 border-4 border-white border-t-transparent border-solid rounded-full animate-spin"></div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
    <p className="font-bold">Error</p>
    <p>{message}</p>
  </div>
);

const SuccessMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
    <p className="font-bold">Success</p>
    <p>{message}</p>
  </div>
);

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-200">
    <span className="text-sm text-gray-500 font-medium">{label}</span>
    <span className="text-sm text-gray-800 font-mono break-all text-right ml-4">{value}</span>
  </div>
);


const RejectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  reason: string;
  setReason: (reason: string) => void;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onConfirm, reason, setReason, isSubmitting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Reject Transaction</h2>
        <p className="text-gray-600">Please provide a reason for rejecting this transaction. This will be recorded for audit purposes.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Incorrect amount, suspicious activity..."
          rows={4}
          disabled={isSubmitting}
        />
        <div className="flex justify-end gap-4">
          <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isSubmitting || !reason.trim()} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]">
            {isSubmitting ? <LoadingSpinner /> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * A mobile-first screen for approving or rejecting a pending transaction.
 * Designed for institutional custody flows, including HSM integration hooks.
 * This component fetches a specific `ApprovalRequest` contract and presents
 * choices to the logged-in user (the approver).
 */
const MobileApproval: React.FC<MobileApprovalProps> = ({ policyCid, workflowId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const ledger = useLedger();
  const party = useParty();
  const approver = party as Party;

  const { contract, loading } = useStreamFetchByKey(
    ApprovalRequest,
    () => ({ _1: policyCid, _2: workflowId, _3: approver }),
    [policyCid, workflowId, approver]
  );

  const handleApprove = async () => {
    if (!contract) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real-world scenario with an HSM, this `ledger.exercise` call
      // would be wrapped. The wrapper would initiate a request to the user's
      // hardware wallet or secure enclave, await the cryptographic signature,
      // and then submit the signed command to the ledger.
      await ledger.exercise(ApprovalRequest.Approve, contract.contractId, {});
      setSuccess("Transaction approved successfully.");
    } catch (err: any) {
      console.error("Approval failed:", err);
      setError(err.message || "An unknown error occurred during approval.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!contract || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      await ledger.exercise(ApprovalRequest.Reject, contract.contractId, { reason: rejectionReason });
      setSuccess("Transaction rejected successfully.");
    } catch (err: any)      {
      console.error("Rejection failed:", err);
      setError(err.message || "An unknown error occurred during rejection.");
    } finally {
      setIsSubmitting(false);
      setShowRejectionModal(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="w-16 h-16 border-8 border-gray-300 border-t-blue-600 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full"><SuccessMessage message={success} /></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage message="Approval request not found. It may have already been processed or you do not have permission to view it." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen font-sans flex flex-col items-center py-4">
      <div className="max-w-md w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <header className="bg-gray-800 text-white p-4 text-center">
          <h1 className="text-xl font-bold">Transaction Approval</h1>
          <p className="text-sm text-gray-300 mt-1 font-mono">{contract.payload.workflowId}</p>
        </header>

        <main className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Request Details</h2>
            {/* The payloadDescription would contain a human-readable summary of the transaction */}
            <p className="text-gray-600 text-base bg-gray-50 p-3 rounded-md">{contract.payload.payloadDescription}</p>
            <DetailRow label="Requestor" value={contract.payload.requestor} />
            <DetailRow label="Timestamp" value={new Date(contract.payload.timestamp).toLocaleString()} />
            <DetailRow label="Status" value={
              <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                Pending Your Approval
              </span>
            } />
          </div>
          {error && <ErrorMessage message={error} />}
        </main>

        <footer className="p-4 bg-gray-50 grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowRejectionModal(true)}
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-h-[52px]"
          >
            {isSubmitting ? <LoadingSpinner /> : 'Approve'}
          </button>
        </footer>
      </div>
      
      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={handleReject}
        reason={rejectionReason}
        setReason={setRejectionReason}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default MobileApproval;