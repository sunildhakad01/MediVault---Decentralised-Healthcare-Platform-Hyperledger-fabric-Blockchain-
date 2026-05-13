#!/usr/bin/env bash
# =============================================================================
# MediVault – Full Stack Startup
#
# Prerequisites:
#   1. Docker Desktop is running
#   2. Crypto material generated:  ./scripts/generate-crypto.sh
#
# Usage (from project root):
#   ./scripts/start-all.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
TOOLS_IMG="hyperledger/fabric-tools:2.5"
CHANNEL_NAME="medicalrecords-channel"
NETWORK="medivault-network"

# MSP paths inside the tools container (mapped via -v "$ROOT:/workspace")
H1_MSP=/workspace/fabric/organizations/peerOrganizations/hospital1.medivault.local/users/Admin@hospital1.medivault.local/msp
H2_MSP=/workspace/fabric/organizations/peerOrganizations/hospital2.medivault.local/users/Admin@hospital2.medivault.local/msp
# TLS CA certs (container paths, mapped via -v "$ROOT:/workspace")
ORDERER_CA=/workspace/fabric/organizations/ordererOrganizations/medivault.local/orderers/orderer.medivault.local/tls/ca.crt
H1_TLS_CA=/workspace/fabric/organizations/peerOrganizations/hospital1.medivault.local/peers/peer0.hospital1.medivault.local/tls/ca.crt
H2_TLS_CA=/workspace/fabric/organizations/peerOrganizations/hospital2.medivault.local/peers/peer0.hospital2.medivault.local/tls/ca.crt

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║    MediVault Full Stack Startup          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Preflight checks ──────────────────────────────────────────────────────────
if ! docker info > /dev/null 2>&1; then
  echo "❌  Docker is not running."
  exit 1
fi

if [ ! -f "$ROOT/fabric/channel-artifacts/orderer.genesis.block" ]; then
  echo "❌  Crypto material not found."
  echo "    Run first: ./scripts/generate-crypto.sh"
  exit 1
fi

# Change to project root so docker compose uses relative paths (avoids Win path issues)
cd "$ROOT"

# ── Helper: run peer CLI command in fabric-tools container ────────────────────
# MSYS_NO_PATHCONV=1 prevents Git Bash from converting /workspace to a Win path
peer_cmd() {
  local mspid="$1" peer_addr="$2" msppath="$3" tlsca="$4"
  shift 4
  MSYS_NO_PATHCONV=1 docker run --rm \
    --network "$NETWORK" \
    -v "$ROOT:/workspace" \
    -e FABRIC_CFG_PATH=/workspace/fabric/config \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE="$tlsca" \
    -e CORE_PEER_LOCALMSPID="$mspid" \
    -e CORE_PEER_ADDRESS="$peer_addr" \
    -e CORE_PEER_MSPCONFIGPATH="$msppath" \
    "$TOOLS_IMG" "$@"
}

# ── Step 1: Start infrastructure ──────────────────────────────────────────────
echo "▶  Step 1/6 – Starting PostgreSQL, Redis, CouchDB …"
docker compose up -d postgres redis couchdb_hospital1 couchdb_hospital2

echo "   Waiting for databases to be healthy …"
sleep 20

# ── Step 2: Start Fabric CAs ──────────────────────────────────────────────────
echo "▶  Step 2/6 – Starting Fabric CAs …"
docker compose up -d ca-hospital1 ca-hospital2 ca-orderer
echo "   Waiting 10s for CAs …"
sleep 10

# ── Step 3: Start Orderer and Peers ───────────────────────────────────────────
echo "▶  Step 3/6 – Starting Orderer and Peers …"
docker compose up -d \
  orderer.medivault.local \
  peer0.hospital1.medivault.local \
  peer0.hospital2.medivault.local

echo "   Waiting 15s for peers to start …"
sleep 15

# ── Step 4: Create channel ────────────────────────────────────────────────────
echo "▶  Step 4/6 – Creating channel ${CHANNEL_NAME} …"

peer_cmd Hospital1MSP \
  peer0.hospital1.medivault.local:7051 \
  "$H1_MSP" "$H1_TLS_CA" \
  peer channel create \
    -o orderer.medivault.local:7050 \
    --tls --cafile "$ORDERER_CA" \
    -c "$CHANNEL_NAME" \
    -f /workspace/fabric/channel-artifacts/${CHANNEL_NAME}.tx \
    --outputBlock /workspace/fabric/channel-artifacts/${CHANNEL_NAME}.block \
  2>&1 || echo "   (channel may already exist)"

echo "   Hospital1 joining channel …"
peer_cmd Hospital1MSP \
  peer0.hospital1.medivault.local:7051 \
  "$H1_MSP" "$H1_TLS_CA" \
  peer channel join \
    -b /workspace/fabric/channel-artifacts/${CHANNEL_NAME}.block

echo "   Hospital2 joining channel …"
peer_cmd Hospital2MSP \
  peer0.hospital2.medivault.local:7051 \
  "$H2_MSP" "$H2_TLS_CA" \
  peer channel join \
    -b /workspace/fabric/channel-artifacts/${CHANNEL_NAME}.block

echo "   ✓ Channel created, both peers joined"

# ── Step 5: Deploy chaincodes ─────────────────────────────────────────────────
echo "▶  Step 5/6 – Deploying chaincodes …"
bash "$SCRIPT_DIR/chaincode-deploy.sh"

# ── Step 6: Load admin wallet and start API + Frontend ────────────────────────
echo "▶  Step 6/6 – Loading admin wallet …"
node "$SCRIPT_DIR/enroll-admin-wallet.js"

echo "   Starting API server and Frontend …"
docker compose up -d api-server frontend

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅  MediVault is running!               ║"
echo "║  API  → http://localhost:3002            ║"
echo "║  UI   → http://localhost:3000            ║"
echo "╚══════════════════════════════════════════╝"
