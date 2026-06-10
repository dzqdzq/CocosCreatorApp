Object.defineProperty(exports, "__esModule", { value: true });
exports.attach = attach;
exports.detach = detach;
exports.queryType = queryType;
exports.queryRendererMap = queryRendererMap;
exports.queryDropConfig = queryDropConfig;
exports.start = start;
exports.end = end;

const { isAbsolute, join } = require("path");

let started = false;
const slots = ["header", "section", "footer"];
let inspectorConfig = {};
const pluginsGroup = {};
function typeInit(e, t) {
  inspectorConfig[e] = {
    panel: t ?? "",
    slot: { header: {}, section: {}, footer: {} },
    drop: {},
  };
}
function mergeConfig() {
  inspectorConfig = {};

  Object.values(pluginsGroup).forEach((r) => {
    const t = r.info.contributions.inspector;

    Object.entries(t.type ?? []).forEach(([e, t]) => {
      t = isAbsolute(t) ? t : join(r.path, t);

      if (inspectorConfig[e]) {
        inspectorConfig[e].panel &&
          console.warn(
            Editor.I18n.t("inspector.extension.overwritten", {
              oldPanel: inspectorConfig[e].panel,
              plugin: r.name,
              panel: t,
            })
          );

        inspectorConfig[e].panel = t;
      } else {
        typeInit(e, t);
      }
    });

    slots.forEach((n) => {
      var e = t[n];

      if (e) {
        Object.entries(e).forEach(([o, e]) => {
          Object.entries(e).forEach(([e, t]) => {
            t = isAbsolute(t) ? t : join(r.path, t);

            if (!inspectorConfig[o]) {
              typeInit(o);
            }

            if (Array.isArray(inspectorConfig[o].slot[n][e])) {
              if (!inspectorConfig[o].slot[n][e].includes(t)) {
                inspectorConfig[o].slot[n][e].push(t);
              }
            } else {
              inspectorConfig[o].slot[n][e] = [t];
            }
          });
        });
      }
    });

    if (t.drop) {
      Object.entries(t.drop).forEach(([o, e]) => {
        if (Array.isArray(e)) {
          inspectorConfig[o] || typeInit(o);

          e.forEach((e) => {
            var { type: e, message } = e;
            inspectorConfig[o].drop[e] = { package: r.name, message: message };
          });
        }
      });
    }
  });
}
function attach(e) {
  if (e.info.contributions?.inspector && !pluginsGroup[e.name]) {
    pluginsGroup[e.name] = e;
    mergeConfig();
  }
}
function detach(e) {
  if (e.info.contributions?.inspector && pluginsGroup[e.name]) {
    delete pluginsGroup[e.name];
    mergeConfig();
    deleteRequireCache(e);
  }
}
function queryType(e) {
  if (e) {
    return inspectorConfig[e]?.panel ?? "";
  }

  return Object.entries(inspectorConfig).reduce((e, [t, o]) => {
    e[t] = o?.panel ?? "";
    return e;
  }, {});
}
function queryRendererMap(e) {
  if (e) {
    if (inspectorConfig[e]) {
      return inspectorConfig[e].slot;
    }

    return {};
  }

  return Object.entries(inspectorConfig).reduce((e, [t, o]) => {
    e[t] = o.slot;
    return e;
  }, {});
}
function queryDropConfig(e) {
  return inspectorConfig[e] && inspectorConfig[e].drop;
}
function start() {
  if (!started) {
    started = true;
    Editor.Package.getPackages({ enable: true }).forEach(attach);
    Editor.Package.__protected__.on("enable", attach);
    Editor.Package.__protected__.on("disable", detach);
  }
}
function end() {}
function deleteRequireCache(t) {
  const o = t.info.contributions.inspector;
  slots.forEach((e) => {
    e = o[e];

    if (e) {
      Object.entries(e).forEach(([, e]) => {
        Object.entries(e).forEach(([, e]) => {
          e = isAbsolute(e) ? e : join(t.path, e);
          delete require.cache[e];
        });
      });
    }
  });
}
