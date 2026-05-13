#!/usr/bin/env bash
# =============================================================================
# MediVault – Chaincode Packaging & Deployment (Docker-based)
#
# Deploys healthcare, consent, and audit chaincodes to medicalrecords-channel.
# All peer/orderer operations run inside hyperledger/fabric-tools:2.5 via Docker.
# Run AFTER the channel has been created (step 4 of start-all.sh).
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
TOOLS_IMG="hyperledger/fabric-tools:2.5"
CHANNEL_NAME="medicalrecords-channel"
NETWORK="medivault-network"
ORDERER="orderer.medivault.local:7050"
ORDERER_CA=/workspace/fabric/organizations/ordererOrganizations/medivault.local/orderers/orderer.medivault.local/tls/ca.crt
H1_TLS_CA=/workspace/fabric/organizations/peerOrganizations/hospital1.medivault.local/peers/peer0.hospital1.medivault.local/tls/ca.crt
H2_TLS_CA=/workspace/fabric/organizations/peerOrganizations/hospital2.medivault.local/peers/peer0.hospital2.medivault.local/tls/ca.crt

# Admin MSP paths (inside container, mapped via -v "$ROOT:/workspace")
H1_MSP=/workspace/fabric/organizations/peerOrganizations/hospital1.medivault.local/users/Admin@hospital1.medivault.local/msp
H2_MSP=/workspace/fabric/organizations/peerOrganizations/hospital2.medivault.local/users/Admin@hospital2.medivault.local/msp

echo "========================================"
echo "  MediVault Chaincode Deployment"
echo "========================================"

# ── Helper: peer command for Hospital1 ────────────────────────────────────────
peer_h1() {
  MSYS_NO_PATHCONV=1 docker run --rm \
    --network "$NETWORK" \
    -v "$ROOT:/workspace" \
    -e FABRIC_CFG_PATH=/workspace/fabric/config \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE="$H1_TLS_CA" \
    -e CORE_PEER_LOCALMSPID=Hospital1MSP \
    -e CORE_PEER_ADDRESS=peer0.hospital1.medivault.local:7051 \
    -e CORE_PEER_MSPCONFIGPATH="$H1_MSP" \
    "$TOOLS_IMG" "$@"
}

# ── Helper: peer command for Hospital2 ────────────────────────────────────────
peer_h2() {
  MSYS_NO_PATHCONV=1 docker run --rm \
    --network "$NETWORK" \
    -v "$ROOT:/workspace" \
    -e FABRIC_CFG_PATH=/workspace/fabric/config \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE="$H2_TLS_CA" \
    -e CORE_PEER_LOCALMSPID=Hospital2MSP \
    -e CORE_PEER_ADDRESS=peer0.hospital2.medivault.local:7051 \
    -e CORE_PEER_MSPCONFIGPATH="$H2_MSP" \
    "$TOOLS_IMG" "$@"
}

# ── Deploy a single chaincode ─────────────────────────────────────────────────
deploy_chaincode() {
  local name="$1"
  local version="${2:-1.0}"
  local sequence="${3:-1}"
  local pkg_file="/workspace/${name}.tar.gz"
  local label="${name}_${version}"

  echo ""
  echo "── Deploying $name ────────────────────────────────"

  # Package (no network needed – reads source files from mounted volume)
  echo "→ Packaging $name …"
  MSYS_NO_PATHCONV=1 docker run --rm \
    -v "$ROOT:/workspace" \
    "$TOOLS_IMG" \
    peer lifecycle chaincode package "$pkg_file" \
      --path "/workspace/fabric/chaincodes/${name}" \
      --lang golang \
      --label "$label"

  # Install on peer0.hospital1 (idempotent – ignore "already installed" error)
  echo "→ Installing on peer0.hospital1 …"
  peer_h1 peer lifecycle chaincode install "$pkg_file" 2>&1 || true

  # Install on peer0.hospital2
  echo "→ Installing on peer0.hospital2 …"
  peer_h2 peer lifecycle chaincode install "$pkg_file" 2>&1 || true

  # Get package ID from Hospital1
  PKG_ID=$(peer_h1 peer lifecycle chaincode queryinstalled 2>&1 \
    | grep "$label" | sed 's/.*Package ID: \([^,]*\),.*/\1/')

  if [ -z "$PKG_ID" ]; then
    echo "❌  Could not retrieve Package ID for $name."
    return 1
  fi
  echo "   Package ID: $PKG_ID"

  # Approve for Hospital1
  echo "→ Approving for Hospital1 …"
  peer_h1 peer lifecycle chaincode approveformyorg \
    -o "$ORDERER" --tls --cafile "$ORDERER_CA" \
    --channelID "$CHANNEL_NAME" \
    --name "$name" \
    --version "$version" \
    --package-id "$PKG_ID" \
    --sequence "$sequence" \
    --waitForEvent=false

  sleep 3
  # Approve for Hospital2
  echo "→ Approving for Hospital2 …"
  peer_h2 peer lifecycle chaincode approveformyorg \
    -o "$ORDERER" --tls --cafile "$ORDERER_CA" \
    --channelID "$CHANNEL_NAME" \
    --name "$name" \
    --version "$version" \
    --package-id "$PKG_ID" \
    --sequence "$sequence" \
    --waitForEvent=false

  sleep 8
  # Commit
  echo "→ Committing $name …"
  peer_h1 peer lifecycle chaincode commit \
    -o "$ORDERER" --tls --cafile "$ORDERER_CA" \
    --channelID "$CHANNEL_NAME" \
    --name "$name" \
    --version "$version" \
    --sequence "$sequence" \
    --peerAddresses peer0.hospital1.medivault.local:7051 \
    --tlsRootCertFiles "$H1_TLS_CA" \
    --peerAddresses peer0.hospital2.medivault.local:7051 \
    --tlsRootCertFiles "$H2_TLS_CA" \
    --waitForEvent=false

  echo "  ✓ $name deployed"
}

deploy_chaincode "healthcare"
deploy_chaincode "consent"
deploy_chaincode "audit"

echo ""
echo "========================================"
echo "  All chaincodes deployed!"
echo "========================================"
