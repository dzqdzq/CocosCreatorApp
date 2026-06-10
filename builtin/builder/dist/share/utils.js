var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, r, t, o = t) => {
        var n = Object.getOwnPropertyDescriptor(r, t);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : r.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return r[t];
            },
          };
        }

        Object.defineProperty(e, o, n);
      }
    : (e, r, t, o) => {
        e[(o = o === undefined ? t : o)] = r[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, r) => {
        Object.defineProperty(e, "default", { enumerable: true, value: r });
      }
    : (e, r) => {
        e.default = r;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var r;
          var t = [];
          for (r in e) {
            if (Object.prototype.hasOwnProperty.call(e, r)) {
              t[t.length] = r;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var r = {};
      if (e != null) {
        for (var t = n(e), o = 0; o < t.length; o++) {
          if (t[o] !== "default") {
            __createBinding(r, e, t[o]);
          }
        }
      }
      __setModuleDefault(r, e);
      return r;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.compareNumeric = compareNumeric;
exports.compareUUID = compareNumeric;
exports.getPreviewUrl = getPreviewUrl;
exports.getOptionsDefault = getOptionsDefault;
exports.checkCompressOptions = checkCompressOptions;
exports.warnModuleFallBack = warnModuleFallBack;
exports.transTimeToNumber = transTimeToNumber;
exports.getTaskLogDest = getTaskLogDest;
exports.getCurrentTime = getCurrentTime;
exports.changeToLocalTime = changeToLocalTime;
exports.checkHasError = checkHasError;
exports.getParamsFromCommand = getParamsFromCommand;
exports.checkConfigDefault = checkConfigDefault;
exports.defaultsDeep = defaultsDeep;
exports.defaultMerge = defaultMerge;
exports.Metric = Metric;
exports.transI18nName = transI18nName;
exports.requestModule = requestModule;
exports.formatMSTime = formatMSTime;
exports.resolveToRaw = resolveToRaw;

const { basename, join, isAbsolute } = require("path");

const textureCompressConfig = __importStar(
  require("../share/texture-compress")
);
function compareNumeric(e, r) {
  return e.localeCompare(r, "en", { numeric: true });
}
async function getPreviewUrl() {
  var e = await Editor.Message.request("server", "query-port");
  return `http://${await Editor.Message.request(
    "preview",
    "get-preview-ip"
  )}:${e}/build`;
}
function getOptionsDefault(r) {
  const t = {};

  Object.keys(r).forEach((e) => {
    t[e] = r[e].default;
  });

  return t;
}
function checkCompressOptions(e) {
  if (!e || typeof e != "object" || Array.isArray(e)) {
    console.error(
      Editor.I18n.t("builder.project.texture_compress.tips.require_object")
    );

    return false;
  }
  var r = Object.keys(textureCompressConfig.configGroups);
  for (const n of Object.keys(e)) {
    var t = e[n];
    if (!t || typeof t != "object") {
      console.error(
        Editor.I18n.t(
          "builder.project.texture_compress.tips.xx_require_object",
          { name: n + `(${t})` }
        )
      );

      return false;
    }
    if (!t.name) {
      console.error(
        Editor.I18n.t("builder.project.texture_compress.tips.require_name")
      );

      return false;
    }
    if (!t.options || typeof t.options != "object" || Array.isArray(t)) {
      console.error(
        Editor.I18n.t(
          "builder.project.texture_compress.tips.xx_require_object",
          { name: "options" }
        )
      );

      return false;
    }
    for (const a of Object.keys(t.options)) {
      if (!r.includes(a)) {
        console.error(
          Editor.I18n.t("builder.project.texture_compress.tips.platform_err", {
            name: "options",
            supportPlatforms: r.toString(),
          })
        );

        return false;
      }
      var o = t.options[a];
      for (const i of Object.keys(o)) {
      }
    }
  }
  return true;
}
async function warnModuleFallBack(o, e) {
  var r;
  if (Object.keys(o).length) {
    r = Object.keys(o).reduce((e, r, t) =>
      t === 1
        ? changeFallbackStr(e) + (", " + changeFallbackStr(r, o[r]))
        : e + (", " + changeFallbackStr(r, o[r]))
    );

    return console.warn(
      Editor.I18n.t("builder.warn.engineModulesFallBackTip", {
        platform: e,
        fallbackMsg: r,
      })
    );
  }
}
function changeFallbackStr(e, r) {
  return r ? e + " -> " + r : e + "×";
}
function transTimeToNumber(e) {
  var r = (e = basename(e, ".log")).match(/-(\d+)$/);
  return (
    r
      ? (((e = Array.from(e))[r.index] = ":"), new Date(e.join("")))
      : new Date()
  ).getTime();
}
function getTaskLogDest(e, r) {
  return Editor.UI.__protected__.File.resolveToUrl(
    join(
      Editor.Project.tmpDir,
      "builder",
      "log",
      e + changeToLocalTime(r, 5).replace(/:/g, "-") + ".log"
    ),
    "project"
  );
}
function getCurrentTime() {
  return changeToLocalTime(Date.now());
}
function changeToLocalTime(e, r = 8) {
  e = new Date(Number(e));
  return (e.toLocaleDateString().replace(/\//g, "-") +
  " " + e.toTimeString().slice(0, r));
}
function checkHasError(e) {
  if (e) {
    if (typeof e != "object" || Array.isArray(e)) {
      if (typeof e == "string") {
        return true;
      }
    } else {
      for (const r of Object.keys(e)) {
        if (checkHasError(e[r])) {
          return true;
        }
      }
    }
  }
  return false;
}
function getParamsFromCommand(e) {
  return (e = e && e.match(/\$\{([^${}]*)}/g))
    ? e.map((e) => e.replace("${", "").replace("}", ""))
    : [];
}
function checkConfigDefault(t) {
  return t
    ? ((t.default !== undefined && t.default !== null) ||
        (t.type === "array" &&
          Array.isArray(t.itemConfigs) &&
          ((t.default = []),
          t.itemConfigs.forEach((e, r) => {
            t.default[r] = checkConfigDefault(e);
          })),
        t.type === "object" &&
          typeof t.itemConfigs == "object" &&
          ((t.default = {}),
          Object.keys(t.itemConfigs).forEach((e) => {
            t.default[e] = checkConfigDefault(t.itemConfigs[e]);
          }))),
      t.default)
    : null;
}
function defaultsDeep(t, o) {
  if (t != null && !Array.isArray(t)) {
    Object.keys(o).forEach((e) => {
      var r = o[e];

      if (typeof r == "object" && !Array.isArray(r) && r) {
        t[e] || (t[e] = {});
        defaultsDeep(t[e], r);
      } else if (t[e] === undefined || t[e] === null) {
        t[e] = r;
      }
    });
  }

  return t;
}
function defaultMerge(e, ...r) {
  for (const t of r) {
    if (t && typeof t == "object") {
      for (const o in t) {
        if (!(o in e) || typeof t[o] != "object" || Array.isArray(t[o])) {
          e[o] = t[o];
        } else {
          e[o] = defaultMerge(e[o], t[o]);
        }
      }
    }
  }
  return e;
}
function Metric(e) {
  if (e) {
    Editor.Metrics._trackEventWithTimer({
      category: "buildSystem",
      id: e,
      value: 1,
    });
  }
}
function transI18nName(e) {
  return typeof e != "string"
    ? ""
    : (e.startsWith("i18n:") &&
        ((e = e.replace("i18n:", "")),
        Editor.I18n.t(e) || console.debug(e + " is not defined in i18n"),
        Editor.I18n.t(e))) ||
        e;
}
async function requestModule(e, r, ...t) {
  try {
    return typeof e == "function" ? await e[r](...t) : e[r];
  } catch (e) {
    console.debug(e);
    return null;
  }
}
function formatMSTime(e) {
  var r = e / 1000; /* 1e3 */
  let t = "";
  var o = Math.floor(r / 60 / 60);

  if (o) {
    t = o + " h";
  }

  var n = Math.floor(r / 60) % 60;

  if (n) {
    t += ` ${n} min`;
  }

  var r = Math.floor(r) % 60;

  if (r) {
    t += ` ${r} s`;
  }

  var e = e - 1000 /* 1e3 */ * (60 * o * 60 + 60 * n + r);

  if (e && !t) {
    t += ` ${e} ms`;
  }

  return t.trimStart();
}
function resolveToRaw(e, r) {
  return isAbsolute(e) ? e : join(r, e);
}
