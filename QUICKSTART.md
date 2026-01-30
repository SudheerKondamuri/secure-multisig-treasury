# 🚀 Quick Start Guide

## Immediate Testing (No Installation Required)

### Run Tests
```bash
cd /home/omni/Projects/secure-multisig-treasury
npm test
```
✅ **Result**: All 28 tests passing!

## Option 1: Docker Setup (Recommended for Full Demo)

### Start Everything with One Command
```bash
cd /home/omni/Projects/secure-multisig-treasury
docker-compose up --build
```

This will:
1. Start Hardhat node on http://localhost:8545
2. Deploy the MultiSigWallet contract
3. Start React frontend on http://localhost:3000

### Configure MetaMask
1. Add network:
   - Network Name: Hardhat Local
   - RPC URL: http://localhost:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

2. Import test accounts (private keys from Hardhat output)

## Option 2: Manual Local Development

### Backend Setup
```bash
# 1. Install dependencies (already done)
npm install

# 2. Compile contracts
npm run compile

# 3. Run tests
npm test

# 4. Start Hardhat node (Terminal 1)
npm run node

# 5. Deploy contract (Terminal 2)
npm run deploy
```

### Frontend Setup
```bash
# 1. Go to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Frontend will be available at http://localhost:3000

## What You Can Do

### 1. Connect Wallet
- Click "Connect Wallet" button
- Approve connection in MetaMask

### 2. View Dashboard
- See wallet balance
- View all owners
- Check required confirmations

### 3. Create Proposals
- **ETH Transfer**: Enter recipient address and amount
- **ERC-20 Transfer**: Use encoded data field
- **Add Owner**: Encode addOwner function call

### 4. Manage Proposals
- Confirm pending proposals
- Revoke your confirmations
- Execute when threshold met

## Test Account Details

Hardhat provides 20 test accounts with 10,000 ETH each:

**Account #0 (Deployer)**
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Account #1**
```
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

**Account #2**
```
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

## Verify Everything Works

### 1. Smart Contracts
```bash
npm test
# Should show: 28 passing ✅
```

### 2. Compilation
```bash
npm run compile
# Should complete without errors ✅
```

### 3. Deployment
```bash
# Terminal 1: Start node
npm run node

# Terminal 2: Deploy
npm run deploy
# Should output contract address ✅
```

## Common Issues & Solutions

### Issue: "Module not found" errors in frontend
**Solution**: Run `npm install` in the frontend directory

### Issue: Docker containers not starting
**Solution**: 
```bash
docker-compose down
docker-compose up --build
```

### Issue: MetaMask shows wrong chain
**Solution**: Switch to Localhost 8545 network in MetaMask

### Issue: Transaction fails
**Solution**: 
- Ensure you're connected with an owner account
- Check you have enough ETH for gas
- Verify sufficient confirmations for execution

## Project Structure Summary

```
secure-multisig-treasury/
├── contracts/           # ✅ Smart contracts (MultiSigWallet.sol)
├── test/               # ✅ 28 passing tests
├── scripts/            # ✅ Deployment script
├── frontend/           # ✅ React app with Wagmi
│   ├── src/
│   │   ├── components/ # ✅ All UI components
│   │   └── hooks/      # ✅ useMultiSig hook
├── docker-compose.yml  # ✅ One-command setup
└── README.md          # ✅ Full documentation
```

## Next Steps

1. ✅ All tests passing
2. ✅ Smart contracts compiled
3. ✅ Frontend components ready
4. ✅ Docker setup configured
5. ✅ Documentation complete

**You're ready to go! 🎉**

Choose Docker (easy) or Manual (more control) setup above and start exploring your Multi-Sig Treasury!
