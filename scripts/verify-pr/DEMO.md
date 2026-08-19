# Live demo runbook: `/verify` on summit-supply

A two-act demo on this repo. Act 1: an issue reports a bug; the bot verifies
it on an EAS Simulator and opens a fix PR. Act 2: `/verify` on that PR proves
base-vs-head. Everything visible lives in the GitHub thread and on the EAS
dashboard (workflow run graph + live simulator session).

## The planted bug

Branch `demo/plant-settings-bug` (one commit on top of main) swaps two values
in the settings summary line ([app/settings.tsx](../../app/settings.tsx)):
after "Save changes", the summary reports the **Notifications** state under
**Reminders** and the reverse. Repro: open Settings, turn Notifications OFF,
leave Trip reminders ON, tap Save — the summary reads
"Notifications: on · Reminders: off", which is backwards. Single screen,
objectively checkable from the accessibility tree.

## One-time setup (before demo day)

1. Merge the harness to main (the `issue_comment` trigger only fires from the
   default branch), and merge/push `demo/plant-settings-bug` to main too:

   ```bash
   git push origin main demo/plant-settings-bug
   git merge demo/plant-settings-bug && git push   # bug must be ON main for Act 1
   ```

2. GitHub repo secrets (Settings → Secrets and variables → Actions):
   - `EXPO_TOKEN` — the robot token (same value as `EAS_SIMULATOR_EXPO_TOKEN`).
   - `VERIFY_BOT_GH_TOKEN` — optional bot identity for ack comments.

3. EAS secret + evidence repo:

   ```bash
   eas env:set --name VERIFY_GITHUB_TOKEN --value <token with repo scope> \
     --environment preview --visibility secret
   gh repo create jacobhammerle/verify-evidence --public --add-readme
   ```

4. **Rehearse once** (see timing below): file a throwaway issue, comment
   `/verify`, watch the whole run, delete the throwaway thread. The rehearsal
   also surfaces any first-run gotcha while nobody is watching.

## Act 1 — issue → verified bug → fix PR

1. File the issue (reporter voice, no fix hints):

   > **Title:** Settings summary shows Notifications and Reminders swapped
   >
   > After changing settings and tapping "Save changes", the confirmation
   > summary reports the wrong states: I turned Notifications off and left
   > Trip reminders on, but the summary says "Notifications: on ·
   > Reminders: off". The toggles themselves look right; only the saved
   > summary is wrong. Seen on iOS.

2. Comment on the issue:

   ```
   @expo-bot verify with fable
   ```

3. Narrate while it runs: 👀 reaction (~5 s), announce comment with the EAS
   run link (~1 min), then on the EAS dashboard: the job log streams the
   agent turns; the simulator session appears on the project's
   [Simulator sessions](https://expo.dev/accounts/sunrise-solutions/projects/summit-supply/simulator-sessions) page.

4. Outcome: a findings comment on the issue (outcome `fix-verified`, evidence
   table with base-vs-fix screenshots) plus a bannered fix PR that says
   `Fixes #<n>`.

## Act 2 — `/verify` on the fix PR

Comment on the bot's PR (or any PR):

```
/verify
```

Same flow, PR mode: base build (bug) vs head build (fixed), findings posted
on the PR. If nobody pushed meanwhile, no "PR moved" warning appears.

## Timing budget (rehearse to confirm)

- Trigger → announce: under a minute.
- EAS job: two iOS simulator builds in parallel (~10–15 min; the planner
  agent runs while they bake), simulator session ~1.5 min, investigation
  5–10 min, critic + revise ~5 min. Expect **25–40 min** end to end.
- Fill: the qa-swarm run (`eas workflow:run .eas/workflows/qa-swarm.yml`)
  makes good stage business while the verify builds bake.

## Failure modes and the story if they hit

- Any failure after the announce posts a "did not complete" comment with the
  run link and salvaged partial notes — the thread never dangles.
- The preflight canary stops the run before builds if the model credential
  or the file rules are broken.
- If the evidence repo is missing, the report still posts (images degrade to
  a note pointing at the run artifacts).
- A second `/verify` on the same thread queues; it does not cancel the first.
