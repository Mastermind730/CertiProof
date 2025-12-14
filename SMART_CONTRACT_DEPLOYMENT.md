# Smart Contract Redeployment Guide

## Contract Changes Made
Fixed the DocStamp contract to properly inherit from Ownable to enable `onlyOwner` modifier.

## Steps to Redeploy

### 1. Navigate to Backend Directory
```bash
cd D:\Projects\CertiProof\backend
```

### 2. Compile the Contract
```bash
npx truffle compile
```

### 3. Deploy to Ganache (Local Testing)

**Option A: Using Truffle Dashboard (Recommended)**
```bash
# Terminal 1 - Start Truffle Dashboard
npx truffle dashboard

# Terminal 2 - Deploy
npx truffle migrate --network dashboard
```

**Option B: Using Ganache CLI**
```bash
# Make sure Ganache is running on port 9545
npx truffle migrate --network development --reset
```

### 4. Deploy to Sepolia Testnet (Production)

⚠️ **Important**: Make sure you have Sepolia ETH in your wallet first!

```bash
npx truffle migrate --network sepolia --reset
```

### 5. Update Contract Address

After deployment, you'll see output like:
```
DocStamp: 0x1234567890abcdef1234567890abcdef12345678
```

**Copy the new contract address** and update your `.env` file:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_NEW_CONTRACT_ADDRESS
```

### 6. Update Contract ABI in Client

Copy the compiled contract JSON:
```bash
# Copy from backend to client
copy build\contracts\DocStamp.json ..\client\src\contract\DocStamp.json
```

Or manually copy the file from:
- From: `backend/build/contracts/DocStamp.json`
- To: `client/src/contract/DocStamp.json`

### 7. Restart Development Server

```bash
cd ../client
pnpm dev
```

## Verification Checklist

After redeployment, verify:

- [ ] Contract address updated in `.env`
- [ ] DocStamp.json copied to client
- [ ] Can connect wallet on frontend
- [ ] Can issue certificates from admin panel
- [ ] Certificate issuance records transaction hash
- [ ] Blockchain verification works

## Quick Commands Summary

```bash
# Full redeployment workflow
cd backend
npx truffle compile
npx truffle migrate --network sepolia --reset
copy build\contracts\DocStamp.json ..\client\src\contract\DocStamp.json
cd ..\client
# Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env
pnpm dev
```

## Troubleshooting

### "truffle: command not found"
```bash
npm install -g truffle
# OR use npx
npx truffle compile
```

### "Insufficient funds"
Get Sepolia ETH from faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### "Network connection error"
Check your Alchemy API key in `truffle-config.js` is valid.

### Contract address not updating
Make sure to:
1. Add `NEXT_PUBLIC_` prefix to env variable
2. Restart Next.js dev server after changing .env
3. Clear browser cache

## Network Details

### Development (Ganache)
- Network ID: 5777
- RPC: http://127.0.0.1:9545

### Sepolia Testnet
- Network ID: 11155111
- RPC: Your Alchemy URL
- Explorer: https://sepolia.etherscan.io/
