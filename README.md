# Secure Multi-Sig Treasury

A secure, multi-signature treasury system built with Hardhat, Ethers.js, and a React frontend. This project provides a robust solution for managing shared funds on the Ethereum blockchain, requiring multiple owners to approve transactions before they can be executed.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Running the Local Network](#running-the-local-network)
  - [Deploying the Contract](#deploying-the-contract)
  - [Starting the Frontend](#starting-the-frontend)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Architecture

The system is composed of two main parts:

1.  **Smart Contract**: A Solidity-based `MultiSigWallet` contract that holds the funds and enforces the multi-signature policy.
2.  **Frontend**: A React application that provides a user-friendly interface for interacting with the smart contract.

The frontend communicates with the Ethereum network (and our smart contract) using [Wagmi](https://wagmi.sh/) and [Viem](https://viem.sh/), which provide React hooks and utilities for wallet connections, contract interactions, and more.

## Features

-   **Multi-Signature Control**: Transactions require a minimum number of confirmations from a predefined set of owners.
-   **Transaction Proposals**: Owners can submit transaction proposals for other owners to review and approve.
-   **On-Chain Execution**: Once a transaction has enough confirmations, it can be executed on the blockchain.
-   **Fund Management**: Easily deposit and manage Ether in the treasury.
-   **Clear UI**: A simple and intuitive React interface for all treasury operations.

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v16 or later)
-   [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)
-   [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/secure-multisig-treasury.git
    cd secure-multisig-treasury
    ```

2.  **Install root dependencies:**

    ```bash
    npm install
    ```

3.  **Install frontend dependencies:**

    ```bash
    cd frontend
    npm install
    ```

## Usage

### Running the Local Network

To simulate an Ethereum environment, we use a local Hardhat node, orchestrated with Docker.

```bash
docker-compose up -d hardhat-node
```

This command starts a local blockchain instance in the background.

### Deploying the Contract

With the local network running, deploy the `MultiSigWallet` contract:

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

After deployment, a copy of the contract's ABI (`MultiSigWallet.json`) will be placed in the `frontend/src/abis` directory.

### Starting the Frontend

The frontend is also run in a Docker container for consistency.

```bash
docker-compose up -d frontend
```

The React app will be available at [http://localhost:3000](http://localhost:3000).

## Testing

The project includes a comprehensive test suite for the smart contract using Chai and Mocha.

To run the tests:

```bash
npx hardhat test
```

This will execute all test files in the `test/` directory against a fresh Hardhat network.

## Project Structure

```
secure-multisig-treasury/
├── .env.example                # Documented env vars (DEPLOYER_KEY, CONTRACT_ADDRESS)
├── .gitignore                  # Ignore node_modules, .env, artifacts, cache
├── README.md                   # Documentation on setup, architecture, and usage
├── docker-compose.yml          # Orchestrates Hardhat Node + Frontend
├── Dockerfile.hardhat          # Docker setup for the local blockchain node
├── hardhat.config.ts           # Hardhat configuration (networks, solidity version)
├── package.json                # Root dependencies (Hardhat, Ethers, Waffle)
├── tsconfig.json               # TypeScript config for Hardhat
│
├── contracts/
│   └── MultiSigWallet.sol      # The main smart contract
│
├── scripts/
│   └── deploy.ts               # Script to deploy contract to local/remote network
│
├── test/
│   └── MultiSigWallet.test.ts  # Comprehensive tests (Chai/Mocha)
│
└── frontend/                   # The React Application
    ├── Dockerfile.frontend     # Docker setup for the React app
    ├── package.json            # Frontend dependencies (React, Wagmi, Viem)
    ├── tsconfig.json
    ├── public/
    └── src/
        ├── App.tsx             # Main component structure
        ├── index.tsx           # Entry point
        ├── abis/
        │   └── MultiSigWallet.json  # Contract ABI (copied after compile)
        ├── components/
        │   ├── ConnectWallet.tsx    # Wallet connection button
        │   ├── Dashboard.tsx        # Balances and owners list
        │   ├── CreateProposal.tsx   # Form to submit transactions
        │   └── ProposalList.tsx     # List of pending/executed transactions
        └── hooks/
            └── useMultiSig.ts       # Custom Wagmi hooks for contract interaction
```
