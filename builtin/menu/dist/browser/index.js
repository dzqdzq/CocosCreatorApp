Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.contributions = undefined;
exports.checkWhen = checkWhen;
exports.load = load;
exports.unload = unload;

const { forOwn, has } = require("lodash");

const { getPlatform } = require("./platform");

const panel = require("@editor/panel");
const panelMap = {};
const modeMap = {};
const projectTypeMap = {};
const packageShortcutMap = new Map();
let shortcutUserConfig = {};
const noopMap = Object.freeze({});
const menuMap = {};
const dirty = [];
let projectType = "3d";
function checkWhen(when) {
  if (!when) {
    return true;
  }
  if (typeof when != "string") {
    return false;
  }
  const $focusPanel = panel.getFocusPanel();
  const EditMode = Editor.EditMode.getMode();
  const $focusPanel_current = $focusPanel.current;
  const ProjectType = projectType;
  try {
    return eval(when);
  } catch (error) {
    console.error(error);
    return false;
  }
}
async function readUserShortcutConfig() {
  return Editor.Profile.getConfig("shortcuts", "userConfig", "global").then(
    (e) => {
      const a = {};

      forOwn(e, (e, t) => {
        const o = {};

        forOwn(e, (e) => {
          var a;

          if (typeof e.rawShortcut == "string") {
            a = e.rawShortcut;

            has(o, a) &&
              console.warn(
                `raw shortcut "${a}" already exists in package "${t}"`
              );

            o[a] = e;
          }
        });

        a[t] = o;
      });

      return a;
    }
  );
}
async function load() {
  await setProjectType();
  await getPlatform(process.platform)();
  shortcutUserConfig = await readUserShortcutConfig();
  Editor.Layout.__protected__.on("layout-added", updateCustomLayoutMenu);
  panel.on("focus", exports.methods.updatePanelMenu);
  panel.on("blur", exports.methods.updatePanelMenu);
}
async function unload() {
  Editor.Package.__protected__.removeListener("enable", exports.methods.attach);

  Editor.Package.__protected__.removeListener(
    "disable",
    exports.methods.detach
  );

  Editor.Layout.__protected__.removeListener(
    "layout-added",
    updateCustomLayoutMenu
  );

  panel.removeListener("focus", exports.methods.updatePanelMenu);
  panel.removeListener("blur", exports.methods.updatePanelMenu);
}
async function updateCustomLayoutMenu() {
  let e = "Cocos Creator";

  if (process.platform === "win32") {
    e = "i18n:menu.file";
  }

  Editor.Menu.__protected__.add(e + "/i18n:menu.layout", {
    label: "i18n:menu.customLayout",
    enabled: !!(await Editor.Layout.query("custom")),
    async click() {
      Editor.Layout.apply(await Editor.Layout.query("custom"));
    },
  });

  Editor.Menu.__protected__.apply();
}
async function setProjectType() {
  try {
    var e =
      (await Editor.Message.request("engine", "query-engine-modules-profile"))
        ?.includeModules ?? [];
    exports.methods.engineModuleChanged(e);
  } catch (e) {}
}

exports.contributions = {
  enable(e, a) {
    exports.methods.attach(e, a);
  },
  disable(e, a) {
    exports.methods.detach(e, a);
  },
};

