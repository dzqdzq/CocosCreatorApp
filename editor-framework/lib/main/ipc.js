"use strict";
let e = {};
module.exports = e;
const n = require("electron");
const t = require("../share/ipc");
const i = require("./window");
const l = require("./package");
const o = require("./panel");
const r = require("./console");
let s = 1e3;
let p = {};
let a = false;
let d = t._checkReplyArgs;
let u = t._popOptions;
let c = t._popReplyAndTimeout;
let f = t._wrapError;
let y = t._unwrapError;
let m = t.ErrorTimeout;
let w = t.ErrorNoPanel;
let g = t.ErrorInterrupt;
function T(e, n, t, i, l) {
  let o;
  let r = `${n}:${s++}`;

  if (-1 !== i) {
    o = setTimeout(() => {
      let n = p[r];

      if (n) {
        if (n.win) {
          n.win._closeSession(r);
        }

        delete p[r];
        n.callback(new m(e, r, i));
      }
    }, i);
  }

  p[r] = { sessionId: r, timeoutId: o, win: l, callback: t };
  return r;
}
function v(e) {
  let n = p[e];

  if (n) {
    delete p[e];

    if (n.win) {
      n.win._closeSession(e);
    }

    if (n.timeoutId) {
      clearTimeout(n.timeoutId);
    }
  }

  return n;
}
function h(e, ...n) {
  n = [e, ...n];
  let t = i.windows.slice();
  for (let e = 0; e < t.length; ++e) {
    let i = t[e];

    if (i.nativeWin) {
      i._send.apply(i, n);
    }
  }
}
function I(e, ...n) {
  let t = i.windows.slice();
  for (let i = 0; i < t.length; ++i) {
    let l = t[i];

    if (l.nativeWin && l.nativeWin.webContents !== e) {
      l._send.apply(l, n);
    }
  }
}
function _(e, ...n) {
  if (0 === n.length) {
    h(e);
    return;
  }
  h.apply(null, [e, ...n]);
}
function b(n, ...t) {
  let i = { senderType: "main", sender: { send: e.sendToMain } };
  return 0 === t.length
    ? k.emit(n, i)
    : ((t = [n, i, ...t]), k.emit.apply(k, t));
}
e.option = t.option;

e.sendToAll = function (e, ...n) {
  if (n.length) {
    let t = false;
    let i = u(n);

    if (i && i.excludeSelf) {
      t = true;
    }

    n = [e, ...n];

    if (!t) {
      b.apply(null, n);
    }

    h.apply(null, n);
    return;
  }
  b(e);
  h(e);
};

e.sendToWins = h;

e.sendToMain = function (n, ...t) {
  if ("string" != typeof n) {
    r.error("Call to `sendToMain` failed. The message must be a string.");
    return;
  }
  let i = c(t, a);
  if (!i) {
    t = [n, ...t];

    if (false === b.apply(null, t)) {
      r.failed(`sendToMain "${n}" failed, no response received.`);
    }

    return;
  }
  let l = T(n, "main", i.reply, i.timeout);

  t = [
    n,
    ...t,
    e.option({ sessionId: l, waitForReply: true, timeout: i.timeout }),
  ];

  if (false ===
    function (n, ...t) {
      let i = { senderType: "main", sender: { send: e.sendToMain } };
      if (0 === t.length) {
        return k.emit(n, i);
      }
      let l = u(t);
      if (l && l.waitForReply) {
        let t = n;
        i.reply = function (...n) {
          if (false === f(n)) {
            console.warn(
              `Invalid argument for event.reply of "${t}": the first argument must be an instance of Error or null`
            );
          }

          let o = e.option({ sessionId: l.sessionId });
          n = ["editor:ipc-reply", i, ...n, o];
          return k.emit.apply(k, n);
        };
      }
      t = [n, i, ...t];
      return k.emit.apply(k, t);
    }.apply(null, t)) {
    r.failed(`sendToMain "${n}" failed, no response received.`);
  }

  return l;
};

e.sendToPanel = function (n, t, ...i) {
    let r = o.findWindow(n);
    if (!r) {
      let l = e._popReplyAndTimeout(i, a);

      if (l) {
        l.reply(new w(n, t));
      }

      return;
    }
    let s = l.panelInfo(n);
    if (s) {
      return "simple" === s.type
        ? (r.send.apply(r, [t, ...i]), void 0)
        : r._sendToPanel.apply(r, [n, t, ...i]);
    }
  };

