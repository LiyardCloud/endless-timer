// Offline test harness: runs endless-timer-status.js with stubbed Scriptable globals.
// Usage: node tools/scriptable/test-harness.mjs
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("./endless-timer-status.js", import.meta.url), "utf8");

function makeEnv({ keychain = {}, cache = null, response, family = "accessoryRectangular", runsInApp = false, alertInput = "" }) {
  const files = new Map();
  if (cache) files.set("/docs/endless-timer-current.json", JSON.stringify(cache));
  const store = { ...keychain };
  const out = { widget: null, requests: [], completed: false };

  class Node {
    constructor(kind) { this.kind = kind; this.children = []; }
    addText(text) { const n = { kind: "text", text }; this.children.push(n); return n; }
    addDate(date) { const n = { kind: "date", date, timerStyle: false, applyTimerStyle() { this.timerStyle = true; } }; this.children.push(n); return n; }
    addStack() { const n = new Node("stack"); this.children.push(n); return n; }
    addSpacer() {}
    setPadding() {}
  }
  class ListWidget extends Node { constructor() { super("widget"); } async presentSmall() { out.widget = this; } }

  const globals = {
    console,
    Date, Number, JSON, String, Error,
    FileManager: { local: () => ({
      documentsDirectory: () => "/docs",
      joinPath: (a, b) => `${a}/${b}`,
      fileExists: (p) => files.has(p),
      readString: (p) => files.get(p),
      writeString: (p, s) => files.set(p, s)
    }) },
    Keychain: {
      contains: (k) => k in store,
      get: (k) => store[k],
      set: (k, v) => { store[k] = v; }
    },
    Request: class {
      constructor(url) { this.url = url; this.headers = {}; }
      async loadJSON() {
        out.requests.push({ url: this.url, headers: this.headers });
        if (response instanceof Error) throw response;
        this.response = { statusCode: response.status };
        return response.body;
      }
    },
    Alert: class {
      addSecureTextField() {} addAction() {} addCancelAction() {}
      async presentAlert() { return alertInput ? 0 : -1; }
      async presentSheet() { return 0; }
      textFieldValue() { return alertInput; }
    },
    Color: Object.assign(class { constructor(hex) { this.hex = hex; } }, { gray: () => ({ hex: "gray" }) }),
    // Only real Scriptable Font factories (docs.scriptable.app/font); an unknown name throws like on iOS.
    Font: Object.fromEntries([
      "systemFont", "ultraLightSystemFont", "thinSystemFont", "lightSystemFont", "regularSystemFont",
      "mediumSystemFont", "semiboldSystemFont", "boldSystemFont", "heavySystemFont", "blackSystemFont",
      "italicSystemFont", "ultraLightMonospacedSystemFont", "thinMonospacedSystemFont",
      "lightMonospacedSystemFont", "regularMonospacedSystemFont", "mediumMonospacedSystemFont",
      "semiboldMonospacedSystemFont", "boldMonospacedSystemFont", "heavyMonospacedSystemFont",
      "blackMonospacedSystemFont", "ultraLightRoundedSystemFont", "thinRoundedSystemFont",
      "lightRoundedSystemFont", "regularRoundedSystemFont", "mediumRoundedSystemFont",
      "semiboldRoundedSystemFont", "boldRoundedSystemFont", "heavyRoundedSystemFont", "blackRoundedSystemFont"
    ].map((name) => [name, (size) => ({ name, size })])),
    ListWidget,
    Script: { setWidget: (w) => { out.widget = w; }, complete: () => { out.completed = true; } },
    config: { runsInApp, runningInWidget: !runsInApp, widgetFamily: runsInApp ? null : family },
    args: {}
  };
  return { globals, out, files, store };
}

async function run(opts) {
  const env = makeEnv(opts);
  const context = vm.createContext(env.globals);
  await vm.runInContext(`(async () => {\n${source}\n})()`, context);
  return env;
}

