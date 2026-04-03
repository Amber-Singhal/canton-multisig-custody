import React, { useState } from 'react';

interface ApprovalItem {
  custodyId    : string;
  payload      : string;
  threshold    : number;
  approvalCount: number;
  custodians   : string[];
  deadline     : string;
  status       : 'Pending' | 'Approved' | 'Expired' | 'Frozen';
}

function ProgressRing({ approved, total }: { approved: number; total: number }) {
  const pct = total > 0 ? (approved / total) * 100 : 0;
  return (
    <div className="progress-ring" title={`${approved}/${total} approvals`}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#2a2d3e" strokeWidth="4" />
        <circle
          cx="22" cy="22" r="18" fill="none"
          stroke={pct >= 100 ? '#22c55e' : '#5b6af9'} strokeWidth="4"
          strokeDasharray={`${pct * 1.131} 113.1`}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
        />
        <text x="22" y="26" textAnchor="middle" fontSize="10" fill="#f1f5f9">
          {approved}/{total}
        </text>
      </svg>
    </div>
  );
}

function ApprovalCard({ item, onApprove }: { item: ApprovalItem; onApprove: (id: string) => void }) {
  const deadlineDt  = new Date(item.deadline);
  const isExpired   = deadlineDt < new Date();
  const isComplete  = item.approvalCount >= item.threshold;

  const statusColor: Record<string, string> = {
    Pending: '#5b6af9', Approved: '#22c55e', Expired: '#ef4444', Frozen: '#f59e0b',
  };

  return (
    <div className="approval-card">
      <div className="approval-header">
        <span className="custody-id">{item.custodyId}</span>
        <span className="approval-status" style={{ background: statusColor[item.status] }}>
          {item.status}
        </span>
      </div>

      <div className="approval-body">
        <code className="approval-payload">{item.payload}</code>
        <div className="approval-meta">
          <ProgressRing approved={item.approvalCount} total={item.custodians.length} />
          <div className="meta-text">
            <span>Threshold: {item.threshold}-of-{item.custodians.length}</span>
            <span>Deadline: {deadlineDt.toLocaleString()}</span>
            {isExpired && <span className="expired-badge">EXPIRED</span>}
          </div>
        </div>
      </div>

      {item.status === 'Pending' && !isExpired && !isComplete && (
        <button className="btn-approve" onClick={() => onApprove(item.custodyId)}>
          Grant Approval
        </button>
      )}
    </div>
  );
}

export default function ApprovalQueue() {
  const [items] = useState<ApprovalItem[]>([]);
  const pending = items.filter(i => i.status === 'Pending').length;

  const handleApprove = (custodyId: string) => {
    console.log('Approve:', custodyId);
  };

  return (
    <div className="approval-queue">
      <div className="queue-header">
        <h2>Custody Approval Queue</h2>
        {pending > 0 && <span className="pending-badge">{pending} pending</span>}
      </div>

      {items.length === 0 ? (
        <div className="empty-queue">No pending approvals.</div>
      ) : (
        items.map(item => (
          <ApprovalCard key={item.custodyId} item={item} onApprove={handleApprove} />
        ))
      )}
    </div>
  );
}
