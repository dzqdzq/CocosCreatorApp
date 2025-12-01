"use strict";
(async () => {
  try {
    require("./lib/share/require");
    require("./lib/share/polyfills");
    const e = require("electron");
    const t = require("fire-path");
    let r;
    let o = false;

    window.onerror = function (e, t, o, a, n) {
      if (r && r.Ipc.sendToMain) {
        r.Ipc.sendToMain("editor:renderer-console-error", n.stack || n);
      } else {
        console.error(n.stack || n);
      }

      return false;
    };

    window.addEventListener("dragstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener("dragover", (e) => {
      e.dataTransfer.dropEffect = "none";
      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener("copy", (e) => {
      if (e.target !== document.body) {
        return;
      }
      let t = r.UI.focusedPanelFrame;

      if (t) {
        e.preventDefault();
        e.stopPropagation();

        r.UI.fire(t, "panel-copy", {
          bubbles: false,
          detail: { clipboardData: e.clipboardData },
        });
      }
    });

    window.addEventListener("cut", (e) => {
      if (e.target !== document.body) {
        return;
      }
      let t = r.UI.focusedPanelFrame;

      if (t) {
        e.preventDefault();
        e.stopPropagation();

        r.UI.fire(t, "panel-cut", {
          bubbles: false,
          detail: { clipboardData: e.clipboardData },
        });
      }
    });

    window.addEventListener("paste", (e) => {
      if (e.target !== document.body) {
        return;
      }
      let t = r.UI.focusedPanelFrame;

      if (t) {
        e.preventDefault();
        e.stopPropagation();

        r.UI.fire(t, "panel-paste", {
          bubbles: false,
          detail: { clipboardData: e.clipboardData },
        });
      }
    });

    window.addEventListener("beforeunload", (e) => {
      let t = require("electron").remote.getCurrentWindow();

      if (t) {
        t = Editor.remote.Window.find(t);
      }

      if (!o) {
        e.returnValue = true;

        (async () => {
          let e = r.Panel.panels;
          let a = false;
          for (let t = 0; t < e.length; t++) {
            let r = true;
            let o = e[t];

            if (!a && o.canClose) {
              r = await o.canClose();
            }

            if ((false === r)) {
              a = true;
              break;
            }
          }

          if (a) {
            t.closing = false;
          } else {
            e.forEach((e) => {
                  if (e.close) {
                    try {
                      e.close();
                    } catch (e) {}
                  }
                });

            o = true;

            if (t) {
              setImmediate(() => {
                if (t.closing) {
                  t.nativeWin.close();
                } else {
                  t.nativeWin.reload();
                }
              });
            }
          }
        })();
      }
    });

    if (e.webFrame.setVisualZoomLevelLimits) {
      e.webFrame.setVisualZoomLevelLimits(1, 1);
    } else {
      e.webFrame.setZoomLevelLimits(1, 1);
    }

    let a = e.remote.getGlobal("Editor");
    let n = a.url("app://");
    let i = a.url("editor-framework://");
    require("module").globalPaths.push(t.join(n, "node_modules"));
    (r = require(`${i}/lib/renderer`)).remote = a;
    if (window.location.hash) {
      let e = window.location.hash.slice(1);
      r.argv = Object.freeze(JSON.parse(decodeURIComponent(e)));
    } else {
      r.argv = {};
    }
    r.dev = a.dev;
    r.lang = a.lang;
    r.appPath = n;
    r.frameworkPath = i;
    r.Ipc.debug = a.dev;
    r.Protocol.init(r);
  } catch (e) {
    window.onload = function () {
      let t = require("electron").remote.getCurrentWindow();
      t.setSize(800, 600);
      t.center();
      t.show();
      t.openDevTools();
      console.error(e.stack || e);
    };
  }
})();
