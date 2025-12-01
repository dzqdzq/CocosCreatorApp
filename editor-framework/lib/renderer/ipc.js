"use strict";
let e = {};
module.exports = e;
const r = require("electron");
const n = require("../share/ipc");
const t = require("./console");
const i = require("./panel");
const o = r.ipcRenderer;
const s = r.remote.getCurrentWindow().id;
let l = 1e3;
let a = {};
let d = false;
let p = n._checkReplyArgs;
let u = n._popOptions;
let c = n._popReplyAndTimeout;
let f = n._wrapError;
let m = n._unwrapError;
let y = n.ErrorTimeout;
let g = n.ErrorInterrupt;
function T(e, r, n, t) {
  let i;
  let o = `${r}:${l++}`;

  if (-1 !== t) {
    i = setTimeout(() => {
      let r = a[o];

      if (r) {
        delete a[o];
        r.callback(new y(e, o, t));
      }
    }, t);
  }

  a[o] = { sessionId: o, timeoutId: i, callback: n };
  return o;
}
function b(e) {
  let r = a[e];

  if (r) {
    delete a[r.sessionId];

    if (r.timeoutId) {
      clearTimeout(r.timeoutId);
    }
  }

  return r;
}
e.option = n.option;

e.sendToAll = function (e, ...r) {
    if ("string" != typeof e) {
      t.error("Call to `sendToAll` failed. The message must be a string.");
      return;
    }
    o.send.apply(o, ["editor:ipc-renderer2all", e, ...r]);
  };

e.sendToWins = function (e, ...r) {
    if ("string" != typeof e) {
      t.error("Call to `sendToWins` failed. The message must be a string.");
      return;
    }
    o.send.apply(o, ["editor:ipc-renderer2wins", e, ...r]);
  };

e.sendToMainSync = function (e, ...r) {
    return "string" != typeof e
      ? (t.error(
          "Call to `sendToMainSync` failed. The message must be a string."
        ),
        void 0)
      : o.sendSync.apply(o, [e, ...r]);
  };

e.sendToMain = function (r, ...n) {
  if ("string" != typeof r) {
    t.error("Call to `sendToMain` failed. The message must be a string.");
    return;
  }
  let i;
  let l = c(n, d);

  if (l) {
    i = T(r, `${s}@renderer`, l.reply, l.timeout);

    n = [
          "editor:ipc-renderer2main",
          r,
          ...n,
          e.option({ sessionId: i, waitForReply: true, timeout: l.timeout }),
        ];
  } else {
    n = ["editor:ipc-reset-event-reply", r, ...n];
  }

  o.send.apply(o, n);
  return i;
};

e.sendToPackage = function (r, n, ...t) {
    return e.sendToMain.apply(null, [`${r}:${n}`, ...t]);
  };

e.sendToPanel = function (r, n, ...i) {
  if ("string" != typeof n) {
    t.error(
      "Call to `sendToPanel` failed. The sent message must be a string."
    );

    return;
  }
  let s;
  let l = c(i, d);

  if (l) {
    s = T(n, `${r}@renderer`, l.reply, l.timeout);

    i = [
          "editor:ipc-renderer2panel",
          r,
          n,
          ...i,
          e.option({ sessionId: s, waitForReply: true, timeout: l.timeout }),
        ];
  } else {
    i = ["editor:ipc-renderer2panel", r, n, ...i];
  }

  o.send.apply(o, i);
  return s;
};

e.sendToMainWin = function (e, ...r) {
    if ("string" != typeof e) {
      t.error(
        "Call to `sendToMainWin` failed. The message must be a string."
      );

      return;
    }
    o.send.apply(o, ["editor:ipc-renderer2mainwin", e, ...r]);
  };

e.cancelRequest = function (e) {
    b(e);
  };

Object.defineProperty(e, "debug", {
  enumerable: true,
  get: () => d,
  set(e) {
    d = e;
  },
});

e._closeAllSessions = function () {
    let e = Object.keys(a);
    for (let r = 0; r < e.length; ++r) {
      let n = e[r];
      let t = b(n);

      if (t.callback) {
        t.callback(new g(n));
      }
    }
  };

o.on("editor:ipc-main2panel", (r, n, o, ...s) => {
  let l = u(s);
  if (l && l.waitForReply) {
    let n = r.sender;
    let i = o;

    r.reply = function (...r) {
      if (d &&
        !p(r)) {
        t.warn(
          `Invalid argument for event.reply of "${i}": the first argument must be an instance of Error or null`
        );
      }

      let o = e.option({ sessionId: l.sessionId });
      r = ["editor:ipc-reply", ...r, o];
      return n.send.apply(n, r);
    };
  }
  s = [n, o, r, ...s];
  i._dispatch.apply(i, s);
});

o.on("editor:ipc-main2renderer", (r, n, ...i) => {
  if (false ===
    function (r, n, ...i) {
      if (0 === i.length) {
        return o.emit(n, r);
      }
      let s = u(i);
      if (s && s.waitForReply) {
        let i = r.sender;
        let o = n;

        r.reply = function (...r) {
          if (false === f(r)) {
            t.warn(
              `Invalid argument for event.reply of "${o}": the first argument must be an instance of Error or null`
            );
          }

          let n = e.option({ sessionId: s.sessionId });
          r = ["editor:ipc-reply", ...r, n];
          return i.send.apply(i, r);
        };
      }
      i = [n, r, ...i];
      return o.emit.apply(o, i);
    }.apply(null, [r, n, ...i])) {
    t.failed(
      `Message "${n}" from main to renderer failed, no response was received.`
    );
  }
});

o.on("editor:ipc-reply", (e, ...r) => {
  let n = u(r);
  let t = m(r);
  if (t) {
    let e = t.stack.split("\n");
    e.shift();
    let n = new Error(t.message);
    n.stack += "\n\t--------------------\n" + e.join("\n");
    n.code = t.code;
    n.code = t.code;
    n.errno = t.errno;
    n.syscall = t.syscall;
    r[0] = n;
  }
  let i = b(n.sessionId);

  if (i) {
    i.callback.apply(null, r);
  }
});
