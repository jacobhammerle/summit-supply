#!/usr/bin/env bash
# Watches a GitHub PR (or a whole repo) for "@expo-bot verify" comments and
# starts the verify-pr EAS workflow for each one.
#
# For every new trigger comment it:
#   1. posts the acknowledgement comment with a link to the EAS run,
#   2. runs `eas workflow:run .eas/workflows/verify-pr.yml` with the PR URL,
#      the requested model, and the requester's login as inputs.
# The workflow job does the investigation and posts the findings itself.
#
# Usage:
#   watch.sh <pr-url | owner/repo> [--interval <seconds>] [--once]
#            [--dry-run] [--replay]
#
#   <pr-url>      watch one PR, e.g. https://github.com/expo/expo/pull/49088
#   owner/repo    watch every PR in the repo (one API call per poll)
#   --interval    poll interval in seconds (default 30)
#   --once        poll one time and exit
#   --dry-run     print what would happen; post nothing, run nothing
#   --replay      also fire on trigger comments that already exist
#                 (default: the first poll only records them)
#
# Trigger comment syntax (anywhere in a comment body):
#   @expo-bot verify                 -> default model (fable)
#   @expo-bot verify with fable      -> claude-fable-5
#   @expo-bot verify with sonnet     -> claude-sonnet-5
#   @expo-bot verify with <model-id> -> any full claude-* model id
#
# Environment:
#   VERIFY_GITHUB_TOKEN  optional. GitHub token used to poll and to post the
#                        acknowledgement. Set this to the bot account's token
#                        so the comment posts as the bot. Falls back to the
#                        local `gh` login.
#   EXPO_ACCOUNT         Expo account for the run URL (default sunrise-solutions)
#   EXPO_PROJECT         Expo project for the run URL (default summit-supply)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKFLOW_FILE=".eas/workflows/verify-pr.yml"
EXPO_ACCOUNT="${EXPO_ACCOUNT:-sunrise-solutions}"
EXPO_PROJECT="${EXPO_PROJECT:-summit-supply}"
DEFAULT_MODEL_ALIAS="fable"

TARGET="${1:?Usage: watch.sh <pr-url | owner/repo> [--interval N] [--once] [--dry-run] [--replay]}"
shift
INTERVAL=30
ONCE=""
DRY_RUN=""
REPLAY=""
while [ $# -gt 0 ]; do
  case "$1" in
    --interval) INTERVAL="${2:?--interval needs a value}"; shift 2 ;;
    --once)     ONCE=1; shift ;;
    --dry-run)  DRY_RUN=1; shift ;;
    --replay)   REPLAY=1; shift ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

# gh authenticates from GH_TOKEN when it is set.
if [ -n "${VERIFY_GITHUB_TOKEN:-}" ]; then
  export GH_TOKEN="${VERIFY_GITHUB_TOKEN}"
fi

# ---------------------------------------------------------------------------
# Parse the target into owner, repo, and an optional PR number.
# ---------------------------------------------------------------------------
PR_FILTER=""
if [[ "${TARGET}" =~ ^https://github\.com/([^/]+)/([^/]+)/(pull|issues)/([0-9]+) ]]; then
  OWNER="${BASH_REMATCH[1]}"; REPO="${BASH_REMATCH[2]}"; PR_FILTER="${BASH_REMATCH[4]}"
elif [[ "${TARGET}" =~ ^([^/]+)/([^/]+)$ ]]; then
  OWNER="${BASH_REMATCH[1]}"; REPO="${BASH_REMATCH[2]}"
else
  echo "target must be a PR URL or owner/repo: ${TARGET}" >&2
  exit 2
fi

STATE_DIR="${HOME}/.cache/verify-pr-watch"
mkdir -p "${STATE_DIR}"
SEEN_FILE="${STATE_DIR}/${OWNER}-${REPO}${PR_FILTER:+-pr${PR_FILTER}}.seen"
touch "${SEEN_FILE}"

# The identity we post with. Its own comments are never treated as triggers,
# so the bot cannot trigger itself.
SELF_LOGIN="$(gh api user --jq .login)"
echo "==> Watching ${OWNER}/${REPO}${PR_FILTER:+ PR #${PR_FILTER}} as ${SELF_LOGIN}"
echo "==> State: ${SEEN_FILE}"

# ---------------------------------------------------------------------------
# Map a model alias from the comment to a full model id.
# ---------------------------------------------------------------------------
resolve_model() {
  case "$1" in
    fable)    echo "claude-fable-5" ;;
    opus)     echo "claude-opus-5" ;;
    sonnet)   echo "claude-sonnet-5" ;;
    haiku)    echo "claude-haiku-4-5" ;;
    claude-*) echo "$1" ;;
    *)        echo "" ;;
  esac
}

