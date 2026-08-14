#!/usr/bin/env bash
# Boots an iOS Simulator on the EAS macOS worker, installs the app,
# then runs a headless Claude Code QA agent. Argent (Software Mansion)
# is the agent's MCP server: it gives the agent control of the app on
# the simulator (launch, tap, type, screenshots, accessibility tree).
#
# Usage: run-flow.sh <path-to-.app>
#
# Required env:
#   FLOW                     - signup | checkout | settings | support | offline
#   APPLICATION_ID           - iOS bundle identifier
#   CLAUDE_CODE_OAUTH_TOKEN  - from EAS environment variables (preview)
set -euo pipefail

APP_PATH="${1:?Usage: run-flow.sh <path-to-.app>}"
DEVICE="${IOS_SIM_DEVICE:-iPhone 17}"
: "${FLOW:?FLOW env is required}"
APP_ID="${APPLICATION_ID:-dev.expo.summitsupply}"

echo "==> Flow: ${FLOW}"
echo "==> App:  ${APP_PATH}"
echo "==> Sim:  ${DEVICE}"

# Boot the simulator and wait until it is ready.
xcrun simctl boot "${DEVICE}" 2>/dev/null || true
xcrun simctl bootstatus "${DEVICE}" -b

# Install the app on the booted simulator. Argent will launch it.
xcrun simctl install booted "${APP_PATH}"

mkdir -p ./artifacts

# Register Argent as an MCP server for this headless run only.
MCP_CONFIG="$(mktemp)"
cat > "${MCP_CONFIG}" << 'JSON'
{
  "mcpServers": {
    "argent": {
      "command": "argent",
      "args": []
    }
  }
}
JSON

SYSTEM_PROMPT="You are a mobile QA agent. You test the iOS app 'Summit \
Supply' (bundle id: ${APP_ID}) on the booted iOS Simulator '${DEVICE}'. \
The app is already installed. Use the Argent MCP tools to launch the app, \
read the screen, tap, type, and verify results. After each action, read \
the screen again to confirm the result. Save a screenshot of the final \
state to ./artifacts/${FLOW}-final.png. End your final message with \
exactly 'VERDICT: PASS' or 'VERDICT: FAIL' and a one-sentence reason."

echo "==> Starting QA agent for flow: ${FLOW}"

# --bare is deliberately NOT used here: it reads Anthropic auth strictly from
# ANTHROPIC_API_KEY and never reads OAuth, which would reject
# CLAUDE_CODE_OAUTH_TOKEN. The EAS worker is a clean checkout with no hooks,
# plugins, or CLAUDE.md, so the run stays reproducible without it.
# Switch back to `claude --bare` if you move to an ANTHROPIC_API_KEY.
# --permission-mode dontAsk: deny anything not on the allow list.
OUTPUT="$(claude -p "$(cat "scripts/agent-qa/flows/${FLOW}.md")" \
  --append-system-prompt "${SYSTEM_PROMPT}" \
  --mcp-config "${MCP_CONFIG}" \
  --allowedTools "mcp__argent" \
  --permission-mode dontAsk \
  --max-turns 60 | tee /dev/stderr)"

if grep -qi "VERDICT: PASS" <<< "${OUTPUT}"; then
  echo "==> PASS (${FLOW})"
  exit 0
fi
echo "==> FAIL (${FLOW})"
exit 1
