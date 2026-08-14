#!/usr/bin/env bash
# Runs one QA flow against a remote EAS Simulator session.
#
# Each job starts its own cloud simulator on EAS (`eas simulator:start
# --type argent`), installs the downloaded build on it, then runs a headless
# Claude Code QA agent whose Argent MCP server is pointed at that session.
# Nothing runs on a simulator local to the worker.
#
# Usage: run-flow.sh <path-to-.app>
#
# Required env:
#   FLOW                     - signup | checkout | settings | support | offline
#   APPLICATION_ID           - iOS bundle identifier
#   CLAUDE_CODE_OAUTH_TOKEN  - from EAS environment variables (preview)
set -euo pipefail

APP_PATH="${1:?Usage: run-flow.sh <path-to-.app>}"
: "${FLOW:?FLOW env is required}"
APP_ID="${APPLICATION_ID:-dev.expo.summitsupply}"
DEVICE_NAME="${IOS_SIM_DEVICE:-iPhone 17}"

echo "==> Flow: ${FLOW}"
echo "==> App:  ${APP_PATH}"

mkdir -p ./artifacts

# ---------------------------------------------------------------------------
# 1. Start a remote EAS Simulator session.
#
# --type argent provisions an Argent daemon on the session VM and prints the
# credentials as shell exports. --out-config-type env keeps them on stdout so
# this script can parse them; the default (dotenv) would write
# .env.eas-simulator instead.
# ---------------------------------------------------------------------------
# EAS injects a job-scoped EXPO_TOKEN into every workflow job. It authenticates
# (`eas whoami` succeeds with it) but is NOT authorized to create simulator
# sessions - simulator:start fails with "Not authorized" on the GraphQL
# mutation. Override it with a personal access token, supplied as
# EAS_SIMULATOR_EXPO_TOKEN in the preview environment (visibility: secret).
if [ -n "${EAS_SIMULATOR_EXPO_TOKEN:-}" ]; then
  echo "==> Using EAS_SIMULATOR_EXPO_TOKEN for simulator session management"
  export EXPO_TOKEN="${EAS_SIMULATOR_EXPO_TOKEN}"
else
  echo "==> ERROR: EAS_SIMULATOR_EXPO_TOKEN is not set."
  echo "    The job-scoped EXPO_TOKEN cannot create EAS Simulator sessions."
  echo "    Create a personal access token at https://expo.dev/settings/access-tokens"
  echo "    then: eas env:set --name EAS_SIMULATOR_EXPO_TOKEN --value <token> \\"
  echo "            --environment preview --visibility secret"
  exit 1
fi

START_OUT="$(mktemp)"
echo "==> Starting EAS Simulator session for flow: ${FLOW}"
# Bound the wait: simulator:start blocks until the session is ready with no
# timeout of its own. Provisioning under five-way demand has been observed to
# take up to ~4 min, so allow 8 before declaring it stalled - still far short
# of the workflow timeout. GNU timeout exists on the linux-* images.
timeout 480 eas simulator:start \
  --platform ios \
  --type argent \
  --name "QA swarm: ${FLOW}" \
  --out-config-type env \
  --non-interactive 2>&1 | tee "${START_OUT}" || START_FAILED=1

# A session bills until it is stopped, so stop it on every exit path -
# success, agent failure, an error under `set -e`, or a start timeout that
# fired after the session was already created.
SESSION_ID="$(grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' "${START_OUT}" | head -1 || true)"
cleanup() {
  if [ -n "${SESSION_ID}" ]; then
    echo "==> Stopping EAS Simulator session ${SESSION_ID}"
    eas simulator:stop --id "${SESSION_ID}" --non-interactive || true
  fi
}
trap cleanup EXIT

if [ -n "${START_FAILED:-}" ]; then
  echo "==> ERROR: simulator session was not ready within 8 minutes."
  exit 1
fi
: "${SESSION_ID:?could not parse the simulator session id from simulator:start output}"

# Point the Argent client (and the agent's MCP server) at this session.
ARGENT_TOOLS_URL="$(sed -n "s/^export ARGENT_TOOLS_URL='\(.*\)'$/\1/p" "${START_OUT}" | head -1)"
ARGENT_AUTH_TOKEN="$(sed -n "s/^export ARGENT_AUTH_TOKEN='\(.*\)'$/\1/p" "${START_OUT}" | head -1)"
export ARGENT_TOOLS_URL ARGENT_AUTH_TOKEN
: "${ARGENT_TOOLS_URL:?could not parse ARGENT_TOOLS_URL}"
: "${ARGENT_AUTH_TOKEN:?could not parse ARGENT_AUTH_TOKEN}"

