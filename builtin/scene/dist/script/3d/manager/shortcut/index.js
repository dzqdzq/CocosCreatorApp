var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shortcut = undefined;
exports.handleEventKey = handleEventKey;
const operation_1 = __importDefault(require("../operation"));
const EventEmitter_1 = __importDefault(require("../../../public/EventEmitter"));

const _KEYCODE_MAP = {
  106: "*",
  107: "+",
  109: "-",
  110: ".",
  111: "/",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'",
};

function handleEventKey(e) {
  var t =
    process.platform === "darwin" && e.altKey
      ? String.fromCharCode(e.keyCode)
      : e.key;
  let r = _KEYCODE_MAP[e.which] || t.toLowerCase();
  switch (r) {
    case "escape": {
      r = "esc";
      break;
    }
    case "arrowup": {
      r = "up";
      break;
    }
    case "arrowdown": {
      r = "down";
      break;
    }
    case "arrowleft": {
      r = "left";
      break;
    }
    case "arrowright": {
      r = "right";
      break;
    }
    case " ": {
      r = "space";
    }
  }
  t = [];

  if (e.shiftKey) {
    t.push("shift");
  }

  if (e.ctrlKey) {
    t.push("ctrl");
  }

  if (e.altKey) {
    t.push("alt");
  }

  if (e.metaKey) {
    t.push("cmd");
  }

  if (!/^(meta|control|ctrl|shift|alt)$/.test(r)) {
    t.push(r);
  }

  return t.join("+");
}
class Shortcut extends EventEmitter_1.default {
  shortcuts = {
    " ": "Space",
    backspace: "Backspace",
    tab: "Tab",
    capslock: "Capslock",
    escape: "Esc",
    enter: "Enter",
    pageup: "PageUp",
    pagedown: "PageDown",
    arrowup: "ArrowUp",
    arrowdown: "ArrowDown",
    arrowleft: "ArrowLeft",
    arrowright: "ArrowRight",
  };
  static wanderMap = {
    q: { raw: "q", order: 0, message: "down" },
    w: { raw: "w", order: 1, message: "zoom-in" },
    e: { raw: "e", order: 2, message: "up" },
    a: { raw: "a", order: 3, message: "left" },
    s: { raw: "s", order: 4, message: "zoom-out" },
    d: { raw: "d", order: 5, message: "right" },
  };
  static snapMap = {
    v: {
      raw: "v",
      order: 0,
      message: "vertex-snap",
      title: "scene.shortcut.vertexSnap",
    },
    "shift+ctrl": {
      raw: "shift+ctrl",
      order: 1,
      title: "scene.shortcut.surfaceSnap",
      message: "surface-snap",
    },
  };
  static find(e) {
    e = handleEventKey(e);
    return Shortcut.wanderMap[e] || Shortcut.snapMap[e] || null;
  }
  constructor() {
    super();
    operation_1.default.on("keydown", this.onKeyDown.bind(this));
  }
  async init() {
    await this.onShortcutsChange();
  }
  onKeyDown(t) {
    if (t) {
      let e = "";

      if (t.ctrlKey) {
        e += "ctrl+";
      }

      if (t.altKey) {
        e += "alt+";
      }

      if (t.shiftKey) {
        e += "shift+";
      }

      e += t.key.toLowerCase();
      t = this.shortcuts[e] || "";

      if (t) {
        this.emit(t);
      }
    }
  }
  async onShortcutsChange() {
    var e = (
      await Editor.Message.request("shortcuts", "query-packages-shortcut-list")
    ).scene;

    if (e) {
      this.updateShortcutMap(e, Shortcut.wanderMap);
      this.updateShortcutMap(e, Shortcut.snapMap);
    }
  }
  updateShortcutMap(t, a) {
    let s = false;

    Object.keys(t).forEach((e) => {
      const r = t[e];
      Object.keys(a).forEach((e) => {
        var t = a[e].raw;

        if (t === r.rawShortcut || t === r.shortcut) {
          s = true;
          a[r.shortcut] = a[e];
          r.shortcut !== e && delete a[e];
        }
      });
    });

    return s;
  }
}
exports.Shortcut = Shortcut;
exports.default = new Shortcut();
