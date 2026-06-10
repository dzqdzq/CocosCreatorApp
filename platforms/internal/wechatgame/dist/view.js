var __awaiter =
  (this && this.__awaiter) ||
  ((e, r, s, c) =>
    new (s = s || Promise)((o, t) => {
      function n(e) {
        try {
          a(c.next(e));
        } catch (e) {
          t(e);
        }
      }
      function i(e) {
        try {
          a(c.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function a(e) {
        var t;

        if (e.done) {
          o(e.value);
        } else {
          ((t = e.value) instanceof s
            ? t
            : new s((e) => {
                e(t);
              })
          ).then(n, i);
        }
      }
      a((c = c.apply(e, r || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.ready = undefined;
exports.update = undefined;
exports.$ = undefined;
exports.data = undefined;
exports.template = undefined;
exports.style = undefined;
exports.buttonConfig = undefined;

const child_process_1 = require("child_process");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const iconv = require("iconv-lite");
const PKG_NAME = "wechatgame";
let panel;

exports.buttonConfig = {
  configs: {
    run: {
      label: "i18n:wechatgame.run.label",
      click(e, i) {
        return __awaiter(this, undefined, undefined, function* () {
          i.buildPath = Editor.UI.File.resolveToRaw(i.buildPath);
          var e = path_1.join(i.buildPath, i.outputName);

          var t = e.match(
            /([`~!#$%^&*+=<>?"{}|,;'·~！#￥%……&*（）+={}|《》？：“”【】、；‘'，。、])/im
          );

          if (t) {
            console.warn(
              Editor.I18n.t("wechatgame.tips.build_path_contains_symbol", {
                symbol: t[1],
              })
            );
          }

          let o = yield Editor.Profile.getConfig("program", "wechat_devtools");
          if (!o || !fs_extra_1.existsSync(o)) {
            console.warn(
              "" +
                Editor.I18n.t("wechatgame.tips.wechatgame_app_path_empty", {
                  wechatgamePath: o,
                })
            );

            if (
              (yield Editor.Dialog.warn(
                Editor.I18n.t("wechatgame.tips.wechatgame_app_path_empty"),
                { buttons: ["Cancel", "Set Wechat DevTools"] }
              )).response === 1
            ) {
              Editor.Message.send("preferences", "open-settings", "program");
            }

            return false;
          }

          if (
            !fs_extra_1.statSync(o).isDirectory() &&
            process.platform === "win32"
          ) {
            o = path_1.dirname(o);
          }

          let n;

          if (process.platform === "darwin") {
            n = path_1.join(o, "Contents/Resources/app.nw/bin/cli");

            fs_extra_1.existsSync(n) ||
              (n = path_1.join(o, "Contents/MacOS/cli"));
          } else {
            n = path_1.join(o, "cli.bat");
          }

          return fs_extra_1.existsSync(n)
            ? ((t = ["-o", e, "-f", "cocos"]),
              console.log("Run command : " + t.join(" ")),
              (e = child_process_1.spawn(n, t)) &&
                e.stdout &&
                e.stdout.on("data", (e) => {
                  console.log("" + iconv.decode(e, "utf8").toString());
                }),
              e &&
                e.stderr &&
                e.stderr.on("data", (e) => {
                  console.error("" + iconv.decode(e, "utf8").toString());
                }),
              true)
            : (yield Editor.Dialog.error(
                Editor.I18n.t("builder.wechat_game.client_path_error")
              ),
              false);
        });
      },
    },
  },
};

exports.style = `
.warning-tip {
    color: var(--color-warn-fill);
    font-size： 11px;
    line-height: 16px;
    margin-bottom: 2px;
}

.jump {
    cursor: pointer;
    text-decoration: underline;
}

.jump:hover {
    color: var(--color-focus-fill-weakest)
}
`;

exports.template = fs_extra_1.readFileSync(
  path_1.join(__dirname, "../static/view.html"),
  "utf8"
);

const component = {
  data() {
    return { pkgOptions: {}, includeModules: [] };
  },
  computed: {
    physics3D() {
      return !!this.includeModules.filter(
        (e) => e.startsWith("physics-") && !e.startsWith("physics-2d")
      ).length;
    },
  },
  methods: {
    t(e) {
      return Editor.I18n.t("wechatgame.options." + e);
    },
    init() {
      return __awaiter(this, undefined, undefined, function* () {
        this.pkgOptions = panel.options.packages.wechatgame;
        yield this.updateEngineModules();
      });
    },
    onConfirm(e, t) {
      e = e.target.value;
      this.pkgOptions[t] = e;
      panel.dispatch("update", `packages.${PKG_NAME}.` + t, e, null);
    },
    openProjectSettings() {
      Editor.Message.send("project", "open-settings", "engine", "modules");
    },
    updateEngineModules() {
      return __awaiter(this, undefined, undefined, function* () {
        this.includeModules = yield Editor.Profile.getProject(
          "engine",
          "modules.includeModules"
        );
      });
    },
  },
  mounted() {
    this.init();

    Editor.Message.addBroadcastListener(
      "engine:engine-modules-config-changed",
      this.updateEngineModules
    );
  },
  beforeDestroy() {
    Editor.Message.removeBroadcastListener(
      "engine:engine-modules-config-changed",
      this.updateEngineModules
    );
  },
};
async function update(e, t) {
  panel = this;

  if (!t || t.startsWith("packages." + panel.pkgName)) {
    panel.options = e;
    panel.vm.init();
  }
}
function ready(e) {
  panel = this;
  var t = require("vue/dist/vue.js");
  panel.options = e;
  panel.vm = new t(Object.assign({ el: panel.$.root }, component));
}
exports.data = { vm: null, options: {} };
exports.$ = { root: ".wechatgame" };
exports.update = update;
exports.ready = ready;
