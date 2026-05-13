const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';

// File type and size limits
const MEDICAL_DOC_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const PHOTO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Validate file before upload
 */
function validateFile(file, type = 'document') {
  const allowedTypes = type === 'photo' ? PHOTO_ALLOWED_TYPES : MEDICAL_DOC_ALLOWED_TYPES;
  const maxSize = type === 'photo' ? MAX_PHOTO_SIZE : MAX_DOC_SIZE;

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }
  if (file.size > maxSize) {
    throw new Error(`File too large. Max size: ${maxSize / (1024 * 1024)}MB`);
  }
  return true;
}

/**
 * Upload medical document to Pinata/IPFS
 * Returns: { cid, url, size }
 */
async function uploadMedicalDocument(fileBuffer, filename, mimetype, metadata = {}) {
  if (!PINATA_JWT) {
    throw new Error('Pinata JWT not configured');
  }

  const formData = new FormData();
  formData.append('file', fileBuffer, { filename, contentType: mimetype });

  const pinataMetadata = JSON.stringify({
    name: filename,
    keyvalues: {
      type: 'medical_document',
      uploadedAt: new Date().toISOString(),
      ...metadata
    }
  });
  formData.append('pinataMetadata', pinataMetadata);

  const pinataOptions = JSON.stringify({ cidVersion: 1 });
  formData.append('pinataOptions', pinataOptions);

  const response = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      ...formData.getHeaders()
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  const cid = response.data.IpfsHash;
  return {
    cid,
    url: `${PINATA_GATEWAY}/ipfs/${cid}`,
    size: response.data.PinSize
  };
}

/**
 * Upload profile photo to Pinata/IPFS
 * Returns: { cid, url }
 */
async function uploadProfilePhoto(fileBuffer, filename, mimetype) {
  return uploadMedicalDocument(fileBuffer, filename, mimetype, { type: 'profile_photo' });
}

/**
 * Upload JSON metadata to Pinata/IPFS
 * Returns: { cid, url }
 */
async function uploadJSON(jsonData, name) {
  if (!PINATA_JWT) throw new Error('Pinata JWT not configured');

  const response = await axios.post(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    pinataContent: jsonData,
    pinataMetadata: { name },
    pinataOptions: { cidVersion: 1 }
  }, {
    headers: { 'Authorization': `Bearer ${PINATA_JWT}`, 'Content-Type': 'application/json' }
  });

  const cid = response.data.IpfsHash;
  return { cid, url: `${PINATA_GATEWAY}/ipfs/${cid}` };
}

/**
 * Get file from IPFS by CID
 * Returns: Buffer
 */
async function getFromIPFS(cid) {
  const response = await axios.get(`${PINATA_GATEWAY}/ipfs/${cid}`, {
    responseType: 'arraybuffer'
  });
  return Buffer.from(response.data);
}

module.exports = {
  validateFile,
  uploadMedicalDocument,
  uploadProfilePhoto,
  uploadJSON,
  getFromIPFS,
  PINATA_GATEWAY,
  MAX_DOC_SIZE,
  MAX_PHOTO_SIZE
};
