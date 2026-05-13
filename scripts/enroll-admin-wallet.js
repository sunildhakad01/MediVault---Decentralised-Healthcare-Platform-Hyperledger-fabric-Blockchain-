/**
 * Load the Fabric admin identity from cryptogen-generated files into the wallet.
 *
 * With cryptogen, the Admin cert/key are pre-generated and don't require
 * a running Fabric CA. This replaces the CA-enrollment approach for the
 * initial network admin identity.
 *
 * Usage (from project root):
 *   node scripts/enroll-admin-wallet.js
 */
const dotenvPath = require('path').join(__dirname, '../backend/node_modules/dotenv');
require(dotenvPath).config({ path: require('path').join(__dirname, '../backend/.env') });

const path = require('path');
const fs   = require('fs');

// Resolve fabric-network from the backend's node_modules
const fabricNetworkPath = path.join(__dirname, '../backend/node_modules/fabric-network');
const { Wallets } = require(fabricNetworkPath);

const ROOT   = path.join(__dirname, '..');
const ORG    = 'hospital1.medivault.local';
// FABRIC_USER_ID in .env is lowercase, but the wallet key can be anything –
// we use whatever is configured so the backend finds it correctly.
const WALLET_ID = process.env.FABRIC_USER_ID || `Admin@${ORG}`;
const MSP_ID    = process.env.FABRIC_MSP_ID  || 'Hospital1MSP';

// Cryptogen always generates the admin under Admin@<domain> (capital A)
const MSP_DIR = path.join(
  ROOT,
  'fabric/organizations/peerOrganizations',
  ORG,
  `users/Admin@${ORG}/msp`
);

(async () => {
  try {
    console.log(`Loading admin identity "${WALLET_ID}" from cryptogen files …`);

    const certDir = path.join(MSP_DIR, 'signcerts');
    const keyDir  = path.join(MSP_DIR, 'keystore');

    if (!fs.existsSync(certDir) || !fs.existsSync(keyDir)) {
      throw new Error(
        `MSP directory not found: ${MSP_DIR}\n` +
        'Run ./scripts/generate-crypto.sh first.'
      );
    }

    const certFile = fs.readdirSync(certDir).find(f => f.endsWith('.pem'));
    const keyFile  = fs.readdirSync(keyDir).find(
      f => f.endsWith('_sk') || f === 'priv_sk'
    );

    if (!certFile) throw new Error(`No .pem cert found in ${certDir}`);
    if (!keyFile)  throw new Error(`No key found in ${keyDir}`);

    const certificate = fs.readFileSync(path.join(certDir, certFile), 'utf8');
    const privateKey  = fs.readFileSync(path.join(keyDir,  keyFile),  'utf8');

    const walletPath = process.env.FABRIC_WALLET_PATH
      ? path.resolve(ROOT, process.env.FABRIC_WALLET_PATH)
      : path.join(ROOT, 'backend/wallet');

    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = {
      credentials: { certificate, privateKey },
      mspId: MSP_ID,
      type:  'X.509',
    };

    await wallet.put(WALLET_ID, identity);
    console.log(`✅  Admin identity stored in wallet as "${WALLET_ID}"`);
    console.log(`    Wallet path: ${walletPath}`);
  } catch (err) {
    console.error('❌  Failed to load admin identity:', err.message);
    process.exit(1);
  }
})();
