var e = require("fire-fs");
var ipcListener = require("../editor-framework/lib/share/ipc-listener");
require("electron").ipcMain;
const t = (require("fire-path"), require("async"));
let o = (e) => {
  if (process.send) {
    process.send({
      channel: "editor-error",
      message: e.message,
      stack: e.stack,
    });
  }
};
function r() {
  Editor.Window.main.nativeWin.webContents.send("reload-page");
}
process.on("uncaughtException", o);

Editor.App.extend({
  runDashboard() {
    Editor.Window.main.close();
  },
  run() {
    if (
      typeof Editor._buildCommand != "string" &&
      typeof Editor._compileCommand != "string"
    ) {
      Editor.Window.main &&
        (Editor.Window.main.nativeWin.webContents.on(
          "devtools-reload-page",
          () => {
            Editor.Window.main.nativeWin.webContents.once(
              "did-finish-load",
              () => {
                Editor.Window.main.nativeWin.webContents.send("reload-page");
              }
            );
          }
        ),
        Editor.Window.main.nativeWin.webContents.send("load-editor")),
        Editor.Metrics.setClientId(() => {
          Editor.Metrics.prepareUserIdentity();
          Editor.Metrics.sendAppInfo();

          Editor.Metrics.trackEvent({
            category: "Editor",
            action: "Editor Open",
            label: "new metrics",
          });
        }),
        process.removeListener("uncaughtException", o);
    }
  },
  quit(e) {
    let t = String(
      ((Date.now() - Editor.CocosAnalytics.openTime) / 1000) /* 1e3 */ | 0
    );

    Editor.CocosAnalytics.trackCocosEvent("CreatorLogout", {
      projectId: Editor.Project.id,
      onlineDuration: t,
    });

    Editor.CocosAnalytics.trackEvent({
      category: "logout",
      exitTag: "successed",
      onlineDuration: t,
    });

    Editor.Metrics.trackEvent(
      { category: "Editor", action: "Editor Close", label: "new metrics" },
      e
    );

    setTimeout(() => {
      console.log("quit due to request timeout");
      e();
    }, 2000 /* 2e3 */);
  },
  spawnWorker(e, t, i, o, r) {
    const n = "unpack://static/general-worker.html";
    let a;
    let s = false;

    if (typeof t == "function") {
      (r = o), (o = i), (i = t), (t = {});
    }

    t.scriptUrl = e;

    (function e() {
      if (a) {
        clearTimeout(a), (a = null);
      }

      const d = new Editor.Window("worker", { show: !!o, save: false });

      a = setTimeout(() => {
        a = null;

        if (!s) {
          Editor.log("Load worker timeout, reload worker."), d.close(), e();
        }
      }, 10000 /* 1e4 */);

      s = false;

      if (r) {
        d.nativeWin.webContents.on("crashed", (e) => {
          Editor.log("Worker window crashed, reload to restart worker");
          d.load(n, t);
        });
      }

      if (o) {
        d.openDevTools();
      }

      if (i) {
        d.nativeWin.webContents.on("did-finish-load", () => {
          s = true;
          i(d, d.nativeWin);
        });
      }

      d.load(n, t);
    })();
  },
  loadPackage(o, r) {
    if (o.gizmos) {
      for (let e in o.gizmos) {
        if (Editor.gizmos[e]) {
          Editor.warn(
            `Override gizmos [${e}] from [${Editor.gizmos[e]}] to [${o.gizmos[e]}]`
          );
        }

        let t = o.gizmos[e];

        if (t.startsWith("packages://")) {
          Editor.gizmos[e] = t;
        } else {
          Editor.gizmos[e] = `packages://${o.name}/${t}`;
        }
      }
    }

    if (o["scene-script"]) {
      (Editor.sceneScripts[
        o.name
      ] = `packages://${o.name}/${o["scene-script"]}`),
        Editor.Ipc.sendToPanel(
          "scene",
          "scene:load-package-scene-script",
          o.name,
          Editor.sceneScripts[o.name]
        );
    }

    if (o["build-template"]) {
      Editor.Builder.buildTemplates[
        o.name
      ] = `packages://${o.name}/${o["build-template"]}`;
    }

    let {
      "simple-build-target": simpleBuildTarget,
      "runtime-resource": runtimeResource,
    } = o;

    if (simpleBuildTarget) {
      let e = Editor.require(`packages://${o.name}/${simpleBuildTarget}`);
      e.package = o.name;
      Editor.Builder.simpleBuildTargets[e.platform] = e;

      if (e.messages) {
        let t = (e, t) => (!t.includes(":") ? `${e}:${t}` : t);

        let ipc = new ipcListener();
        for (let i in e.messages) {
          let r = e.messages[i];

          if (typeof r == "function") {
            ipc.on(t(e.package, i), r.bind(e));
          }
        }
        e._ipc = ipc;
      }
    }
    if (o.inspector) {
      for (let e in o.inspector) {
        Editor.inspectors[e] = `packages://${o.name}/${o.inspector[e]}`;
      }
    }
    let s = "";
    let d = false;
    let c = "";
    t.waterfall(
      [
        (t) => {
          if (!runtimeResource) {
            t();
            return undefined;
          }
          s = Editor.url(`packages://${o.name}/${runtimeResource.path}`);

          if (!e.existsSync(s) || !e.isDirSync(s)) {
            Editor.warn(
              `Mount runtime resource failed, ${s} is not a valid folder.`
            ),
              (s = "");
          }

          t();
        },
        (e) => {
          if (!s) {
            e();
            return undefined;
          }
          c = `${o.name}-${runtimeResource.name}`;

          Editor.assetdb.mount(s, c, { readonly: true }, (t) => {
            if (t) {
              Editor.warn(`Mount runtime resource failed. message: ${t.stack}`);
            } else {
              d = true;
            }

            e();
          });
        },
        (e) => {
          if (!d || !Editor.assetdbInited) {
            e();
            return undefined;
          }
          Editor.assetdb.attachMountPath(c, (t) => {
            if (t) {
              Editor.warn(`Attach mount path ${c} failed. message: ${t.stack}`);
            }

            e();
          });
        },
      ],
      (e) => {
        r();
      }
    );
  },
  unloadPackage(e, i) {
    if (e.gizmos) {
      for (let t in e.gizmos) {
        delete Editor.gizmos[t];
      }
    }

    if (e["scene-script"]) {
      Editor.Ipc.sendToPanel(
        "scene",
        "scene:unload-package-scene-script",
        e.name
      ),
        delete Editor.sceneScripts[e.name];
    }

    if (e["build-template"]) {
      delete Editor.Builder.buildTemplates[e.name];
    }

    const {
      "simple-build-target": simpleBuildTarget,
      "runtime-resource": runtimeResource,
    } = e;

    if (simpleBuildTarget) {
      let t = Editor.require(`packages://${e.name}/${simpleBuildTarget}`);
      delete Editor.Builder.simpleBuildTargets[t.platform];

      if (t._ipc) {
        t._ipc.clear();
      }
    }
    if (e.inspector) {
      for (let t in e.inspector) {
        delete Editor.inspectors[t];
      }
    }
    if (!runtimeResource) {
      if (i) {
        i();
      }

      return undefined;
    }
    const n = `${e.name}-${runtimeResource.name}`;
    t.waterfall(
      [
        (e) => {
          Editor.assetdb.unattachMountPath(n, (t) => {
            if (t) {
              Editor.warn(
                `Unattach mount path ${n} failed. message: ${t.stack}`
              );
            }

            e(t);
          });
        },
        (t) => {
          Editor.assetdb.unmount(n, (i) => {
            if (i) {
              Editor.warn(
                `Unmount runtime resource of package ${e.name} failed. message : ${i.stack}`
              );
            }

            t();
          });
        },
      ],
      (e) => {
        if (i) {
          i();
        }
      }
    );
  },
});

Editor.App.on("focus", () => {
  if (Editor.argv._command !== "test" && Editor.assetdbInited) {
    Editor.assetdb.watchOFF();
  }
});

Editor.App.on("blur", () => {
  if (Editor.argv._command !== "test" && Editor.assetdbInited) {
    Editor.assetdb.watchON();
  }
});

Editor.App.on("quit", () => {
  Editor.PreviewServer.stop();
  Editor.NativeUtils.stop();

  if (process.send) {
    process.send({ channel: "show-dashboard" });
  }
});

Editor.App.on("gpu-process-crashed", () => {
  Editor.warn(Editor.T("EDITOR_MAIN.gpu_crash_warning"));
  let e = Editor.Window.main.nativeWin;

  if (e) {
    e.webContents.off("did-finish-load", r),
      e.webContents.once("did-finish-load", r),
      e.reload();
  }
});
