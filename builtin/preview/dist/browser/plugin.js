Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginManager = undefined;

const { isAbsolute, join } = require("path");

const lodash = require("lodash");
class PluginManager {
  configs = {};
  supportPreviewTypes = ["browser", "game-view", "simulator"];
  supportDataType = ["settings", "renderData"];
  hasRegisterPackages = new Set();
  async init() {
    var e = Editor.Package.getPackages({ enable: true });

    await Promise.all(e.map((e) => this.register(e)));

    Editor.Package.__protected__.on("enable", (e) => this.register(e));

    Editor.Package.__protected__.on("disable", (e) => this.unregister(e));
  }
  async register(t) {
    if (
      !t ||
      !t.info ||
      this.hasRegisterPackages.has(t.name) ||
      !t.enable ||
      !t.info.contributions ||
      typeof t.info.contributions.preview != "object"
    ) {
      return false;
    }
    this.hasRegisterPackages.add(t.name);
    const o = t.info.contributions.preview;
    if (o["*"]) {
      for (const e of this.supportPreviewTypes) {
        await this.internalRegister(e, t.name, t.path, o["*"]);
      }
    }
    Object.keys(o).forEach((e) => {
      if (e !== "*") {
        this.internalRegister(e, t.name, t.path, o[e]);
      }
    });
  }
  async internalRegister(t, o, e, s) {
    try {
      var r;

      if (
        s &&
        s.methods &&
        (isAbsolute(s.methods) || (s.methods = join(e, s.methods)),
        (r = Editor.Module.__protected__.requireFile(s.methods)).load &&
          (await r.load()),
        typeof s.hooks == "object")
      ) {
        Object.keys(s.hooks).forEach((e) => {
          lodash.set(this.configs, t + `.${e}.` + o, {
            methods: s.methods,
            hook: s.hooks[e],
          });
        });
      }
    } catch (e) {
      console.error(`Register preview plugin ${o} failed!`);
      console.error(e);
    }
  }
  async runHooks(t, o, ...e) {
    var s = lodash.get(this.configs, t + "." + o);
    if (s && Object.keys(s).length) {
      for (const i of Object.keys(s)) {
        var r = s[i];
        try {
          await (0, Editor.Module.__protected__.requireFile(r.methods)[r.hook])(
            ...e
          );

          console.debug(
            `[preview] runHooks (${t}-${o}) from plugin ${i} success!`
          );
        } catch (e) {
          console.error(
            `[preview] runHooks (${t}-${o}) from plugin ${i} failed!`
          );

          console.error(e);
        }
      }
    }
  }
  async unregister(s) {
    if (this.hasRegisterPackages.has(s.name)) {
      const r = s.info.contributions?.preview;

      this.supportPreviewTypes.forEach(async (t) => {
        var e;
        var o = r[t];

        if (
          o &&
          o.methods &&
          ((e = Editor.Module.__protected__.requireFile(o.methods)) &&
            e.unload &&
            (await e.unload()),
          Editor.Module.__protected__.removeCache(o.methods),
          o.hooks)
        ) {
          this.supportDataType.forEach((e) => {
            if (this.configs[t][e]) {
              delete this.configs[t][e][s.name];
            }
          });
        }
      });

      this.hasRegisterPackages.delete(s.name);
    }
  }
}
exports.pluginManager = new PluginManager();
