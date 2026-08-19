# Live demo runbook: `/verify` on summit-supply

One staged issue + one staged PR, no bug planting on main. The PR adds a
small feature; `/verify` proves the base build lacks it and the head build
delivers it, with screenshot evidence, live on an EAS Simulator.

## The staged feature

Branch `demo/settings-reset` (one commit, `84aa81f`) adds a **"Reset to
defaults"** button to the Settings screen ([app/settings.tsx](../../app/settings.tsx)):
one tap returns Units to Imperial, Notifications to on, Trip reminders to
off, persists them, and shows "Settings reset to defaults" with the values.
On the base build that button does not exist — both facts are objectively
checkable from the accessibility tree.

## Stage it (once, before demo day)

```bash
git push origin main demo/settings-reset
```

1. File the issue (feature request, reporter voice):

   > **Title:** Add a way to reset settings to their defaults
   >
   > After experimenting with units and the alert toggles, there is no quick
   > way back to the app's defaults — I have to remember what they were and
   > flip everything by hand. A one-tap "Reset to defaults" on the Settings
   > screen would make this much easier.

2. Open the PR from `demo/settings-reset` into `main`:

   > **Title:** Settings: add a Reset to defaults action
   >
   > **Body:** Adds a bordered "Reset to defaults" button under Save. It
   > returns the Units picker, Notifications, and Trip reminders to the
   > StoreProvider defaults (imperial / on / off), persists them
   > immediately, and shows a confirmation caption with the resulting
   > values. Closes #<issue number>.

   The `Closes #<n>` reference matters: the pipeline pulls the linked issue
   into the agent's context.

## The demo

Comment on the PR:

```
@expo-bot verify with fable
```

Narration beats while it runs:

1. 👀 reaction lands in seconds; the announce comment follows with the EAS
   run link (~1 min).
2. On the EAS dashboard: the job log streams the planner and investigation
   agents live; the simulator session appears on the project's
   [Simulator sessions](https://expo.dev/accounts/sunrise-solutions/projects/summit-supply/simulator-sessions) page.
3. Base and head builds run in parallel while the planner reads the PR and
   the linked issue and writes the test plan.
4. The findings comment: outcome `fix-verified`, a base-vs-head evidence
   table (Settings without the button; the reset confirmation after the
   tap), and a draft that survived an adversarial review before posting.

Optional second act: comment `@expo-bot verify` on the **issue** instead.
Issue mode verifies the request against `main` and, because the feature is
small, may author and verify its own implementation and open a fix PR.
Higher variance — rehearse it before doing it live.

## Timing budget (rehearse to confirm)

- Trigger → announce: under a minute.
- EAS job: two iOS builds in parallel (~10–15 min, planner runs meanwhile),
  simulator session ~1.5 min, investigation 5–10 min, critic + revise ~5
  min. Expect **25–40 min** end to end.
- Fill: the qa-swarm run (`eas workflow:run .eas/workflows/qa-swarm.yml`)
  makes good stage business while the verify builds bake.

## Failure modes and the story if they hit

- Any failure after the announce posts a "did not complete" comment with the
  run link and salvaged partial notes — the thread never dangles.
- The preflight canary stops the run before builds if the model credential
  or the file rules are broken.
- If evidence upload fails, the report still posts with a note pointing at
  the run artifacts.
- A second `/verify` on the same thread queues; it does not cancel the first.
