// EndlessTimer status widget for Scriptable (iOS).
// Shows the current activity and a live timer on the Lock Screen (accessoryRectangular)
// or the Home Screen (small). Tapping the widget opens EndlessTimer.
//
// Setup: run this script once inside the Scriptable app. It asks for your EndlessTimer API key
// (Profile → API access → Create key) and stores it in the Scriptable Keychain, never in this file.
// Run it again inside the app to see a preview, or to replace the key (choose "Replace key").

const BASE_URL = "https://endless-timer.vercel.app";
const KEYCHAIN_KEY = "endless-timer-api-key";
const CACHE_FILE = "endless-timer-current.json";
const REFRESH_MINUTES = 5;

const fm = FileManager.local();
const cachePath = fm.joinPath(fm.documentsDirectory(), CACHE_FILE);

async function askForKey(message) {
  const alert = new Alert();
  alert.title = "EndlessTimer API key";
  alert.message = message;
  alert.addSecureTextField("et_…", "");
  alert.addAction("Save");
  alert.addCancelAction("Cancel");
  const index = await alert.presentAlert();
  const value = alert.textFieldValue(0).trim();
  if (index === -1 || !value) return null;
  Keychain.set(KEYCHAIN_KEY, value);
  return value;
}

async function getApiKey() {
  if (Keychain.contains(KEYCHAIN_KEY)) {
    if (config.runsInApp && !args.shortcutParameter) {
      const menu = new Alert();
      menu.title = "EndlessTimer widget";
      menu.addAction("Preview widget");
      menu.addAction("Replace key");
      menu.addCancelAction("Cancel");
      const choice = await menu.presentSheet();
      if (choice === 1) return askForKey("Paste the new key from Profile → API access.");
      if (choice === -1) return null;
    }
    return Keychain.get(KEYCHAIN_KEY);
  }
  if (config.runsInApp) {
    return askForKey("Paste the key from EndlessTimer → Profile → API access → Create key.");
  }
  return null;
}

function readCache() {
  try {
    return fm.fileExists(cachePath) ? JSON.parse(fm.readString(cachePath)) : null;
  } catch (error) {
    return null;
  }
}

function writeCache(current) {
  try {
    fm.writeString(cachePath, JSON.stringify(current));
  } catch (error) {
    // The widget still renders without a cache.
  }
}

async function fetchCurrent(apiKey) {
  const request = new Request(`${BASE_URL}/api/activity/current`);
  request.headers = { Authorization: `Bearer ${apiKey}` };
  request.timeoutInterval = 10;
  const body = await request.loadJSON();
  const status = request.response ? request.response.statusCode : 0;
  if (status !== 200) {
    const reason = status === 401 ? "API key rejected" : `HTTP ${status}`;
    throw new Error(reason);
  }
  return body;
}

/** Returns { current, stale, error } — the cached state is used when the network fails. */
async function loadState(apiKey) {
  if (!apiKey) return { current: readCache(), stale: true, error: "No API key — run in Scriptable" };
  try {
    const current = await fetchCurrent(apiKey);
    writeCache(current);
    return { current, stale: false, error: null };
  } catch (error) {
    return { current: readCache(), stale: true, error: String(error.message || error) };
  }
}

function parseColor(hex, fallback) {
  return typeof hex === "string" && /^#?[0-9a-fA-F]{6}$/.test(hex) ? new Color(hex.replace("#", "")) : fallback;
}

function addTimer(stack, startedAt, font) {
  const started = startedAt ? new Date(startedAt) : null;
  if (!started || Number.isNaN(started.getTime())) {
    const dash = stack.addText("—");
    dash.font = font;
    return;
  }
  const timer = stack.addDate(started);
  timer.applyTimerStyle();
  timer.font = font;
}

function buildWidget(state, family) {
  const widget = new ListWidget();
  widget.url = BASE_URL;
  widget.refreshAfterDate = new Date(Date.now() + REFRESH_MINUTES * 60 * 1000);

  const current = state.current;
  const name = current && current.actionId ? current.name : "No activity";
  const lockScreen = family === "accessoryRectangular" || family === "accessoryInline";

  if (lockScreen) {
    widget.addAccessoryWidgetBackground = true;
    const title = widget.addText(state.stale && !current ? "EndlessTimer" : name);
    title.font = Font.semiboldSystemFont(15);
    title.lineLimit = 1;
    if (current && current.actionId) {
      addTimer(widget, current.startedAt, Font.monospacedDigitSystemFont(15, 600));
    }
    if (state.stale) {
      const note = widget.addText(state.error ? `⚠︎ ${state.error}` : "⚠︎ offline");
      note.font = Font.systemFont(10);
      note.lineLimit = 1;
    }
    return widget;
  }

  const accent = parseColor(current && current.color, Color.gray());
  widget.backgroundColor = new Color("0b1020");
  widget.setPadding(14, 14, 14, 14);

  const label = widget.addText("NOW");
  label.font = Font.semiboldSystemFont(10);
  label.textColor = new Color("8b93a7");
  widget.addSpacer(4);

  const title = widget.addText(name);
  title.font = Font.boldSystemFont(18);
  title.textColor = accent;
  title.lineLimit = 2;
  title.minimumScaleFactor = 0.6;
  widget.addSpacer(6);

  if (current && current.actionId) {
    const timerStack = widget.addStack();
    addTimer(timerStack, current.startedAt, Font.monospacedDigitSystemFont(22, 600));
    timerStack.addSpacer();
  }

  widget.addSpacer();
  if (state.stale) {
    const note = widget.addText(state.error ? `⚠︎ ${state.error}` : "⚠︎ offline");
    note.font = Font.systemFont(9);
    note.textColor = new Color("f0a35e");
    note.lineLimit = 2;
  }
  return widget;
}

async function main() {
  const apiKey = await getApiKey();
  const state = await loadState(apiKey);
  const family = config.widgetFamily || "small";
  const widget = buildWidget(state, family);

  if (config.runningInWidget) {
    Script.setWidget(widget);
  } else {
    await widget.presentSmall();
  }
  Script.complete();
  return { state, family };
}

await main();
