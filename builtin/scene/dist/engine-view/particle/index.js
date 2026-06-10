var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        var i = Object.getOwnPropertyDescriptor(t, r);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, a, i);
      }
    : (e, t, r, a) => {
        e[(a = a === undefined ? r : a)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var i = (e) =>
      (i =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = i(e), a = 0; a < r.length; a++) {
          if (r[a] !== "default") {
            __createBinding(t, e, r[a]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.particleMgr = undefined;
const plist = __importStar(require("plist"));

const { join, relative } = require("path");

const { readFileSync } = require("fs");

class ParticleManager {
  async exportParticlePlist(e, t) {
    var r = (
      await Editor.Dialog.save({
        title: "Save Particle",
        path: join(Editor.Project.path, "assets"),
        filters: [{ name: "Particle", extensions: ["plist"] }],
      })
    ).filePath;
    if (r) {
      var a = join(Editor.Project.path, "assets");
      if (Editor.Utils.Path.contains(a, r)) {
        try {
          var i = e || "db://internal/default_ui/atom.plist";
          var s = await Editor.Message.request("asset-db", "query-path", i);
          var n = plist.parse(readFileSync(s, "utf8"));
          var o = Object.assign(n, t);
          var l = "db://assets/" + relative(a, r);
          return await Editor.Message.request(
            "asset-db",
            "create-asset",
            l,
            plist.build(o),
            { overwrite: true }
          );
        } catch (e) {
          console.error(e);
        }
      } else {
        await Editor.Dialog.warn(Editor.I18n.t("scene.messages.warning"), {
          detail: Editor.I18n.t(
            "scene.messages.particle_system_2d.export_error"
          ),
          buttons: [Editor.I18n.t("scene.messages.confirm")],
        });
      }
    }
  }
}
const particleMgr = new ParticleManager();
exports.particleMgr = particleMgr;
