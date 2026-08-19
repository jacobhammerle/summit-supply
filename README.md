# Summit Supply — QA swarm demo (SDK 57, @expo/ui, EAS Simulator)

A mock outdoor gear app built for one purpose: run `eas workflow:run qa-swarm.yml`
once and watch five AI QA agents test five flows on five **EAS cloud
simulators** in parallel.

## Stack

- **Expo SDK 57** (expo@57.0.12, react-native 0.86, expo-router 6 API of SDK 57)
- **@expo/ui** — every screen renders real SwiftUI (Form, Section, Toggle,
  segmented Picker, Menu, TextField, SecureField, SF Symbols)
- **EAS Simulator** — each QA agent drives its own cloud-hosted iOS Simulator
- **iOS only** (`platforms: ["ios"]`)
- No backend, no network calls. Deterministic order number (`SS-1042`)
  and ticket number (`SS-7301`) on every run.

## The main demo: one command, five cloud simulators

```bash
eas workflow:run .eas/workflows/qa-swarm.yml
```

The workflow (`.eas/workflows/qa-swarm.yml`) does this:

1. **fingerprint** — computes the iOS fingerprint of the current commit.
2. **ios_get_build** — looks for an existing simulator build with the same
   fingerprint. On a repeat run this hits, and the swarm fans out in ~90
   seconds.
