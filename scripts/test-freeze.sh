#!/bin/bash

# ==============================================================================
# Test Script for Emergency Freeze and Multi-Approver Unfreeze
#
# Usage:
#   ./scripts/test-freeze.sh
#
# Description:
#   This script automates the testing of the emergency freeze and unfreeze
#   workflow in the canton-multisig-custody Daml project. It performs
#   the following steps:
#   1. Builds the Daml code into a DAR file.
#   2. Starts a fresh Canton sandbox ledger in the background.
#   3. Waits for the sandbox's JSON API to become healthy.
#   4. Executes a specific Daml Script test that simulates the entire
#      freeze, multi-signature unfreeze proposal, and unfreeze execution flow.
#   5. Shuts down the sandbox upon completion or interruption.
# ==============================================================================

set -euo pipefail

# --- Configuration ---
readonly SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
readonly PROJECT_ROOT="$( cd -- "${SCRIPT_DIR}/.." &> /dev/null && pwd )"
readonly DAML_TEST_FILE="daml/test/CustodyTest.daml"
readonly DAML_SCRIPT_NAME="CustodyTest:testEmergencyFreezeAndUnfreeze"
readonly LEDGER_HOST="localhost"
readonly LEDGER_PORT_GRPC="6866"
readonly LEDGER_PORT_JSON="7575"
readonly SANDBOX_LOG_FILE="${PROJECT_ROOT}/sandbox.log"

# --- Colors for logging ---
readonly COLOR_RESET='\033[0m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_YELLOW='\033[0;33m'

# --- State ---
SANDBOX_PID=""

# --- Functions ---

log_step() {
  echo -e "\n${COLOR_BLUE}▶ $1${COLOR_RESET}"
}

log_info() {
  echo -e "  ${COLOR_YELLOW}○${COLOR_RESET} $1"
}

log_success() {
  echo -e "  ${COLOR_GREEN}✔${COLOR_RESET} $1"
}

log_error() {
  echo -e "${COLOR_RED}✘ ERROR: $1${COLOR_RESET}" >&2
  if [ -f "$SANDBOX_LOG_FILE" ]; then
    echo -e "${COLOR_RED}--- Last 20 lines of sandbox log (${SANDBOX_LOG_FILE}) ---${COLOR_RESET}"
    tail -n 20 "$SANDBOX_LOG_FILE" >&2
    echo -e "${COLOR_RED}------------------------------------------------------${COLOR_RESET}"
  fi
  exit 1
}

# Ensures the sandbox is terminated on script exit.
cleanup() {
  if [ -n "$SANDBOX_PID" ]; then
    log_step "Cleaning up..."
    if ps -p "$SANDBOX_PID" > /dev/null; then
      log_info "Stopping Canton sandbox (PID: $SANDBOX_PID)..."
      kill "$SANDBOX_PID"
      # Wait for the process to terminate gracefully
      wait "$SANDBOX_PID" 2>/dev/null || true
      log_success "Sandbox stopped."
    else
      log_info "Sandbox (PID: $SANDBOX_PID) was already stopped."
    fi
  fi
  rm -f "$SANDBOX_LOG_FILE"
}

# Waits for the sandbox JSON API to become responsive.
wait_for_ledger() {
  local max_wait_seconds=60
  local wait_interval=2
  local url="http://${LEDGER_HOST}:${LEDGER_PORT_JSON}/v1/health"

  log_info "Waiting up to ${max_wait_seconds}s for ledger to be healthy at ${url}..."

  for ((i=0; i<max_wait_seconds/wait_interval; i++)); do
    if curl -s -f "${url}" > /dev/null 2>&1; then
      log_success "Ledger is healthy and responsive."
      return 0
    fi
    sleep "$wait_interval"
  done

  log_error "Ledger did not become healthy after ${max_wait_seconds} seconds."
}

# --- Main Script ---

trap cleanup EXIT

cd "$PROJECT_ROOT"

log_step "Building Daml project..."
if ! dpm build; then
  log_error "Daml project build failed."
fi
log_success "Project built successfully."

log_step "Starting Canton sandbox ledger..."
dpm sandbox > "$SANDBOX_LOG_FILE" 2>&1 &
SANDBOX_PID=$!
log_info "Sandbox started with PID: $SANDBOX_PID. Output logged to: $SANDBOX_LOG_FILE"

wait_for_ledger

log_step "Running Freeze/Unfreeze Daml Script test: ${DAML_SCRIPT_NAME}"
if ! dpm test \
  --files "${DAML_TEST_FILE}" \
  --script-name "${DAML_SCRIPT_NAME}" \
  --ledger-host "${LEDGER_HOST}" \
  --ledger-port "${LEDGER_PORT_GRPC}"; then
  log_error "Daml Script test failed. See output above for details."
fi

log_success "Daml Script test completed successfully."

echo -e "\n${COLOR_GREEN}✅ All tests passed!${COLOR_RESET}"

exit 0