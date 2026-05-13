#!/usr/bin/env bash
# =============================================================================
# MediVault – Generate Crypto Material & Channel Artifacts (Docker-based)
#
# Run ONCE from the project root before starting the network:
#   ./scripts/generate-crypto.sh
#
# Requires: Docker Desktop running, internet access (first run only).
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
FABRIC_DIR="$ROOT/fabric"
TOOLS_IMG="hyperledger/fabric-tools:2.5"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  MediVault – Generate Crypto Material    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Preflight ─────────────────────────────────────────────────────────────────
if ! docker info > /dev/null 2>&1; then
  echo "❌  Docker is not running. Start Docker Desktop first."
  exit 1
fi

mkdir -p "$FABRIC_DIR/channel-artifacts"

# Clean up any previous crypto material so cryptogen starts fresh
echo "▶  Cleaning previous crypto material …"
rm -rf "$FABRIC_DIR/organizations/peerOrganizations" \
       "$FABRIC_DIR/organizations/ordererOrganizations" \
       "$FABRIC_DIR/organizations/fabric-ca" \
       "$FABRIC_DIR/channel-artifacts/orderer.genesis.block" \
       "$FABRIC_DIR/channel-artifacts/medicalrecords-channel.tx" \
       "$FABRIC_DIR/channel-artifacts/medicalrecords-channel.block"

# ── Step 1: Pull fabric-tools image ───────────────────────────────────────────
echo "▶  Pulling $TOOLS_IMG …"
docker pull "$TOOLS_IMG" --quiet

# ── Step 2: Generate crypto with cryptogen ────────────────────────────────────
echo "▶  Running cryptogen generate …"
MSYS_NO_PATHCONV=1 docker run --rm \
  -v "$ROOT:/workspace" \
  "$TOOLS_IMG" \
  cryptogen generate \
    --config=/workspace/fabric/config/crypto-config.yaml \
    --output=/workspace/fabric/organizations

echo "   ✓ Crypto material generated"

# ── Step 3: Generate orderer system-channel genesis block ─────────────────────
echo "▶  Generating orderer genesis block …"
MSYS_NO_PATHCONV=1 docker run --rm \
  -v "$ROOT:/workspace" \
  -e FABRIC_CFG_PATH=/workspace/fabric/config \
  "$TOOLS_IMG" \
  configtxgen \
    -profile TwoOrgsOrdererGenesis \
    -channelID system-channel \
    -outputBlock /workspace/fabric/channel-artifacts/orderer.genesis.block

echo "   ✓ Genesis block: fabric/channel-artifacts/orderer.genesis.block"

# ── Step 4: Generate channel creation transaction ─────────────────────────────
echo "▶  Generating channel creation tx …"
MSYS_NO_PATHCONV=1 docker run --rm \
  -v "$ROOT:/workspace" \
  -e FABRIC_CFG_PATH=/workspace/fabric/config \
  "$TOOLS_IMG" \
  configtxgen \
    -profile TwoOrgsChannel \
    -channelID medicalrecords-channel \
    -outputCreateChannelTx /workspace/fabric/channel-artifacts/medicalrecords-channel.tx

echo "   ✓ Channel tx: fabric/channel-artifacts/medicalrecords-channel.tx"

# ── Step 5: Vendor Go chaincode dependencies ──────────────────────────────────
echo "▶  Vendoring chaincode Go dependencies …"
for cc in healthcare consent audit; do
  ccdir="$FABRIC_DIR/chaincodes/$cc"
  if [ ! -f "$ccdir/go.mod" ]; then
    echo "   ⚠  $cc – no go.mod found, skipping"
    continue
  fi
  if [ -d "$ccdir/vendor" ]; then
    echo "   $cc – vendor/ already exists, skipping"
    continue
  fi
  echo "   Vendoring $cc …"
  MSYS_NO_PATHCONV=1 docker run --rm \
    -v "$ccdir:/chaincode" \
    golang:1.21-alpine \
    sh -c 'cd /chaincode && go mod vendor'
  echo "   ✓ $cc vendored"
done

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✓  All artifacts generated!             ║"
echo "║  Next: ./scripts/start-all.sh            ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Files created:"
echo "  fabric/organizations/ordererOrganizations/"
echo "  fabric/organizations/peerOrganizations/"
echo "  fabric/channel-artifacts/orderer.genesis.block"
echo "  fabric/channel-artifacts/medicalrecords-channel.tx"