exports.methods = {
  async attach(n, e) {
    if (!n.invalid) {
      if (n.name === "engine") {
        process.nextTick(() => {
          setProjectType();
        });
      }

      e = e || [];

      const a = (n.info.contributions && n.info.contributions.shortcuts) || [];

      const s = [];

      (e || []).forEach((r) => {
        dirty.push({ path: r.path, label: r.label });
        menuMap[r.path] = menuMap[r.path] || {};
        menuMap[r.path][r.label] = menuMap[r.path][r.label] || [];
        const p = Editor.Utils.Parse.when(r.when);

        if (p.PanelName) {
          panelMap[p.PanelName] = panelMap[p.PanelName] || [];

          panelMap[p.PanelName].push({
            label: r.label,
            source: n.name,
            path: r.path,
          });
        }

        if (p.EditMode) {
          modeMap[p.EditMode] = modeMap[p.EditMode] || [];

          modeMap[p.EditMode].push({
            label: r.label,
            source: n.name,
            path: r.path,
          });
        }

        if (p.ProjectType) {
          projectTypeMap[p.ProjectType] = projectTypeMap[p.ProjectType] || [];

          projectTypeMap[p.ProjectType].push({
            label: r.label,
            source: n.name,
            path: r.path,
          });
        }

        if (r.message && typeof r.message == "string") {
          r.message = {
            target: r.target || n.name,
            params: r.params,
            name: r.message,
          };
        } else if (r.message && typeof r.message == "object") {
          Object.assign({ target: n.name }, r.message);
        }

        menuMap[r.path][r.label].push({
          source: n.name,
          when: r.when,
          shortcuts: (a || []).reduce((e, a, t) => {
            var o;

            if (a.message === (r.message && r.message.name)) {
              (o = Editor.Utils.Parse.when(a.when)).PanelName &&
                p.PanelName !== o.PanelName &&
                ((panelMap[o.PanelName] = panelMap[o.PanelName] || []),
                panelMap[o.PanelName].push({
                  label: r.label,
                  source: n.name,
                  path: r.path,
                }));

              o.EditMode &&
                p.EditMode !== o.EditMode &&
                ((modeMap[o.EditMode] = modeMap[o.EditMode] || []),
                modeMap[o.EditMode].push({
                  label: r.label,
                  source: n.name,
                  path: r.path,
                }));

              s.push({ label: r.label, source: n.name, path: r.path });
              e.push(a);
            }

            return e;
          }, []),
          option: {
            label: r.label,
            sublabel: r.sublabel,
            type: r.type,
            checked: r.checked,
            enabled: r.enabled,
            accelerator: "",
            group: r.group || "default",
            order: r.order || 0,
            role: r.role,
            template: r.template,
            message: r.message,
          },
        });
      });

      packageShortcutMap.set(n.name, s);
      exports.methods.apply();
    }
  },
  detach(o, e) {
    (e || [] || []).forEach((a) => {
      if (menuMap[a.path] && menuMap[a.path][a.label]) {
        for (let e = 0; e < menuMap[a.path][a.label].length; e++) {
          var t = menuMap[a.path][a.label][e];

          if (t && t.source === o.name) {
            menuMap[a.path][a.label].splice(e--, 1);
          }
        }
      }
      Editor.Menu.__protected__.remove(a.path, a);
    });

    Object.keys(panelMap).forEach((e) => {
      var a = panelMap[e];
      if (a) {
        for (let e = 0; e < a.length; e++) {
          if (a[e].source === o.name) {
            a.splice(e, 1);
            e--;
          }
        }
      }
    });

    packageShortcutMap.delete(o.name);
    Editor.Menu.__protected__.apply();
  },
  apply() {
    if (dirty.length !== 0) {
      for (const e of dirty) {
        exports.methods.updateMenu(e.path, e.label);
      }
      dirty.length = 0;
      Editor.Menu.__protected__.apply();
    }
  },
  updatePanelMenu(e) {
    e = panelMap[e];

    if (e) {
      e.forEach((e) => {
        dirty.push({ path: e.path, label: e.label });
      });

      exports.methods.apply();
    }
  },
  updateMenu(e, a) {
    let t = true;
    for (const r of (menuMap[e] || {})[a] || []) {
      panel.getFocusPanel();
      if (checkWhen(r.when)) {
        var o = shortcutUserConfig[r.source] ?? noopMap;
        for (const p of r.shortcuts) {
          if (p.when) {
            if (!Editor.Utils.Parse.checkWhen(p.when)) {
              r.option.accelerator = "";
              continue;
            }
          }
          let e = process.platform === "win32" ? p.win : p.mac;

          if (has(o, e) && o[e].message === p.message) {
            e = o[e].shortcut ?? e;
          }

          r.option.accelerator = e;
          break;
        }

        if (process.platform === "win32" && /^Cocos Creator/.test(e)) {
          e =
            r.option.group === "about"
              ? e.replace(/^Cocos Creator/, "i18n:menu.help")
              : e.replace(/^Cocos Creator/, "i18n:menu.file");
        }

        Editor.Menu.__protected__.add(e, r.option);
        t = false;
        break;
      }
    }

    if (t) {
      Editor.Menu.__protected__.remove(e, { label: a });
    }
  },
  engineModuleChanged(e) {
    projectType = e.includes("3d") ? "3d" : "2d";
    for (const a in projectTypeMap) {
      projectTypeMap[a].forEach((e) => {
        dirty.push({ path: e.path, label: e.label });
      });
    }
    exports.methods.apply();
  },
  modeChanged(e, a) {
    a = modeMap[a];

    if (a) {
      a.forEach((e) => {
        dirty.push({ path: e.path, label: e.label });
      });
    }

    a = modeMap[e];

    if (a) {
      a.forEach((e) => {
        dirty.push({ path: e.path, label: e.label });
      });
    }

    exports.methods.apply();
  },
  async onShortcutChange(e) {
    if (typeof e == "string") {
      e = packageShortcutMap.get(e);
      if (Array.isArray(e) && !(e.length < 1)) {
        try {
          shortcutUserConfig = await readUserShortcutConfig();
        } finally {
          for (const a of e) {
            dirty.push({ path: a.path, label: a.label });
          }
          exports.methods.apply();
        }
      }
    }
  },
};
