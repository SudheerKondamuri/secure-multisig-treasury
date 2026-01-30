# 🔐 Secure Multi-Sig Treasury Management System

A production-ready decentralized application (DApp) featuring a secure multi-signature wallet for treasury management. Built with Hardhat, Solidity, React, TypeScript, Wagmi, and TanStack Query.

## 📋 Overview

This project implements a full-featured multi-signature wallet smart contract with a modern React frontend. Multi-sig wallets require multiple owners to approve transactions before execution, providing enhanced security for managing shared digital assets.

### Key Features

- **Smart Contract**: Solidity-based multi-signature wallet with proposal-based governance
- **Access Control**: M-of-N signature requirements with owner management
- **Secure Execution**: Checks-Effects-Interactions pattern to prevent re-entrancy
- **Event-Driven Frontend**: Real-time updates using contract event listeners
- **Modern Stack**: React + TypeScript + Wagmi + TanStack Query + Viem
- **Docker Support**: One-command setup with Docker Compose
- **Comprehensive Tests**: Full test coverage for all contract functions

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** (recommended)
- OR **Node.js** 18+ and **npm** (for local development)
- **MetaMask** or another Web3 wallet browser extension

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-multisig-treasury
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

   This will:
   - Start a local Hardhat blockchain node on port 8545
   - Deploy the MultiSigWallet contract
   - Start the React frontend on port 3000

3. **Access the application**
   - Frontend: http://localhost:3000
   - Hardhat Node: http://localhost:8545

4. **Configure MetaMask**
   - Network: Localhost 8545
   - Chain ID: 1337
   - RPC URL: http://localhost:8545
   - Import test accounts using the private keys from Hardhat output

### Option 2: Local Development Setup

1. **Install backend dependencies**
   ```bash
   npm install
   ```

2. **Compile contracts**
   ```bash
   npm run compile
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Start Hardhat node** (in one terminal)
   ```bash
   npm run node
   ```

5. **Deploy contracts** (in another terminal)
   ```bash
   npm run deploy
   ```

6. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

7. **Start frontend**
   ```bash
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:3000

## 🔧 Smart Contract Functions

### Core Functions

- `submitTransaction(address to, uint256 value, bytes calldata data)` - Submit a new transaction proposal
- `confirmTransaction(uint256 transactionId)` - Confirm a pending transaction
- `revokeConfirmation(uint256 transactionId)` - Revoke your confirmation
- `executeTransaction(uint256 transactionId)` - Execute a confirmed transaction

### Governance Functions (Multi-Sig Only)

These functions must be called via multi-sig proposals:

- `addOwner(address owner)` - Add a new owner to the wallet
- `removeOwner(address owner)` - Remove an existing owner
- `changeRequirement(uint256 _required)` - Change the required confirmations

### View Functions

- `getOwners()` - Get list of all owners
- `required()` - Get required number of confirmations
- `isOwner(address)` - Check if an address is an owner
- `getTransactionCount()` - Get total number of transactions

## 🧪 Testing

The project includes comprehensive tests covering all requirements:

```bash
# Run all tests
npm test

# Run tests with gas reporting
REPORT_GAS=true npm test
```

### Test Coverage

- ✅ Deployment and initialization
- ✅ ETH transaction proposals
- ✅ ERC-20 transfer proposals
- ✅ Transaction confirmation and revocation
- ✅ Transaction execution with sufficient confirmations
- ✅ Adding/removing owners via multi-sig
- ✅ Changing confirmation requirements
- ✅ Event emissions
- ✅ Security checks and edge cases

## 🔒 Security Considerations

### Smart Contract Security

1. **Checks-Effects-Interactions Pattern**: State changes occur before external calls
2. **Re-entrancy Protection**: Transactions marked as executed before external calls
3. **Access Control**: Critical functions protected by `onlyOwner` and `onlyWallet` modifiers
4. **Input Validation**: Comprehensive validation of all inputs
5. **Event Logging**: All state changes emit events for transparency

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Rebuild and start
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

## 📝 Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
# Backend
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
REACT_APP_CONTRACT_ADDRESS=<deployed_contract_address>
```

## 🛠️ Available Scripts

### Backend

- `npm run compile` - Compile smart contracts
- `npm test` - Run tests
- `npm run node` - Start local Hardhat node
- `npm run deploy` - Deploy contracts to localhost

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production

## 📄 License

This project is licensed under the ISC License.

---

**Built with ❤️ for secure, decentralized treasury management**
