Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

const { spawn } = require("child_process");

const { existsSync } = require("fs-extra");

const { join, isAbsolute } = require("path");

const electron_1 = require("electron");

const { readFileSync } = require("simple-plist");

let programConfig = {};
function executeProgram(n, i) {
  return new Promise((e, o) => {
    i = i || [];
    let r = "";
    if (process.platform === "darwin") {
      if (n.endsWith(".app")) {
        try {
          n = join(n, "/Contents/MacOS/");

          var t = readFileSync(join(n, "../Info.plist"));

          var a = join(n, t.CFBundleExecutable);
          n = a;
        } catch (r) {
          return o(
            "[execute program error] Probably the program's Info.plist error: " +
              r
          );
        }
      }
      r = "open";

      if (i) {
        i.splice(0, 0, n);
        i.splice(0, 0, "-a");
      } else {
        i = ["-a", n];
      }
    } else {
      r = n;
    }
    console.debug(`program command : ${r} ` + i.join(" "));
    t = spawn(r, i, { detached: true, stdio: "ignore" });

    t.stdout?.on("data", (r) => {
      console.log("[execute program] " + r);
    });

    t.stderr?.on("data", (r) => {
      console.error("[execute program error] " + r);
    });

    t.on("error", (r) => {
      o(n + " exit with error: " + r.message);
    });

    t.on("close", (r) => {
      if (r !== 0) {
        o(n + " exit width code " + r);
      } else {
        e();
      }
    });

    t.unref();
  });
}
function handleArguments(r, e) {
  if (!e || typeof e != "object") {
    return [];
  }
  if (Array.isArray(e)) {
    return e;
  }
  let o = r.commandArgument
    ? r.commandArgument.replace(/}\s+/g, "}@#").replace(/\s+\${/g, "@#${")
    : "";
  var t = r.arguments || {};
  let a = [];
  for (const n in e) {
    if (t[n]) {
      if (typeof e[n] == "boolean") {
        o = o.replace(`\${${n}}`, e[n] ? n : "");
      } else if (o.includes(`\${${n}}`)) {
        o = o.replace(`\${${n}}`, "" + e[n]);
      } else {
        o += "@#" + e[n];
      }
    }
  }

  if (o) {
    a = o
      .replace(/\${(.+?)}/g, "@#")
      .replace(/(@#){2,}/g, "@#")
      .replace(/^(\s|@#)+|(\s|@#)+$/g, "")
      .split("@#");
  }

  if (e._args) {
    a.push(...e._args);
  }

  return a;
}
async function load() {
  Editor.Package.getPackages({ enable: true }).forEach(exports.methods.attach);
  Editor.Package.__protected__.on("enable", exports.methods.attach);
}
function unload() {
  Editor.Package.__protected__.removeListener("enable", exports.methods.attach);
}
exports.methods = {
  async queryProgramInfo(r) {
    if (r) {
      if (r === "browser") {
        r += "V2";
      }

      for (const t in programConfig) {
        if (programConfig[t].properties[r]) {
          var e =
            (await Editor.Profile.getConfig(t, r + ".path", "local")) ??
            (await Editor.Profile.getConfig(t, r + ".path", "global"));

          var o =
            (await Editor.Profile.getConfig(
              t,
              r + ".commandArgument",
              "local"
            )) ??
            (await Editor.Profile.getConfig(
              t,
              r + ".commandArgument",
              "global"
            ));

          if (e != null || o != null) {
            return { path: e || "", commandArgument: o || "" };
          }
        }
      }
    }
    return null;
  },
  queryProgramConfig() {
    return programConfig || {};
  },
  async openProgram(o, t) {
    if (!o || typeof o != "string") {
      console.log(Editor.I18n.t("program.console.programErr"));
      return false;
    }
    try {
      let r = null;
      let e = o;
      for (const s in programConfig) {
        if (programConfig[s].properties) {
          for (const p in programConfig[s].properties) {
            if (o === "browser") {
              e = o + "V2";
            }

            if (p === e) {
              var a = programConfig[s].properties[p];
              r = {
                label: a.label,
                description: a.description,
                arguments: a.arguments,
              };
              break;
            }

            if (r) {
              break;
            }
          }
          if (r) {
            break;
          }
        }
      }
      if (!r) {
        console.debug(
          Editor.I18n.t("program.console.noProgram", { program: o })
        );

        return false;
      }
      var n = await exports.methods.queryProgramInfo(o);
      if (!n?.path) {
        console.debug(
          Editor.I18n.t("program.console.noProgramPath", {
            program: r?.label ? Editor.I18n.t(r.label.split("i18n:")[1]) : o,
          })
        );

        return false;
      }
      if (!existsSync(n.path)) {
        console.log(
          Editor.I18n.t("program.console.programPathErr", {
            program: r?.label ? Editor.I18n.t(r.label.split("i18n:")[1]) : o,
            path: n.path || "",
          })
        );

        return false;
      }
      var i = handleArguments((r = Object.assign({}, r, n)), t);
      await executeProgram(n.path, i);
    } catch (r) {
      console.error(r);
      return false;
    }
    return true;
  },
  async openUrl(r, e) {
    if (!r || typeof r != "string") {
      console.log(Editor.I18n.t("program.console.urlErr"));
      return false;
    }
    try {
      if (r.startsWith("http")) {
        if (await exports.methods.openProgram("browser", { _args: [r] })) {
          return true;
        }
      }

      if (isAbsolute(r)) {
        await electron_1.shell.openPath(r);
      } else {
        await electron_1.shell.openExternal(r, e);
      }
    } catch (r) {
      console.error(r);
      return false;
    }
    return true;
  },
  async attach(e) {
    if (!e.invalid && e.info.contributions && e.info.contributions.program) {
      try {
        var r = e.info.contributions.program;

        var o = {
          title: e.info.title || e.name,
          properties: null,
          custom: r.custom ? join(e.path, r.custom) : "",
        };

        if (r.properties) {
          for (const t in r.properties) {
            o.properties = o.properties || {};

            o.properties[t] = {
              label: r.properties[t].label,
              description: r.properties[t].description,
              render: r.properties[t].render,
              arguments: r.properties[t].arguments,
            };
          }
        }
        programConfig = Object.assign({}, programConfig, { [e.name]: o });
      } catch (r) {
        console.error(`[program] ${e.name} register program failed.`);
        console.error(r);
      }
    }
  },
};