# ---------------------------------------------------------------------------
# 2. Pick the device. The session boots one simulator already; prefer whatever
#    is Booted and fall back to IOS_SIM_DEVICE by name.
# ---------------------------------------------------------------------------
UDID="$(argent run list-devices --json | DEVICE_NAME="${DEVICE_NAME}" node -e '
let raw = "";
process.stdin.on("data", (c) => (raw += c)).on("end", () => {
  const devices = (JSON.parse(raw).devices || []).filter((d) => d.platform === "ios");
  const picked =
    devices.find((d) => d.state === "Booted") ||
    devices.find((d) => d.name === process.env.DEVICE_NAME);
  if (!picked) {
    console.error("no usable iOS device in the session");
    process.exit(1);
  }
  process.stdout.write(picked.udid);
});
')"
echo "==> Remote device: ${UDID}"

# ---------------------------------------------------------------------------
# 3. Install the build. The Argent client tars the .app and streams it to the
#    session VM automatically whenever it is routed to a remote tool-server.
# ---------------------------------------------------------------------------
echo "==> Installing ${APP_ID} on the remote simulator"
argent run reinstall-app \
  --udid "${UDID}" \
  --bundleId "${APP_ID}" \
  --appPath "${APP_PATH}"

# ---------------------------------------------------------------------------
# 4. Register Argent as the agent's MCP server, bound to this session.
#
# The "mcp" subcommand is required: bare `argent` prints its usage text and
# exits 0, so the stdio handshake never happens and zero tools register.
# The env block is Argent's highest-precedence config, and works in sandboxed
# shells where `argent link` cannot write to ~/.argent.
# ---------------------------------------------------------------------------
MCP_CONFIG="$(mktemp)"
ARGENT_TOOLS_URL="${ARGENT_TOOLS_URL}" ARGENT_AUTH_TOKEN="${ARGENT_AUTH_TOKEN}" \
  node -e '
const fs = require("fs");
fs.writeFileSync(process.argv[1], JSON.stringify({
  mcpServers: {
    argent: {
      command: "argent",
      args: ["mcp"],
      env: {
        ARGENT_TOOLS_URL: process.env.ARGENT_TOOLS_URL,
        ARGENT_AUTH_TOKEN: process.env.ARGENT_AUTH_TOKEN,
      },
    },
  },
}, null, 2));
' "${MCP_CONFIG}"

SYSTEM_PROMPT="You are a mobile QA agent. You test the iOS app 'Summit \
Supply' (bundle id: ${APP_ID}) on a REMOTE EAS Simulator session. The app is \
already installed - your first action is launch-app with that bundle id. \
Every Argent tool needs udid ${UDID} - always pass that exact udid. Gesture \
coordinates are normalized 0.0-1.0 fractions of the screen, not pixels. \
Work fast: \
(1) Verify with the accessibility tree (describe), never with screenshots - \
the harness captures the final screenshot for you. \
(2) Batch every multi-action step into ONE run-sequence call - fill a whole \
form (tap field, type, tap next field, type, tap submit) in a single call \
instead of one call per action. \
(3) Read the screen once per screen: one describe after each navigation or \
submit is enough - do not re-describe after every keystroke. \
End your final message with exactly 'VERDICT: PASS' or 'VERDICT: FAIL' and a \
one-sentence reason."

echo "==> Starting QA agent for flow: ${FLOW}"

# --bare is deliberately NOT used here: it reads Anthropic auth strictly from
# ANTHROPIC_API_KEY and never reads OAuth, which would reject
# CLAUDE_CODE_OAUTH_TOKEN. The EAS worker is a clean checkout with no hooks,
# plugins, or CLAUDE.md, so the run stays reproducible without it.
# Switch back to `claude --bare` if you move to an ANTHROPIC_API_KEY.
#
# Output goes through `tee <file>`, NEVER `tee /dev/stderr`: on the Linux
# workers stderr is a socket, opening it by path fails with ENXIO, tee dies,
# and pipefail turns a passing agent run into a job failure (while claude
# hangs on a reader-less pipe).
#
# `timeout 600` bounds a wedged agent (e.g. an MCP call stuck on the tunnel);
# MCP_TOOL_TIMEOUT bounds each individual tool call so one stuck call fails
# fast instead of eating the whole budget. The agent's exit code is
# deliberately ignored - the verdict text in the log is the pass signal.
AGENT_LOG="./artifacts/${FLOW}-agent.log"
MCP_TIMEOUT=60000 MCP_TOOL_TIMEOUT=120000 \
timeout 600 claude -p "$(cat "scripts/agent-qa/flows/${FLOW}.md")" \
  --append-system-prompt "${SYSTEM_PROMPT}" \
  --mcp-config "${MCP_CONFIG}" \
  --allowedTools "mcp__argent" \
  --permission-mode dontAsk \
  --max-turns 60 </dev/null 2>&1 | tee "${AGENT_LOG}" || true

# Final screenshot, captured deterministically by the script (the agent only
# has argent tools, so it cannot write files into ./artifacts itself).
argent run screenshot --udid "${UDID}" --scale 1.0 \
  --includeImageInContext false --out "./artifacts/${FLOW}-final.png" || true

if grep -qi "VERDICT: PASS" "${AGENT_LOG}"; then
  echo "==> PASS (${FLOW})"
  exit 0
fi
echo "==> FAIL (${FLOW})"
exit 1
