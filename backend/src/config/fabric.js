const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger.util');

let wallet;

/**
 * Load the connection profile JSON.
 * Throws a 503-tagged error if the file is missing so callers can return
 * a proper "Fabric unavailable" response instead of a generic 500.
 */
const loadConnectionProfile = () => {
  const profilePath = process.env.FABRIC_CONNECTION_PROFILE
    || path.join(__dirname, '../../fabric-config/connection-profile.json');
  if (!fs.existsSync(profilePath)) {
    const err = new Error(`Fabric connection profile not found at: ${profilePath}`);
    err.statusCode = 503;
    err.fabricUnavailable = true;
    throw err;
  }
  const raw = fs.readFileSync(profilePath, 'utf8');
  return JSON.parse(raw);
};

/**
 * Get (or create) the file-system wallet.
 */
const getWallet = async () => {
  if (!wallet) {
    const walletPath = process.env.FABRIC_WALLET_PATH || path.join(__dirname, '../../wallet');
    wallet = await Wallets.newFileSystemWallet(walletPath);
  }
  return wallet;
};

/**
 * Get a connected Gateway for a specific user identity.
 */
const getGateway = async (userId) => {
  const ccp = loadConnectionProfile();
  const w = await getWallet();
  const identity = await w.get(userId);
  if (!identity) {
    const err = new Error(`Fabric identity not found in wallet for: ${userId}. Ensure the admin identity is enrolled.`);
    err.statusCode = 503;
    err.fabricUnavailable = true;
    throw err;
  }

  const gw = new Gateway();
  await gw.connect(ccp, {
    wallet: w,
    identity: userId,
    discovery: { enabled: false, asLocalhost: false },
  });
  return gw;
};

/**
 * Wrap raw Fabric/gRPC errors so they surface as 503 instead of 500.
 */
const wrapFabricError = (err) => {
  if (err.fabricUnavailable) return err;
  const msg = err.message || String(err);
  const isFabricDown = msg.includes('UNAVAILABLE') || msg.includes('ECONNREFUSED')
    || msg.includes('failed to connect') || msg.includes('No endorsers found')
    || msg.includes('identity not found');
  if (isFabricDown) {
    const wrapped = new Error(`Fabric network unavailable: ${msg}`);
    wrapped.statusCode = 503;
    wrapped.fabricUnavailable = true;
    return wrapped;
  }
  return err;
};

/**
 * Submit a transaction to the chaincode.
 */
const submitTransaction = async (userId, functionName, ...args) => {
  const channelName = process.env.FABRIC_CHANNEL_NAME || 'medicalrecords-channel';
  const chaincodeName = process.env.FABRIC_CHAINCODE_NAME || 'healthcare';

  let gw;
  try {
    gw = await getGateway(userId);
    const network = await gw.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);
    // With discovery disabled, explicitly endorse on all peers from both orgs
    const endorsers = network.getChannel().getEndorsers();
    const result = await contract.createTransaction(functionName)
      .setEndorsingPeers(endorsers)
      .submit(...args);
    return result.toString();
  } catch (err) {
    throw wrapFabricError(err);
  } finally {
    if (gw) gw.disconnect();
  }
};

/**
 * Evaluate (query) a transaction from the chaincode.
 */
const evaluateTransaction = async (userId, functionName, ...args) => {
  const channelName = process.env.FABRIC_CHANNEL_NAME || 'medicalrecords-channel';
  const chaincodeName = process.env.FABRIC_CHAINCODE_NAME || 'healthcare';

  let gw;
  try {
    gw = await getGateway(userId);
    const network = await gw.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);
    const result = await contract.evaluateTransaction(functionName, ...args);
    return result.toString();
  } catch (err) {
    throw wrapFabricError(err);
  } finally {
    if (gw) gw.disconnect();
  }
};

/**
 * Enroll a new user with Fabric CA and store identity in wallet.
 */
const enrollUser = async (userId, secret, mspId) => {
  const caUrl = process.env.FABRIC_CA_URL || 'https://localhost:7054';
  const ccp = loadConnectionProfile();
  const w = await getWallet();

  const caInfo = ccp.certificateAuthorities[Object.keys(ccp.certificateAuthorities)[0]];
  const caTLSCACerts = caInfo.tlsCACerts ? caInfo.tlsCACerts.pem : [];
  const ca = new FabricCAServices(caUrl, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

  const enrollment = await ca.enroll({
    enrollmentID: userId,
    enrollmentSecret: secret,
  });

  const x509Identity = {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: mspId || process.env.FABRIC_MSP_ID || 'Hospital1MSP',
    type: 'X.509',
  };

  await w.put(userId, x509Identity);
  logger.info(`Enrolled and stored identity for user: ${userId}`);
  return x509Identity;
};

/**
 * Register a new user identity with Fabric CA (admin must be enrolled first).
 */
const registerUser = async (adminId, newUserId, role = 'client', affiliation = 'hospital1.department1') => {
  const caUrl = process.env.FABRIC_CA_URL || 'https://localhost:7054';
  const ccp = loadConnectionProfile();
  const w = await getWallet();

  const caInfo = ccp.certificateAuthorities[Object.keys(ccp.certificateAuthorities)[0]];
  const caTLSCACerts = caInfo.tlsCACerts ? caInfo.tlsCACerts.pem : [];
  const ca = new FabricCAServices(caUrl, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

  // Get admin identity for registrar
  const adminIdentity = await w.get(adminId);
  if (!adminIdentity) throw new Error(`Admin identity ${adminId} not found in wallet`);

  const provider = w.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, adminId);

  const secret = await ca.register({
    affiliation,
    enrollmentID: newUserId,
    role,
  }, adminUser);

  return secret;
};

module.exports = {
  getWallet,
  getGateway,
  submitTransaction,
  evaluateTransaction,
  enrollUser,
  registerUser,
  loadConnectionProfile,
};
