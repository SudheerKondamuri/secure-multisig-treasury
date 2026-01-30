import React from 'react';
import ConnectWallet from './components/ConnectWallet';
import Dashboard from './components/Dashboard';
import CreateProposal from './components/CreateProposal';
import ProposalList from './components/ProposalList';
import { useAccount } from 'wagmi';

function App() {
  const { isConnected } = useAccount();

  return (
    <div className="app">
      <header className="header">
        <h1>🔐 Multi-Sig Treasury Management</h1>
        <ConnectWallet />
      </header>

      {isConnected ? (
        <main className="main">
          <Dashboard />
          <div className="content-grid">
            <CreateProposal />
            <ProposalList />
          </div>
        </main>
      ) : (
        <div className="welcome">
          <h2>Welcome to Multi-Sig Treasury</h2>
          <p>Connect your wallet to get started</p>
        </div>
      )}
    </div>
  );
}

export default App;
