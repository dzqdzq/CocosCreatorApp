var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.startup = startup;
const webview_1 = __importDefault(require("./webview"));
const queue = [];
let lock = true;
const outTime = 180000; /* 18e4 */
const webview_1_default = webview_1.default;
function startup() {
  lock = false;
  step();
  Editor.Metrics.trackTimeEnd("scene:scene-view-startup", { output: true });
}
async function step(e = false) {
  if (!(lock = !e && lock)) {
    const r = queue.shift();
    if (r) {
      const r_options = r.options;
      e = cce[r_options.module];
      if (!e) {
        throw new Error(
          `Module [${r_options.module}] does not exist.(Method: ${r_options.handler})`
        );
      }
      if (!e[r_options.handler]) {
        throw new Error(
          `Method [${r_options.handler}] does not exist.(Module: ${r_options.module})`
        );
      }
      lock = true;
      try {
        var t = e[r_options.handler](...r_options.params);
        if (t instanceof Promise) {
          let o;
          Promise.race([
            t,
            new Promise((e, t) => {
              o = setTimeout(async () => {
                console.debug(
                  "Scene Not Response",
                  r_options.module + "." + r_options.handler
                );

                queue.forEach((e) => {
                  console.debug(
                    "ipc queue",
                    e.options.module,
                    e.options.handler
                  );
                });

                await Editor.Dialog.warn(
                  Editor.I18n.t("scene.messages.warning"),
                  {
                    detail: Editor.I18n.t("scene.messages.not_response"),
                    buttons: [Editor.I18n.t("scene.messages.confirm")],
                  }
                );

                t(
                  new Error(
                    `${r_options.module}.${r_options.handler} timeout.
` + JSON.stringify(r_options.params)
                  )
                );
              }, outTime);
            }),
          ])
            .then((e) => {
              r.resolve(e);
            })
            .catch((e) => {
              r.reject(e);
            })
            .finally(() => {
              if (o) {
                clearTimeout(o);
              }

              step(true);
            });
        } else {
          r.resolve(t);
          step(true);
        }
      } catch (e) {
        r.reject(e);
        step(true);
      }
    }
  }
}
webview_1_default.startup = startup;

webview_1_default.clearQueue = () => {
  queue.length = 0;
};

webview_1_default.on("call-method", (s) => {
  if (s.queue) {
    return new Promise((e, t) => {
      queue.push({ options: s, resolve: e, reject: t });
      step();
    });
  }
  {
    var e = cce[s.module];
    if (!e) {
      throw new Error(
        `Module [${s.module}] does not exist.(Method: ${s.handler})`
      );
    }
    if (!e[s.handler]) {
      throw new Error(
        `Method [${s.handler}] does not exist.(Module: ${s.module})`
      );
    }
    const n = e[s.handler](...s.params);
    return new Promise((t, o) => {
      if (n instanceof Promise) {
        if (s.timeout) {
          const r = setTimeout(() => {
            o(
              new Error(
                `${s.module}.${s.handler} timeout.
` + JSON.stringify(s.params)
              )
            );
          }, 30000 /* 3e4 */);
          n.then((e) => {
            clearTimeout(r);
            t(e);
          }).catch((e) => {
            clearTimeout(r);
            o(e);
          });
        } else {
          n.then((e) => {
            t(e);
          }).catch((e) => {
            o(e);
          });
        }
      } else {
        t(n);
      }
    });
  }
});

exports.default = webview_1_default;
