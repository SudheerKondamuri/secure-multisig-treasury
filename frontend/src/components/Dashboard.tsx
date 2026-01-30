import React from 'react';
import { useAccount } from 'wagmi';
import { useMultiSig } from '../hooks/useMultiSig';
import { formatEther } from 'ethers';

const Dashboard: React.FC = () => {
  const { address } = useAccount();
  const { balance, owners, required, isOwner, isLoading } = useMultiSig();

  if (isLoading) {
    return (
      <div className="card">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>Wallet Balance</h3>
          <div className="value">{balance ? formatEther(balance) : '0'} ETH</div>
        </div>
        
        <div className="stat-card">
          <h3>Total Owners</h3>
          <div className="value">{owners?.length || 0}</div>
        </div>
        
        <div className="stat-card">
          <h3>Required Confirmations</h3>
          <div className="value">{required?.toString() || '0'}</div>
        </div>
        
        <div className="stat-card">
          <h3>Your Status</h3>
          <div className="value">{isOwner ? '✓ Owner' : '✗ Not Owner'}</div>
        </div>
      </div>

      <div className="owners-list">
        <h3>Wallet Owners</h3>
        {owners && owners.length > 0 ? (
          owners.map((owner: string, index: number) => (
            <div
              key={owner}
              className="owner-item"
              style={{
                borderLeft: owner.toLowerCase() === address?.toLowerCase() ? '4px solid #667eea' : 'none',
                paddingLeft: owner.toLowerCase() === address?.toLowerCase() ? '16px' : '10px'
              }}
            >
              {owner} {owner.toLowerCase() === address?.toLowerCase() && '(You)'}
            </div>
          ))
        ) : (
          <div className="empty-state">No owners found</div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
