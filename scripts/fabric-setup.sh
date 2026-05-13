#!/usr/bin/env bash
# =============================================================================
# MediVault – Hyperledger Fabric Network Setup
# Run this AFTER docker-compose up -d starts the CA containers.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
FABRIC_DIR="$ROOT_DIR/fabric"
WALLET_DIR="$ROOT_DIR/backend/wallet"

export FABRIC_CA_CLIENT_HOME="$FABRIC_DIR/ca-client"
mkdir -p "$FABRIC_CA_CLIENT_HOME" "$WALLET_DIR"

echo "========================================"
echo "  MediVault Fabric Network Setup"
echo "========================================"

# ── Helper ────────────────────────────────────────────────────────────────────
enroll_ca_admin() {
  local name="$1" url="$2" password="$3" msp_dir="$4"
  echo "→ Enrolling CA admin for $name …"
  mkdir -p "$msp_dir"
  FABRIC_CA_CLIENT_HOME="$msp_dir" fabric-ca-client enroll \
    -u "http://admin:${password}@${url}" \
    --caname "$name" 2>&1 || echo "  (already enrolled or CA not ready)"
}

# ── Step 1: Enroll CA admins ──────────────────────────────────────────────────
enroll_ca_admin "ca-hospital1" "localhost:7054" "hospital1pw" \
  "$FABRIC_DIR/organizations/fabric-ca/hospital1"

enroll_ca_admin "ca-hospital2" "localhost:7055" "hospital2pw" \
  "$FABRIC_DIR/organizations/fabric-ca/hospital2"

enroll_ca_admin "ca-orderer"   "localhost:7056" "ordererpw" \
  "$FABRIC_DIR/organizations/fabric-ca/orderer"

# ── Step 2: Register & enroll org users ──────────────────────────────────────
register_and_enroll() {
  local ca_url="$1" ca_name="$2" password="$3" user="$4" user_secret="$5" \
        org_msp="$6" out_dir="$7"
  echo "→ Registering $user with $ca_name …"
  FABRIC_CA_CLIENT_HOME="$out_dir" fabric-ca-client register \
    -u "http://admin:${password}@${ca_url}" \
    --caname "$ca_name" \
    --id.name "$user" --id.secret "$user_secret" --id.type client 2>&1 || true

  echo "→ Enrolling $user …"
  mkdir -p "$out_dir/users/$user/msp"
  FABRIC_CA_CLIENT_HOME="$out_dir/users/$user" fabric-ca-client enroll \
    -u "http://${user}:${user_secret}@${ca_url}" \
    --caname "$ca_name" \
    --mspdir "$out_dir/users/$user/msp" 2>&1 || echo "  (already enrolled)"
}

register_and_enroll "localhost:7054" "ca-hospital1" "hospital1pw" \
  "admin@hospital1.medivault.local" "adminpw" "Hospital1MSP" \
  "$FABRIC_DIR/organizations/fabric-ca/hospital1"

register_and_enroll "localhost:7055" "ca-hospital2" "hospital2pw" \
  "admin@hospital2.medivault.local" "adminpw" "Hospital2MSP" \
  "$FABRIC_DIR/organizations/fabric-ca/hospital2"

echo ""
echo "========================================"
echo "  Fabric setup complete!"
echo "  Next: run ./scripts/chaincode-deploy.sh"
echo "========================================"
