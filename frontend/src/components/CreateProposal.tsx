import React, { useState } from 'react';
import { useMultiSig } from '../hooks/useMultiSig';
import { parseEther, isAddress } from 'ethers';

const CreateProposal: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [data, setData] = useState('0x');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { submitTransaction, isOwner } = useMultiSig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isOwner) {
      setError('Only owners can create proposals');
      return;
    }

    if (!recipient || !isAddress(recipient)) {
      setError('Please enter a valid recipient address');
      return;
    }

    try {
      const value = amount ? parseEther(amount) : BigInt(0);
      await submitTransaction(recipient, value, data || '0x');
      
      setSuccess('Proposal created successfully!');
      setRecipient('');
      setAmount('');
      setData('0x');
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error creating proposal:', err);
      setError(err.message || 'Failed to create proposal');
    }
  };

  if (!isOwner) {
    return (
      <div className="card">
        <h2>Create Proposal</h2>
        <div className="info">
          You must be an owner to create proposals.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Create Proposal</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="recipient">Recipient Address</label>
          <input
            id="recipient"
            type="text"
            data-testid="proposal-recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount (ETH)</label>
          <input
            id="amount"
            type="text"
            data-testid="proposal-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            Leave empty for 0 ETH (e.g., for contract calls)
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="data">Data (Hex)</label>
          <textarea
            id="data"
            data-testid="proposal-data"
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="0x"
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            Optional: Encoded function call data for contract interactions
          </small>
        </div>

        <button type="submit" data-testid="submit-proposal-button">
          Create Proposal
        </button>
      </form>
    </div>
  );
};

export default CreateProposal;