const texts = (node) => node.children.flatMap((c) => (c.kind === "text" ? [c.text] : c.kind === "stack" ? texts(c) : []));
const dates = (node) => node.children.flatMap((c) => (c.kind === "date" ? [c] : c.kind === "stack" ? dates(c) : []));

const current = { actionId: "a1", name: "Reading", color: "#C8722F", icon: "book", title: "", startedAt: "2026-11-19T13:34:00.000Z" };

// 1. Online, Lock Screen: name + ticking timer, request carries the key, cache written.
{
  const env = await run({ keychain: { "endless-timer-api-key": "et_test" }, response: { status: 200, body: current } });
  assert.equal(env.out.requests[0].url, "https://endless-timer.vercel.app/api/activity/current");
  assert.equal(env.out.requests[0].headers.Authorization, "Bearer et_test");
  assert.deepEqual(texts(env.out.widget), ["Reading"]);
  const [timer] = dates(env.out.widget);
  assert.equal(timer.timerStyle, true);
  assert.equal(timer.date.toISOString(), current.startedAt);
  assert.ok(env.files.get("/docs/endless-timer-current.json").includes("Reading"));
  assert.ok(env.out.widget.refreshAfterDate > new Date());
  assert.equal(env.out.completed, true);
  console.log("ok 1 online lock screen");
}

// 2. Offline with cache: last known state + offline note, no crash.
{
  const env = await run({ keychain: { "endless-timer-api-key": "et_test" }, cache: current, response: new Error("The Internet connection appears to be offline.") });
  assert.deepEqual(texts(env.out.widget), ["Reading", "⚠︎ The Internet connection appears to be offline."]);
  assert.equal(dates(env.out.widget)[0].timerStyle, true);
  console.log("ok 2 offline uses cache");
}

// 3. Revoked key (401) with cache: cached state + clear reason.
{
  const env = await run({ keychain: { "endless-timer-api-key": "et_bad" }, cache: current, response: { status: 401, body: { error: "API key is not active." } } });
  assert.deepEqual(texts(env.out.widget), ["Reading", "⚠︎ API key rejected"]);
  console.log("ok 3 401 shows reason");
}

// 4. No key, running as widget: no request, tells the user to run it in Scriptable.
{
  const env = await run({ response: { status: 200, body: current } });
  assert.equal(env.out.requests.length, 0);
  assert.deepEqual(texts(env.out.widget), ["EndlessTimer", "⚠︎ No API key — run in Scriptable"]);
  console.log("ok 4 no key in widget");
}

// 5. First run in app: key prompt stores the key in Keychain, then preview renders.
{
  const env = await run({ runsInApp: true, alertInput: "et_new", response: { status: 200, body: current } });
  assert.equal(env.store["endless-timer-api-key"], "et_new");
  assert.equal(env.out.requests[0].headers.Authorization, "Bearer et_new");
  assert.ok(texts(env.out.widget).includes("Reading"));
  console.log("ok 5 first run stores key");
}

// 6. No current activity: shows "No activity", no timer.
{
  const env = await run({ keychain: { "endless-timer-api-key": "et_test" }, response: { status: 200, body: { actionId: null, name: null, color: null, icon: null, title: "", startedAt: null } } });
  assert.deepEqual(texts(env.out.widget), ["No activity"]);
  assert.equal(dates(env.out.widget).length, 0);
  console.log("ok 6 no activity");
}

// 7. Home Screen small: colored title + timer.
{
  const env = await run({ keychain: { "endless-timer-api-key": "et_test" }, family: "small", response: { status: 200, body: current } });
  assert.deepEqual(texts(env.out.widget), ["NOW", "Reading"]);
  assert.equal(dates(env.out.widget)[0].timerStyle, true);
  console.log("ok 7 small widget");
}

// The script must not contain a key.
assert.ok(!/et_[A-Za-z0-9]{10,}/.test(source), "script must not embed an API key");
console.log("ok 8 no embedded key");
