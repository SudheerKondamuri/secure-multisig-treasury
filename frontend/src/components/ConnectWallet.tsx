import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const ConnectWallet: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div>
        <p style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
          Connected: <span className="text-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
        </p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <button
      data-testid="connect-wallet-button"
      onClick={() => {
        const injectedConnector = connectors.find(c => c.name === 'Injected');
        if (injectedConnector) {
          connect({ connector: injectedConnector });
        }
      }}
    >
      Connect Wallet
    </button>
  );
};

export default ConnectWallet;