e.sendToMainWin = function (e, ...n) {
    let t = i.main;
    if (!t) {
      console.error(
        `Failed to send "${e}" to main window, the main window is not found.`
      );

      return;
    }
    t._send.apply(t, [e, ...n]);
  };

e.cancelRequest = function (e) {
    v(e);
  };

Object.defineProperty(e, "debug", {
  enumerable: true,
  get: () => a,
  set(e) {
    a = e;
  },
});

e._closeAllSessions = function () {
    let e = Object.keys(p);
    for (let n = 0; n < e.length; ++n) {
      let t = e[n];
      let i = v(t);

      if (i.callback) {
        i.callback(new g(t));
      }
    }
  };

e._popReplyAndTimeout = c;
e._newSession = T;
e._closeSession = v;

e._closeSessionThroughWin = function (e) {
  let n = p[e];

  if (n) {
    delete p[e];

    if (n.timeoutId) {
      clearTimeout(n.timeoutId);
    }
  }
};

const k = n.ipcMain;

k.on("editor:ipc-renderer2all", (e, n, ...t) => {
  let i = u(t);

  (function (e, n, ...t) {
    return 0 === t.length
      ? k.emit(n, e)
      : ((t = [n, e, ...t]), k.emit.apply(k, t));
  }).apply(null, [e, n, ...t]);

  if (i && i.excludeSelf) {
    I.apply(null, [e.sender, n, ...t]);
  } else {
    _.apply(null, [n, ...t]);
  }
});

k.on("editor:ipc-reset-event-reply", (e, n, ...t) => {
  e.reply = null;
  k.emit(n, e, ...t);
});

k.on("editor:ipc-renderer2wins", function (e, n, ...t) {
  let i = u(t);
  if (i && i.excludeSelf) {
    I.apply(null, [e.sender, n, ...t]);
    return;
  }
  _.apply(null, [n, ...t]);
});

k.on("editor:ipc-renderer2main", (n, t, ...l) => {
  if (false ===
    function (n, t, ...l) {
      if (0 === l.length) {
        return k.emit(t, n);
      }
      let o = u(l);
      if (o && o.waitForReply) {
        let l = n.sender;
        let s = t;
        let p = i.find(l);

        n.reply = function (...n) {
          if (!p.nativeWin) {
            return;
          }

          if (a &&
            !d(n)) {
            r.warn(
              `Invalid argument for event.reply of "${s}": the first argument must be an instance of "Error" or "null"`
            );
          }

          let t = e.option({ sessionId: o.sessionId });
          n = ["editor:ipc-reply", ...n, t];
          return l.send.apply(l, n);
        };
      }
      l = [t, n, ...l];
      return k.emit.apply(k, l);
    }.apply(null, [n, t, ...l])) {
    r.failed(
      `Message "${t}" from renderer to main failed, no response receieved.`
    );
  }
});

k.on("editor:ipc-renderer2panel", (n, t, l, ...o) => {
  (function (n, t, l, ...o) {
    if (0 === o.length) {
      e.sendToPanel.apply(null, [t, l, ...o]);
      return;
    }
    let r = u(o);
    if (r && r.waitForReply) {
      let s = n.sender;
      let p = i.find(s);

      let a = T(
        l,
        `${t}@main`,
        function (...n) {
          if (!p.nativeWin) {
            return;
          }
          let t = e.option({ sessionId: r.sessionId });
          n = ["editor:ipc-reply", ...n, t];
          return s.send.apply(s, n);
        },
        r.timeout
      );

      o = [
        t,
        l,
        ...o,
        e.option({ sessionId: a, waitForReply: true, timeout: r.timeout }),
      ];
    } else {
      o = [t, l, ...o];
    }
    e.sendToPanel.apply(null, o);
  })(n, t, l, ...o);
});

k.on("editor:ipc-renderer2mainwin", (e, n, ...t) => {
  let l = i.main;
  if (!l) {
    console.error(
      `Failed to send "${n}" because the main page is not initialized.`
    );

    return;
  }

  if (t.length) {
    l._send.apply(l, [n, ...t]);
  } else {
    l._send(n);
  }
});

k.on("editor:ipc-reply", (e, ...n) => {
  let t = u(n);
  let i = y(n);
  if (i) {
    let e = i.stack.split("\n");
    e.shift();
    let t = new Error(i.message);
    t.stack += "\n\t--------------------\n" + e.join("\n");
    t.code = i.code;
    t.code = i.code;
    t.errno = i.errno;
    t.syscall = i.syscall;
    n[0] = t;
  }
  let l = v(t.sessionId);

  if (l) {
    l.callback.apply(null, n);
  }
});
