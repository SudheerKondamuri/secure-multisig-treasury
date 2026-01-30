import React, { useState } from 'react';
import { useMultiSig } from '../hooks/useMultiSig';
import { formatEther } from 'ethers';

interface Transaction {
  destination: string;
  value: bigint;
  data: string;
  executed: boolean;
}

const ProposalList: React.FC = () => {
  const {
    transactionCount,
    getTransaction,
    getConfirmationCount,
    getConfirmations,
    confirmTransaction,
    revokeConfirmation,
    executeTransaction,
    isOwner,
  } = useMultiSig();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingTx, setLoadingTx] = useState<number | null>(null);

  const handleConfirm = async (txId: number) => {
    try {
      setError('');
      setSuccess('');
      setLoadingTx(txId);
      await confirmTransaction(txId);
      setSuccess(`Proposal ${txId} confirmed successfully!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error confirming:', err);
      setError(err.message || 'Failed to confirm proposal');
    } finally {
      setLoadingTx(null);
    }
  };

  const handleRevoke = async (txId: number) => {
    try {
      setError('');
      setSuccess('');
      setLoadingTx(txId);
      await revokeConfirmation(txId);
      setSuccess(`Confirmation revoked for proposal ${txId}!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error revoking:', err);
      setError(err.message || 'Failed to revoke confirmation');
    } finally {
      setLoadingTx(null);
    }
  };

  const handleExecute = async (txId: number) => {
    try {
      setError('');
      setSuccess('');
      setLoadingTx(txId);
      await executeTransaction(txId);
      setSuccess(`Proposal ${txId} executed successfully!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error executing:', err);
      setError(err.message || 'Failed to execute proposal');
    } finally {
      setLoadingTx(null);
    }
  };

  if (!transactionCount || transactionCount === BigInt(0)) {
    return (
      <div className="card">
        <h2>Proposals</h2>
        <div className="empty-state">No proposals yet</div>
      </div>
    );
  }

  const txIds = Array.from({ length: Number(transactionCount) }, (_, i) => i);

  return (
    <div className="card">
      <h2>Proposals</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div data-testid="proposal-list">
        {txIds.reverse().map((txId) => (
          <ProposalItem
            key={txId}
            txId={txId}
            isOwner={Boolean(isOwner)}
            loadingTx={loadingTx}
            getTransaction={getTransaction}
            getConfirmationCount={getConfirmationCount}
            getConfirmations={getConfirmations}
            onConfirm={handleConfirm}
            onRevoke={handleRevoke}
            onExecute={handleExecute}
          />
        ))}
      </div>
    </div>
  );
};

interface ProposalItemProps {
  txId: number;
  isOwner: boolean;
  loadingTx: number | null;
  getTransaction: (id: number) => Transaction | undefined;
  getConfirmationCount: (id: number) => number;
  getConfirmations: (id: number) => boolean;
  onConfirm: (id: number) => void;
  onRevoke: (id: number) => void;
  onExecute: (id: number) => void;
}

const ProposalItem: React.FC<ProposalItemProps> = ({
  txId,
  isOwner,
  loadingTx,
  getTransaction,
  getConfirmationCount,
  getConfirmations,
  onConfirm,
  onRevoke,
  onExecute,
}) => {
  const transaction = getTransaction(txId);
  
  if (!transaction) {
    return null;
  }

  const confirmationCount = getConfirmationCount(txId);
  const isConfirmedByMe = getConfirmations(txId);
  const isLoading = loadingTx === txId;

  return (
    <div className="proposal-item" data-testid={`proposal-item-${txId}`}>
      <div className="proposal-header">
        <div className="proposal-id">Proposal #{txId}</div>
        <div className={`proposal-status ${transaction.executed ? 'executed' : 'pending'}`}>
          {transaction.executed ? 'Executed' : 'Pending'}
        </div>
      </div>

      <div className="proposal-details">
        <p>
          <strong>To:</strong>{' '}
          <span className="address">{transaction.destination}</span>
        </p>
        <p>
          <strong>Value:</strong> {formatEther(transaction.value)} ETH
        </p>
        {transaction.data && transaction.data !== '0x' && (
          <p>
            <strong>Data:</strong>{' '}
            <span className="address">{transaction.data.slice(0, 20)}...</span>
          </p>
        )}
      </div>

      <div className="confirmations">
        <strong>Confirmations:</strong> {confirmationCount}
        {isConfirmedByMe && ' (You confirmed)'}
      </div>

      {isOwner && !transaction.executed && (
        <div className="proposal-actions">
          {!isConfirmedByMe ? (
            <button
              data-testid={`confirm-button-${txId}`}
              onClick={() => onConfirm(txId)}
              disabled={isLoading}
            >
              {isLoading ? 'Confirming...' : 'Confirm'}
            </button>
          ) : (
            <button
              className="secondary"
              onClick={() => onRevoke(txId)}
              disabled={isLoading}
            >
              {isLoading ? 'Revoking...' : 'Revoke'}
            </button>
          )}
          
          <button
            onClick={() => onExecute(txId)}
            disabled={isLoading}
          >
            {isLoading ? 'Executing...' : 'Execute'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProposalList;
