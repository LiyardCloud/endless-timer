# EndlessTimer status widget (Scriptable)

`endless-timer-status.js` is a script for the iOS app [Scriptable](https://scriptable.app) that
shows your EndlessTimer status as a widget.

## What it shows

- The **current activity** and a **live timer** counting up from when it started.
- Works on the **Lock Screen** (`accessoryRectangular`) and the **Home Screen** (`small`).
- With no running activity it shows "No activity".
- When the phone is offline or the API key is rejected (HTTP 401), it shows the **last cached
  state** with a short ⚠︎ warning explaining why.
- Tapping the widget opens EndlessTimer.

## Setup on iPhone

1. Install **Scriptable** from the App Store.
2. In Scriptable, create a new script and name it **EndlessTimer**.
3. Paste the contents of `endless-timer-status.js` into it.
4. Run the script once inside the Scriptable app. It asks for your API key: in EndlessTimer go to
   **Profile → API access → Create key** and paste the key. The key is stored in the Scriptable
   Keychain, never in the script file.
5. Add a Scriptable widget to the Lock Screen (or a small one to the Home Screen), edit it and pick
   the **EndlessTimer** script.

Run the script again inside the app to preview the widget or to replace the key ("Replace key").

## Refresh caveat

iOS refreshes widgets on its own budget, so after you switch activities the name on the widget may
lag by a few minutes. The timer itself is rendered by iOS and always ticks correctly.

## Offline test harness

The harness runs the script in Node with stubbed Scriptable globals:

```sh
node tools/scriptable/test-harness.mjs
```

It prints `ok 1` through `ok 8` and exits 0 when all checks pass.
