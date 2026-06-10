var __awaiter =
  (this && this.__awaiter) ||
  ((e, r, s, p) =>
    new (s = s || Promise)((i, t) => {
      function n(e) {
        try {
          a(p.next(e));
        } catch (e) {
          t(e);
        }
      }
      function o(e) {
        try {
          a(p.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function a(e) {
        var t;

        if (e.done) {
          i(e.value);
        } else {
          ((t = e.value) instanceof s
            ? t
            : new s((e) => {
                e(t);
              })
          ).then(n, o);
        }
      }
      a((p = p.apply(e, r || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.ready = undefined;
exports.update = undefined;
exports.$ = undefined;
exports.data = undefined;
exports.style = undefined;
exports.template = undefined;

const fs_extra_1 = require("fs-extra");
const util_1 = require("util");
const path_1 = require("path");
const child_process_1 = require("child_process");
const PKG_NAME = "bytedance-mini-game";
let panel;
async function run(n) {
  let t = await Editor.Profile.getConfig("program", "bytedance_app_path");
  if (t && fs_extra_1.existsSync(t)) {
    if (!fs_extra_1.statSync(t).isDirectory() && process.platform === "win32") {
      t = path_1.dirname(t);
    }

    var i;
    let e;

    e =
      process.platform === "darwin"
        ? path_1.join(t, "Contents/Resources/app.asar.unpacked/bytecli")
        : path_1.join(t, "resources/app.asar.unpacked/bytecli.bat");

    if (fs_extra_1.existsSync(e)) {
      n.buildPath = Editor.UI.File.resolveToRaw(n.buildPath);
      i = ["-o", path_1.join(n.buildPath, n.outputName)];
      console.log("Run command : " + i.join(" "));

      (i = child_process_1.spawn(e, i, {
        env: { bytedanceide: t, byte_dance_ide: t },
      })) &&
        i.stdout &&
        i.stdout.on("data", (e) => {
          console.log(e.toString());
        });

      i &&
        i.stderr &&
        i.stderr.on("data", (e) => {
          console.error(e.toString());
        });
    } else {
      await Editor.Dialog.error(
        Editor.I18n.t("bytedance-mini-game.tips.client_path_error")
      );
    }
  } else {
    console.warn(
      "" +
        util_1.format(
          Editor.I18n.t("bytedance-mini-game.tips.bytedance_app_path_empty"),
          t
        )
    );
    await Editor.Dialog.warn(
      Editor.I18n.t("bytedance-mini-game.tips.bytedance_app_path_empty")
    );
  }
  return false;
}

exports.template = fs_extra_1.readFileSync(
  path_1.join(__dirname, "../static/view.html"),
  "utf8"
);

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

const component = {
  data() {
    return { includeModules: [], pkgOptions: null };
  },
  computed: {
    physicsX() {
      var e = this;
      return (
        e.physics3D &&
        ((e.pkgOptions && e.pkgOptions.physX.use === "physX") ||
          e.includeModules.includes("physics-physx"))
      );
    },
    physics3D() {
      return !!this.includeModules.filter(
        (e) => e.startsWith("physics-") && !e.startsWith("physics-2d")
      ).length;
    },
    selectStyle() {
      return this.physics3D
        ? { display: "flex" }
        : { display: "flex", color: "var(--color-warn-fill)" };
    },
  },
  methods: {
    t(e) {
      return Editor.I18n.t("bytedance-mini-game.options." + e);
    },
    updateEngineModules() {
      return __awaiter(this, undefined, undefined, function* () {
        console.debug("engine-modules-config-changed");

        this.includeModules = yield Editor.Profile.getProject(
          "engine",
          "modules.includeModules"
        );
      });
    },
    init() {
      return __awaiter(this, undefined, undefined, function* () {
        this.pkgOptions = panel.options.packages["bytedance-mini-game"];
        yield this.updateEngineModules();
      });
    },
    onConfirm(e) {
      var t = e.target.value;
      var e = e.target.getAttribute("path");
      this.pkgOptions.physX[e] = t;
      panel.dispatch("update", `packages.${PKG_NAME}.physX.` + e, t, null);
    },
    openProjectSettings() {
      Editor.Message.send("project", "open-settings", "engine", "modules");
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
exports.$ = { root: ".bytedance-mini-game" };
exports.update = update;
exports.ready = ready;
