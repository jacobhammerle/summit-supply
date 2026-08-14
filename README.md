# Summit Supply — QA swarm demo (SDK 57, @expo/ui, iOS)

A mock outdoor gear app built for one purpose: run `eas workflow:run qa-swarm.yml`
once and watch five AI QA agents test five flows on five iOS Simulators in parallel.

## Stack

- **Expo SDK 57** (expo@57.0.12, react-native 0.86, expo-router 6 API of SDK 57)
- **@expo/ui** — every screen renders real SwiftUI (Form, Section, Toggle,
  segmented Picker, TextField, SecureField, SF Symbols)
- **iOS only** (`platforms: ["ios"]`)
- No backend, no network calls. Deterministic order number (`SS-1042`)
  and ticket number (`SS-7301`) on every run.

## The main demo: one command, five simulators

```bash
eas workflow:run qa-swarm.yml
```

The workflow (`.eas/workflows/qa-swarm.yml`) does this:

1. **fingerprint** — computes the iOS fingerprint of the current commit.
2. **ios_get_build** — looks for an existing simulator build with the same
   fingerprint. On a repeat run, this hits and the swarm starts in seconds.
3. **ios_repack** or **ios_build** — reuses the matched build, or builds fresh.
4. **qa_signup, qa_checkout, qa_settings, qa_support, qa_offline** — five
   parallel jobs. Each runs on its own `macos-medium` worker, boots its own
   iOS Simulator, installs the app, and starts a headless Claude Code agent
   (`claude --bare -p`) with **Argent** (Software Mansion) as its MCP
   server. Argent gives the agent hands on the simulator: launch, tap,
   type, screenshots, accessibility tree. The agent reports
   `VERDICT: PASS` or `VERDICT: FAIL`, which sets the job's exit code.

The job graph on the EAS dashboard IS the demo visual: one build node
fanning out into five green agent lanes.

## Setup

```bash
npm install
eas init                      # links the project, writes projectId
eas credentials               # not needed for simulator builds
```

Set the agent's API key as an EAS environment variable (environment: preview):

```bash
eas env:create --name ANTHROPIC_API_KEY --value sk-ant-... \
  --environment preview --visibility secret
```

The headless agent runs with `claude --bare`, which authenticates with
`ANTHROPIC_API_KEY` and skips local config discovery for reproducible runs.

Validate the workflow once the repo is linked:

```bash
eas workflow:validate .eas/workflows/qa-swarm.yml
```

Commit and push (workflows run from a git ref), then:

```bash
eas workflow:run qa-swarm.yml
```

## Local smoke test (before the stage)

```bash
npx expo run:ios                    # build and launch on a local simulator
npm i -g @swmansion/argent @anthropic-ai/claude-code
FLOW=signup ANTHROPIC_API_KEY=sk-ant-... \
  bash scripts/agent-qa/run-flow.sh /path/to/SummitSupply.app
```

For interactive local use, run `npx @swmansion/argent init` in the project.
The wizard registers the Argent MCP server with your editor, and you can
drive the app from your agent panel with the same flow prompts.

## The five flows

| # | Flow | Success text the agent must verify |
| --- | --- | --- |
| 1 | Create account | `Account created for sam@summit.dev` |
| 2 | Shop and check out | `Order SS-1042 confirmed` |
| 3 | Settings | `Settings saved` + `Units: metric · Notifications: off · Reminders: on` |
| 4 | Support ticket | `Ticket SS-7301 created` |
| 5 | Trail logs (offline) | `3 of 3 logs synced` |

Agent prompts live in `scripts/agent-qa/flows/*.md`. Each success screen also
shows a "FLOW N COMPLETE" caption, readable across a room on video tiles.

## Why agents can drive this app reliably

`@expo/ui` renders real SwiftUI. SwiftUI exposes button labels, toggle labels,
and text content directly to the accessibility tree. Argent navigates that
tree, so the agents act on labels like "Create account" and "Simulate
offline" with no test IDs required.

Note: Argent's control and screenshot features work on this plain simulator
build. Its debug and profiling features (React tree, network inspector) need
a development build with the dev server running. The QA flows only use
control and screenshots.

## Deep links

Scheme: `summitsupply://`. Example: `summitsupply://shop/ridgeline-tent-2`.

## Structure

```
.eas/workflows/qa-swarm.yml   The one-command swarm
scripts/agent-qa/
  run-flow.sh                 Boots the simulator, installs the app, runs
                              headless Claude Code with the Argent MCP server
  flows/*.md                  One prompt per QA agent
app/
  index.tsx                   Home hub (SwiftUI Form)
  signup.tsx                  Flow 1
  shop/, cart.tsx, checkout.tsx, order-confirmed.tsx   Flow 2
  settings.tsx                Flow 3 (segmented Picker, Toggles)
  support.tsx                 Flow 4 (menu Picker, multiline TextField)
  offline.tsx                 Flow 5
lib/
  store.tsx                   App state (cart, settings, sync queue)
  products.ts                 Static catalog
```

## Notes

- The workflow's job graph mirrors Callstack's published `eas-agent-device`
  template (fingerprint → get-build → repack/build → macOS QA jobs), trimmed
  to iOS and fanned out to five flow-specific agents, with Argent + headless
  Claude Code as the agent layer instead of agent-device.
- `eas simulator:start` cloud sessions are an alternative surface for the
  same demo. This workflow uses per-worker simulators because the build
  artifact, install, and agent all run in one job with no session handoff.
