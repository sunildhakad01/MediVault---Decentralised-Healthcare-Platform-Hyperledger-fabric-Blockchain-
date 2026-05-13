# 🔧 MediVault Complete Configuration Setup Guide

## 📋 Overview
This guide covers **all missing configuration keys** for both Backend and Frontend with step-by-step instructions.

---

# 🔴 MISSING CONFIGURATIONS (Current Status)

## Backend Issues:
- ❌ **PINATA_JWT** - MISSING (currently says "your_pinata_jwt_token")
- ⚠️ **EMAIL_USER & EMAIL_PASSWORD** - Using placeholder credentials

## Frontend Issues:
- ❌ **NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID** - MISSING (says "YOUR_WALLETCONNECT_PROJECT_ID")
- ❌ **NEXT_PUBLIC_CONTRACT_ADDRESS** - MISSING (not in .env.local)

---

# ✅ STEP-BY-STEP SETUP

## STEP 1️⃣: Setup Pinata (IPFS Service)

### What is Pinata?
- Cloud service for storing files on IPFS
- Used for uploading medicine images, doctor profiles, patient records

### How to Get Pinata JWT:

1. **Go to:** https://app.pinata.cloud
2. **Sign up** (free tier available)
3. **After login:**
   - Click **"API Keys"** (left sidebar)
   - Click **"New Key"**
   - Select: **"Admin"** (for full access)
   - Copy the **JWT** token (long alphanumeric string)

4. **Update Backend** `backend/.env`:
   ```env
   PINATA_JWT=paste_your_jwt_here_exactly
   ```

5. **Verify Frontend has it:**
   Check `MediVault-main/.env.local` - Already has a valid token ✅

---

## STEP 2️⃣: Setup WalletConnect (Blockchain Wallet Connection)

### What is WalletConnect?
- Enables users to connect MetaMask/wallets to your dApp
- Required for blockchain transactions

### How to Get WalletConnect Project ID:

1. **Go to:** https://cloud.walletconnect.com
2. **Sign up** (free account)
3. **Create a new project:**
   - Click **"Create Project"**
   - Enter name: **"MediVault"**
   - Select platform: **"Web"**
   - Click **"Create"**
4. **Copy the Project ID** (in Project Dashboard)

5. **Update Frontend** `MediVault-main/.env.local`:
   ```env
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
   ```

---

## STEP 3️⃣: Setup Smart Contract Address

### What is Contract Address?
- The Ethereum smart contract address for your dApp
- Enables blockchain features (register doctors, book appointments, buy medicines)

### How to Deploy & Get Contract Address:

1. **Deploy your smart contract:**
   - Go to: `MediVault-main/web3/`
   - Use Hardhat to deploy: `npx hardhat run scripts/deploy.js --network localhost`

2. **After deployment:**
   - Copy the contract address from terminal output
   - Format: `0x1234567890123456789012345678901234567890`

3. **Update Frontend** `MediVault-main/.env.local`:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x_your_contract_address_here
   ```

---

## STEP 4️⃣: Setup Email Service (Gmail)

### Current Problem:
Email sending is not working because credentials are incomplete.

### How to Fix (Gmail):

1. **Enable 2FA on Gmail:**
   - Go: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password:**
   - Go: https://myaccount.google.com/apppasswords
   - Select: **Mail** & **Windows Computer**
   - Click **"Generate"**
   - Copy the **16-character password**

3. **Update Backend** `backend/.env`:
   ```env
   EMAIL_USER=your-actual-gmail@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   EMAIL_FROM=your-actual-gmail@gmail.com
   ```

4. **Test:**
   - Restart backend: `npm run dev`
   - Request OTP → Should print to console (our testing method)

---

## STEP 5️⃣: Ethereum Localhost Setup

### Current Chain:
Using `localhost` for local blockchain testing.

### Setup Local Blockchain:

1. **Install Hardhat** (if not done):
   ```bash
   cd MediVault-main/web3
   npm install
   ```

2. **Start Local Blockchain:**
   ```bash
   npx hardhat node
   ```

3. **Should show:**
   ```
   Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545
   ```

4. **Deploy Smart Contract:**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

---

# 📊 COMPLETE CONFIGURATION CHECKLIST

## Backend `backend/.env`

```env
# ========== DATABASE ==========
DATABASE_URL=postgresql://medivault_user:secure_password_123@localhost:5432/medivault ✅
REDIS_URL=redis://localhost:6379 ✅

# ========== JWT & AUTH ==========
JWT_SECRET=00b673cb1c83796cc9ee9e32caed5963b36721bfb710a5f75f25d1f823a36034 ✅
JWT_EXPIRES_IN=1h ✅
REFRESH_TOKEN_EXPIRES_IN=7d ✅
JWT_ALGORITHM=HS256 ✅