# ---------------------------------------------------------------------------
# fire <number> <requester> <model-alias> <target-url>
# target-url is the PR or issue URL (no comment fragment). Posts the
# acknowledgement and starts the EAS workflow run.
# ---------------------------------------------------------------------------
fire() {
  local pr="$1" requester="$2" alias="$3" target_url="$4"
  local model
  model="$(resolve_model "${alias}")"
  if [ -z "${model}" ]; then
    echo "==> Unknown model alias '${alias}' on ${target_url}; using ${DEFAULT_MODEL_ALIAS}"
    model="$(resolve_model "${DEFAULT_MODEL_ALIAS}")"
  fi

  echo "==> Trigger from @${requester} on #${pr} (model: ${model})"
  if [ -n "${DRY_RUN}" ]; then
    echo "    [dry-run] would run: eas workflow:run ${WORKFLOW_FILE} \\"
    echo "      -F target_url=${target_url} -F model=${model} -F requester=${requester}"
    echo "    [dry-run] would post the acknowledgement on #${pr}"
    return 0
  fi

  # Start the workflow first so the acknowledgement can link to the run.
  # workflow:run uploads the working directory, so run it from the repo root.
  local run_json run_id run_url
  run_json="$(cd "${REPO_ROOT}" && eas workflow:run "${WORKFLOW_FILE}" \
    -F "target_url=${target_url}" -F "model=${model}" -F "requester=${requester}" \
    --non-interactive --json 2>/dev/null)"
  if [ -z "${run_json}" ]; then
    echo "==> ERROR: workflow:run produced no output; not posting the acknowledgement"
    return 1
  fi
  run_id="$(printf '%s' "${run_json}" | node -e '
let raw = ""; process.stdin.on("data", c => raw += c).on("end", () => {
  try {
    const d = JSON.parse(raw);
    process.stdout.write(d.workflowRunId || d.id || "");
  } catch { /* leave empty */ }
});')"
  if [ -n "${run_id}" ]; then
    run_url="https://expo.dev/accounts/${EXPO_ACCOUNT}/projects/${EXPO_PROJECT}/workflows/${run_id}"
  else
    echo "==> WARNING: could not parse the run id from workflow:run output:"
    printf '%s\n' "${run_json}"
    run_url="https://expo.dev/accounts/${EXPO_ACCOUNT}/projects/${EXPO_PROJECT}/workflows"
  fi
  echo "==> Run: ${run_url}"

  local body=":mag: /verify started for @${requester} — watch the [investigation run](${run_url}). Findings will be posted here when it completes."
  gh api "repos/${OWNER}/${REPO}/issues/${pr}/comments" -f body="${body}" --jq .html_url
}

# ---------------------------------------------------------------------------
# Poll loop. Comments arrive as tab-separated fields; bodies are flattened to
# one line by the --jq template so a multi-line comment cannot break parsing.
# ---------------------------------------------------------------------------
FIRST_POLL=1
while :; do
  if [ -n "${PR_FILTER}" ]; then
    API_PATH="repos/${OWNER}/${REPO}/issues/${PR_FILTER}/comments?per_page=100"
  else
    # Newest first across the whole repo; 100 covers a poll interval easily.
    API_PATH="repos/${OWNER}/${REPO}/issues/comments?sort=created&direction=desc&per_page=100"
  fi

  # Fields: id, author, issue-or-pr URL, comment URL, flattened body.
  COMMENTS="$(gh api "${API_PATH}" --jq \
    '.[] | [(.id | tostring), .user.login, .html_url, (.body // "" | gsub("[\r\n\t]"; " "))] | @tsv' \
    2>/dev/null || true)"

  while IFS=$'\t' read -r cid author curl_ body; do
    [ -n "${cid}" ] || continue
    [ "${author}" = "${SELF_LOGIN}" ] && continue
    grep -qxF "${cid}" "${SEEN_FILE}" && continue

    if [[ "${body}" =~ @expo-bot[[:space:]]+verify([[:space:]]+with[[:space:]]+([A-Za-z0-9-]+))? ]]; then
      alias_="${BASH_REMATCH[2]:-${DEFAULT_MODEL_ALIAS}}"
      echo "${cid}" >> "${SEEN_FILE}"
      if [ -n "${FIRST_POLL}" ] && [ -z "${REPLAY}" ]; then
        echo "==> Recorded existing trigger ${curl_} (start with --replay to fire on these)"
        continue
      fi
      # The comment html_url carries the PR/issue path; strip the fragment.
      num="$(printf '%s' "${curl_}" | sed -n 's|.*/\(pull\|issues\)/\([0-9]*\).*|\2|p')"
      kind="$(printf '%s' "${curl_}" | sed -n 's|.*/\(pull\|issues\)/[0-9].*|\1|p')"
      [ -n "${num}" ] || continue
      fire "${num}" "${author}" "${alias_}" "https://github.com/${OWNER}/${REPO}/${kind}/${num}" || \
        echo "==> WARNING: trigger handling failed for ${curl_}"
    fi
  done <<< "${COMMENTS}"

  FIRST_POLL=""
  [ -n "${ONCE}" ] && break
  sleep "${INTERVAL}"
done
