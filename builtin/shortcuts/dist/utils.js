Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEventKey = handleEventKey;
exports.handleOptionsToShortcut = handleOptionsToShortcut;
exports.sortShortcutMap = sortShortcutMap;
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
function handleOptionsToShortcut(e) {
  var t;
  var e = process.platform === "win32" ? e.win : e.mac;
  return e && typeof e == "string"
    ? (-1 !== (t = (e = e.toLowerCase().split("+")).indexOf("cmd")) &&
        (e.splice(t, 1), e.splice(0, 0, "cmd")),
      -1 !== (t = e.findIndex((e) => ["opt", "option", "⌥"].includes(e))) &&
        (e.splice(t, 1), e.splice(0, 0, "alt")),
      -1 !== (t = e.indexOf("alt")) && (e.splice(t, 1), e.splice(0, 0, "alt")),
      -1 !== (t = e.indexOf("ctrl")) &&
        (e.splice(t, 1), e.splice(0, 0, "ctrl")),
      -1 !== (t = e.indexOf("shift")) &&
        (e.splice(t, 1), e.splice(0, 0, "shift")),
      e.join("+"))
    : "";
}
function sortShortcutMap(t) {
  const r = {};
  const s = Object.keys(t).reduce((e, t) => {
    var r = t.charAt(0);

    if (!e[r]) {
      e[r] = [];
    }

    e[r].push(t);
    return e;
  }, {});

  Object.keys(s)
    .sort()
    .forEach((e) => {
      s[e].sort((e, t) => e.length - t.length);

      s[e].forEach((e) => {
        r[e] = t[e];
      });
    });

  return r;
}