# ========== FABRIC NETWORK ==========
FABRIC_CA_URL=http://localhost:7054 ✅
FABRIC_CA_ADMIN_USER=admin ✅
FABRIC_CA_ADMIN_PASS=hospital1pw ✅
FABRIC_ORDERER_URL=orderer.medivault.local:7050 ✅
FABRIC_PEER_URL=peer0.hospital1.medivault.local:7051 ✅
FABRIC_CHAINCODE_NAME=healthcare ✅
FABRIC_CHANNEL_NAME=medicalrecords-channel ✅
FABRIC_MSP_ID=Hospital1MSP ✅
FABRIC_USER_ID=admin@hospital1.medivault.local ✅
FABRIC_WALLET_PATH=./wallet ✅
FABRIC_CONNECTION_PROFILE=./fabric-config/connection-profile.json ✅

# ========== EMAIL SERVICE ==========
EMAIL_HOST=smtp.gmail.com ✅
EMAIL_PORT=587 ✅
EMAIL_SECURE=false ✅
EMAIL_USER=YOUR_GMAIL@gmail.com ⚠️ NEEDS REAL EMAIL
EMAIL_PASSWORD=YOUR_APP_PASSWORD ⚠️ NEEDS REAL PASSWORD
EMAIL_FROM=security@medivault.health ✅

# ========== SECURITY ==========
RATE_LIMIT_LOGIN_ATTEMPTS=5 ✅
RATE_LIMIT_LOGIN_WINDOW_MS=900000 ✅
RATE_LIMIT_OTP_WINDOW_MS=3600000 ✅
RATE_LIMIT_OTP_LIMIT=3 ✅
BCRYPT_ROUNDS=12 ✅

# ========== IPFS ==========
PINATA_JWT=YOUR_PINATA_JWT_TOKEN ❌ MISSING - GET FROM STEP 1
PINATA_GATEWAY=https://gateway.pinata.cloud ✅

# ========== APPLICATION ==========
NODE_ENV=development ✅
PORT=3002 ✅
APP_NAME=MediVault ✅
APP_VERSION=2.0.0 ✅
```

---

## Frontend `MediVault-main/.env.local`

```env
# ========== API & APP ==========
NEXT_PUBLIC_API_URL=http://localhost:3002 ✅
NEXT_PUBLIC_APP_NAME=MediVault ✅
NEXT_PUBLIC_APP_VERSION=2.0.0 ✅
NEXT_PUBLIC_ENVIRONMENT=development ✅

# ========== IPFS / Pinata ==========
NEXT_PUBLIC_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ✅ (Already has valid token)
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud ✅

# ========== BLOCKCHAIN ==========
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=YOUR_PROJECT_ID ❌ MISSING - GET FROM STEP 2
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... ❌ MISSING - GET FROM STEP 3

# ========== DEBUG ==========
NEXT_PUBLIC_DEBUG_MODE=true ✅
```

---

# 🚀 QUICK START SUMMARY

### Complete these in order:

1. **Get Pinata JWT** (Step 1)
   - Visit pinata.cloud
   - Create API key
   - Copy JWT
   - Update `backend/.env`

2. **Get WalletConnect Project ID** (Step 2)
   - Visit cloud.walletconnect.com
   - Create project
   - Copy Project ID
   - Update `MediVault-main/.env.local`

3. **Setup Local Blockchain** (Step 5)
   - Run: `npx hardhat node`
   - Deploy: `npx hardhat run scripts/deploy.js --network localhost`
   - Copy contract address
   - Update `MediVault-main/.env.local`

4. **Setup Gmail** (Step 4)
   - Get app password from Google
   - Update `backend/.env`

5. **Restart Everything:**
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend
   cd MediVault-main
   npm run dev
   ```

---

# 📝 File Locations Quick Reference

| File | Path | Status |
|------|------|--------|
| Backend Config | `backend/.env` | Mostly ✅ |
| Frontend Config | `MediVault-main/.env.local` | Needs 2 keys |
| Contract ABI | `MediVault-main/config/contract.js` | ✅ |
| Wagmi Config | `MediVault-main/config/wagmi.js` | ✅ |

---

# ⚠️ COMMON ERRORS & FIXES

| Error | Cause | Fix |
|-------|-------|-----|
| `EADDRINUSE: address already in use ::: 3002` | Another Node process running | `taskkill /F /IM node.exe` |
| `Failed to send OTP` | Email config missing | Setup Gmail (Step 4) |
| `Cannot read property 'projectId'` | WalletConnect ID missing | Get from Step 2 |
| `ContractAddress is undefined` | Contract not deployed | Deploy Hardhat contract (Step 3) |
| `Cannot connect to Pinata` | Pinata JWT expired | Get new token (Step 1) |

---

# ✅ VALIDATION CHECKLIST

After setup, verify everything works:

- [ ] Backend starts without EADDRINUSE error
- [ ] Frontend loads at http://localhost:3004
- [ ] Health check works: http://localhost:3002/health
- [ ] Can request OTP (prints to backend console)
- [ ] Can verify OTP
- [ ] Can connect MetaMask wallet
- [ ] Can upload images (Pinata working)
- [ ] Can sign blockchain transactions

---

**Once you complete all these steps, your system will be fully operational!** 🎉
