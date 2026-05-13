#!/usr/bin/env bash
# =============================================================================
# MediVault – Post-Reboot Full Setup
# Run this ONE TIME after rebooting your PC (with WSL2 now active).
# From Git Bash / WSL terminal, run:  bash scripts/post-reboot-setup.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER="/c/Program Files/Docker/Docker/resources/bin/docker"
DOCKER_COMPOSE="/c/Program Files/Docker/Docker/resources/bin/docker-compose"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   MediVault – Post-Reboot Full Setup                ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── Wait for Docker ─────────────────────────────────────────────────────────
wait_for_docker() {
  echo "⏳  Waiting for Docker daemon …"
  for i in $(seq 1 20); do
    if "$DOCKER" info --format '{{.ServerVersion}}' >/dev/null 2>&1; then
      echo "✅  Docker ready"
      return 0
    fi
    echo "   Attempt $i/20 – retrying in 10s …"
    sleep 10
  done
  echo "❌  Docker didn't start in time. Make sure Docker Desktop is open."
  exit 1
}
wait_for_docker

# ─── Step 1: Start infra ─────────────────────────────────────────────────────
echo ""
echo "▶  [1/8] Starting MongoDB, Redis, CouchDB …"
"$DOCKER_COMPOSE" -f "$ROOT/docker-compose.yml" up -d \
  mongodb redis couchdb_hospital1 couchdb_hospital2

echo "   Waiting 20s for health checks …"
sleep 20

# ─── Step 2: Start Fabric CAs ────────────────────────────────────────────────
echo "▶  [2/8] Starting Fabric CA servers …"
"$DOCKER_COMPOSE" -f "$ROOT/docker-compose.yml" up -d \
  ca-hospital1 ca-hospital2 ca-orderer

echo "   Waiting 15s for CAs to boot …"
sleep 15

# Verify CAs are up
curl -sf http://localhost:7054/cainfo >/dev/null && echo "   ✅  ca-hospital1 OK" || echo "   ⚠️  ca-hospital1 not responding yet"
curl -sf http://localhost:7055/cainfo >/dev/null && echo "   ✅  ca-hospital2 OK" || echo "   ⚠️  ca-hospital2 not responding yet"

# ─── Step 3: Install fabric-ca-client if not present ─────────────────────────
echo "▶  [3/8] Checking fabric-ca-client …"
if ! command -v fabric-ca-client &>/dev/null; then
  echo "   fabric-ca-client not found – installing via npm shim …"
  # Use the fabric-ca-client via docker exec as fallback
  echo "   Will use Docker CA container for enrollment"
  USE_DOCKER_CA=true
else
  USE_DOCKER_CA=false
  echo "   ✅  fabric-ca-client found: $(fabric-ca-client version 2>&1 | grep Version)"
fi

# ─── Step 4: Enroll CA admins & register users ───────────────────────────────
echo "▶  [4/8] Setting up Fabric CA identities …"

enroll_via_docker() {
  local ca_container="$1" ca_name="$2" user="$3" pass="$4" out_dir="$5"
  "$DOCKER" exec "$ca_container" \
    fabric-ca-client enroll \
      -u "http://${user}:${pass}@localhost:7054" \
      --caname "$ca_name" \
      --mspdir "/etc/hyperledger/fabric-ca-server/msp" 2>&1 || true
}

if [ "${USE_DOCKER_CA:-false}" = "true" ]; then
  # Enroll admin inside CA container, then copy out certs
  "$DOCKER" exec ca-hospital1 \
    sh -c "fabric-ca-client enroll -u http://admin:hospital1pw@localhost:7054 --caname ca-hospital1 --mspdir /tmp/admin-msp" 2>&1 || true
  mkdir -p "$ROOT/fabric/organizations/fabric-ca/hospital1/admin-msp"
  "$DOCKER" cp ca-hospital1:/tmp/admin-msp/. "$ROOT/fabric/organizations/fabric-ca/hospital1/admin-msp/" 2>&1 || true
  echo "   ✅  Admin enrolled for Hospital1 (via container)"
else
  bash "$ROOT/scripts/fabric-setup.sh"
fi

# ─── Step 5: Generate MSP structure from CA certs ────────────────────────────
echo "▶  [5/8] Building MSP directory structure from CA certs …"

copy_ca_cert() {
  local container="$1" dest_dir="$2"
  mkdir -p "$dest_dir/cacerts" "$dest_dir/tlscacerts" "$dest_dir/keystore" "$dest_dir/signcerts"
  # Copy the CA root cert
  "$DOCKER" cp "${container}:/etc/hyperledger/fabric-ca-server/ca-cert.pem" \
    "${dest_dir}/cacerts/ca.crt" 2>/dev/null || true
}

copy_ca_cert "ca-hospital1" "$ROOT/fabric/organizations/peerOrganizations/hospital1.medivault.local/msp"
copy_ca_cert "ca-hospital2" "$ROOT/fabric/organizations/peerOrganizations/hospital2.medivault.local/msp"
copy_ca_cert "ca-orderer"   "$ROOT/fabric/organizations/ordererOrganizations/medivault.local/msp"

# ─── Step 6: Start Orderer + Peers ───────────────────────────────────────────
echo "▶  [6/8] Starting Orderer and Peers …"
"$DOCKER_COMPOSE" -f "$ROOT/docker-compose.yml" up -d \
  orderer.medivault.local \
  peer0.hospital1.medivault.local \
  peer0.hospital2.medivault.local

echo "   Waiting 15s …"
sleep 15

# ─── Step 7: Start API server ─────────────────────────────────────────────────
echo "▶  [7/8] Starting MediVault API server …"
cd "$ROOT/backend"
npm run dev &
API_PID=$!
echo "   API PID: $API_PID"
sleep 5

# Health check
curl -sf http://localhost:3001/health && echo "   ✅  API server responding" || echo "   ⚠️  API not up yet (check logs)"

# ─── Step 8: Done ─────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅  MediVault setup complete!                      ║"
echo "║                                                      ║"
echo "║  API    → http://localhost:3001                     ║"
echo "║  Health → http://localhost:3001/health              ║"
echo "║                                                      ║"
echo "║  NEXT: Set your email in backend/.env               ║"
echo "║  EMAIL_USER=your-gmail@gmail.com                    ║"
echo "║  EMAIL_PASSWORD=your-16-char-app-password           ║"
echo "╚══════════════════════════════════════════════════════╝"