3. **ios_repack** or **ios_build** — reuses the matched build, or builds fresh.
4. **qa_signup … qa_offline** — five parallel jobs on **linux-medium**
   workers. Each job runs `scripts/agent-qa/run-flow.sh`, which:
   - starts its own **EAS Simulator session** (`eas simulator:start
     --type argent`) — the sessions appear live on the project's
     [Simulator sessions](https://expo.dev/accounts/sunrise-solutions/projects/summit-supply/simulator-sessions) page,
   - uploads the build to the session and installs it,
   - runs a headless Claude Code agent whose **Argent** (Software Mansion)
     MCP server is bound to that session — launch, tap, type, screenshots,
     accessibility tree,
   - greps the agent's `VERDICT: PASS` / `VERDICT: FAIL` for the exit code,
   - **stops the session on every exit path** (sessions bill until stopped),
   - uploads `artifacts/` (agent log + final screenshot) to the run.

The QA jobs run on Linux **on purpose**: a simulator session needs a macOS VM
on EAS's side, and when the QA jobs also held macOS workers the sessions
deadlocked waiting for capacity. On Linux the jobs need nothing from macOS —
argent is an HTTP client to the remote session, claude is Node — and the
whole macOS pool serves the five simulators.

The job graph on the EAS dashboard IS the demo visual: one build node fanning
out into five agent lanes, with five live simulator sessions streaming.

## Setup

```bash
npm install
eas init          # links the project, writes projectId
```

Set two secrets in the **preview** environment:

```bash
# Auth for the headless Claude Code agents (from `claude setup-token`).
eas env:set --name CLAUDE_CODE_OAUTH_TOKEN --value <token> \
  --environment preview --visibility secret

# Robot access token (expo.dev -> Access Tokens). Required: the job-scoped
# EXPO_TOKEN that EAS injects into workflow jobs can read the API but is NOT
# authorized to create simulator sessions.
eas env:set --name EAS_SIMULATOR_EXPO_TOKEN --value <token> \
  --environment preview --visibility secret
```

An `ANTHROPIC_API_KEY` also works for the agents — swap the env var and
restore `claude --bare` in `run-flow.sh` (see the comment there). Per-token
billing avoids subscription rate limits across five parallel agents.

Validate, commit, and run (`workflow:run` needs a git repo to resolve the
project root, and uploads the working directory — `.easignore` keeps the
upload small):

```bash
eas workflow:validate .eas/workflows/qa-swarm.yml
git add -A && git commit -m "..."
eas workflow:run .eas/workflows/qa-swarm.yml
```

## Local smoke test (before the stage)

```bash
npx expo run:ios          # build and launch on a local simulator
```

For interactive local QA, run `npx @swmansion/argent init` and drive the app
from your editor's agent panel with the same flow prompts. Note that
`run-flow.sh` itself always creates a **cloud** session — running it locally
works, but starts (and bills) a real EAS Simulator session.

## The five flows

| # | Flow | Success text the agent must verify |
| --- | --- | --- |
| 1 | Create account | `Account created for sam@summit.dev` |
| 2 | Shop and check out | `Order SS-1042 confirmed` |
| 3 | Settings | `Settings saved` + `Units: metric · Notifications: off · Reminders: on` |
| 4 | Support ticket | `Ticket SS-7301 created` + `Category: Returns` |
| 5 | Trail logs (offline) | `3 of 3 logs synced` |

Agent prompts live in `scripts/agent-qa/flows/*.md`. Each success screen also
shows a "FLOW N COMPLETE" caption, readable across a room on video tiles.

## Why agents can drive this app reliably

`@expo/ui` renders real SwiftUI. SwiftUI exposes button labels, toggle labels,
and text content directly to the accessibility tree. Argent navigates that
tree, so the agents act on labels like "Create account" and "Simulate
offline" with no test IDs required.

Two hit-testing rules keep agent taps deterministic (both learned from real
agent failures):

- Rows and controls carry `contentShape(shapes.rectangle())` so their whole
  accessibility frame is tappable — without it, a tap in a `Spacer` gap or on
  a menu picker's label half does nothing.
- Toggles are the exception (iOS only hit-tests the switch itself), so the
  agent system prompt steers taps to the trailing switch control.

## Deep links

Scheme: `summitsupply://`. Example: `summitsupply://shop/ridgeline-tent-2`.

## Structure

```
.eas/workflows/qa-swarm.yml   The one-command swarm
scripts/agent-qa/
  run-flow.sh                 Starts an EAS Simulator session, installs the
                              build on it, runs headless Claude Code with the
                              Argent MCP server bound to that session
  flows/*.md                  One prompt per QA agent
app/
  index.tsx                   Home hub (SwiftUI Form, brand hero)
  signup.tsx                  Flow 1
  shop/, cart.tsx, checkout.tsx, order-confirmed.tsx   Flow 2
  settings.tsx                Flow 3 (segmented Picker, Toggles)
  support.tsx                 Flow 4 (Menu category, multiline TextField)
  offline.tsx                 Flow 5
lib/
  store.tsx                   App state (cart, settings, sync queue)
  products.ts                 Static catalog
  success.tsx                 Shared success screen (flows 1, 2, 4)
```

## Operational notes

- **Sessions always stop.** `run-flow.sh` traps EXIT and stops its session on
  success, failure, or timeout. If a run is canceled mid-flight, check
  `eas simulator:list --status in-progress` anyway.
- **Timing.** Expect ~8 minutes end to end on a build-cache hit: ~2.5 min of
  fingerprint + repack, ~80 s session provisioning per lane (occasionally up
  to ~4 min for one unlucky lane), and 1.5–3.5 min of agent work.
- **`tee /dev/stderr` does not work on Linux workers** (stderr is a socket;
  opening it by path fails with ENXIO). Agent output goes through
  `tee <file>` instead — see the comment in `run-flow.sh`.
- **Bare `argent` is not an MCP server.** It prints usage and exits 0. The
  MCP config must run `argent mcp`.

## Verification bot (`/verify`, `@expo-bot verify`)

Comment on a PR **or an issue** in this repo:

```
@expo-bot verify with fable     (or just /verify)
```

The bot reacts 👀, replies with a link to the EAS investigation run, and
posts findings with screenshot evidence when it completes.

- **On a PR** it builds the app at the PR **base** commit and at the **head**
  commit, reproduces the issue on the base build on an EAS Simulator, then
  verifies the fix on the head build.
- **On an issue** it builds the app at the default branch, verifies the
  reported bug, and — when it can author AND verify a fix — **opens a fix
  PR** (clearly bannered as agent-authored, never auto-merged).
- Model: `verify with <fable|opus|sonnet|haiku>`, `--model <claude-*>`, or a
  `--fable`-style flag. Default is `claude-fable-5`.

### Pieces

```
.github/workflows/verify-command.yml   Trigger: issue_comment. Write-access
                                       gate, 👀 ack, starts the EAS run,
                                       always-reports a failed start
.eas/workflows/verify-pr.yml           One linux-medium job (inputs:
                                       target_url, model, requester)
scripts/verify-pr/run-verification.sh  The investigation pipeline (below)
scripts/verify-pr/prompts/
  plan-app.md      PR on an app repo: plan only (script builds base+head)
  plan-issue.md    Issue: diagnose, plan, and optionally edit a fix copy
  prepare.md       PR on a library repo: agent-built repro app (fallback)
  investigate.md   Drive the simulator, capture evidence, draft the report
  critic.md        Fresh-context adversarial review of the draft
scripts/verify-pr/watch.sh             Cross-repo fallback poller (for repos
                                       where the GHA workflow cannot live)
```

### The pipeline (hardening mirrors expo/expo's agent-commands.yml)

1. **Canary** — a one-word write on the real model proves the credential and
   the file-permission rules before any money is spent.
2. **Context** — the script (not an agent) collects the PR/issue JSON, a
   SHA-pinned diff, and linked issues into `work/context/`, each file
   truncation-marked at the top. **No agent env ever holds the GitHub
   token.**
3. **Build** — the script runs the EAS builds. The planner/diagnose agent
   reads reporter-authored text, so it has **no shell**; in issue mode it can
   edit only `work/fix-src/`, `work/plan.md`, and `work/pr.md`.
4. **Investigate** — an agent drives a remote EAS Simulator session,
   reproduces on base, verifies on the fix/head build, captures named
   screenshots, and drafts `artifacts/report.md`. It cannot post.
5. **Critic** — a fresh-context reviewer (no MCP, no shell, no network) reads
   the draft plus the rendered run log and writes MUST-FIX objections.
6. **Revise** — the investigator's session is resumed with the review while
   the simulator is still alive, so objections are settled by measuring.
7. **Publish** — script only: stop the session, note if the PR head moved
   mid-run, open the fix PR (issue mode, only on a `fix-verified` outcome,
   through a path denylist that refuses config/automation files), upload
   evidence to the public repo, post the comment. Failures post a "did not
   complete" comment with salvaged partial notes in the artifacts.

### One-time setup

GitHub repo secrets (Settings → Secrets → Actions):

```
EXPO_TOKEN            robot token (may run EAS workflows on this project)
VERIFY_BOT_GH_TOKEN   optional; bot identity for the ack + announce comments
```

EAS `preview` environment (next to the two QA-swarm secrets):

```bash
# Reads the PR, pushes fix branches, posts comments, writes evidence.
eas env:set --name VERIFY_GITHUB_TOKEN --value <token> \
  --environment preview --visibility secret
```

Evidence host: screenshots upload to this repo's `evidence` branch
(auto-created on first run) and embed as raw URLs. **This repo must be
public** — GitHub's image proxy fetches comment images anonymously, so a
private repo means broken images for every viewer. Override with
`EVIDENCE_REPO` / `EVIDENCE_BRANCH` on the job if needed.

The trigger workflow must be on the **default branch** before comments can
fire it (GitHub rule for `issue_comment`).

### Demo

`scripts/verify-pr/DEMO.md` is the runbook: a staged feature-request issue
plus a staged PR from `demo/settings-reset` (adds "Reset to defaults" to
Settings), then `/verify` on the PR proves base-vs-head with evidence.
