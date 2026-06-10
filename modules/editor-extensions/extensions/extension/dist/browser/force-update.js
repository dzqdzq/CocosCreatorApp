var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupContext = setupContext;
exports.forceUpdate = forceUpdate;
const extension_sdk_1 = require("@editor/extension-sdk");
const semver_1 = __importDefault(require("semver"));
const fs_extra_1 = __importDefault(require("fs-extra"));

const { readConfigs } = require("../shared/config");

const interface_1 = require("../public/interface");
const utils_1 = require("../public/utils");
function assertIsDefined(e, t) {
  if (e == null) {
    throw new Error(
      typeof t == "string"
        ? t
        : "Expected 'val' to be defined, but received " + e
    );
  }
}
function normalizeListResponse(e) {
  var t = new Set();
  var a = {};
  for (const n of e) {
    t.add(n.name);
    a[n.name] = n;
  }
  return { names: t, extensions: a };
}
function normalizeInternalPackages(e) {
  var t = {};
  var a = {};
  var n = [];
  for (const o of e) {
    var o_name = o.name;
    var s = Editor.Package.__protected__.checkType(o.path);
    n.push(o.path);
    t[o.path] = { ...o, pkgType: s };
    (a[o_name] ?? (a[o_name] = {}))[s] = o.path;
  }
  return { packagesEntry: n, packages: t, nameToPaths: a };
}
async function setupContext() {
  var { customSdkDomain, extensionPaths } = await readConfigs();

  var a = Editor.App.version;
  return {
    sdk: new extension_sdk_1.Manager({
      extensionPaths: [extensionPaths.project, extensionPaths.global],
      domain: customSdkDomain,
    }),
    editorVersion: a,
    extensionPaths: extensionPaths,
  };
}
async function forceUpdate(e) {
  const { editorVersion, sdk, extensionPaths } = await setupContext();

  var t = (
    await sdk.getExtensionList({
      e: editorVersion,
      label: "" + interface_1.ExtensionManagerTab.ForcedUpdate,
      lang: Editor.I18n.getLanguage(),
    })
  ).packages;

  var { names, extensions } = normalizeListResponse(t);
  const { packages, nameToPaths } = normalizeInternalPackages(
    await Editor.Package.getPackages()
  );
  var l = new Map();
  var c = new Map();
  let p = undefined;
  for (const b of names) {
    try {
      var d = extensions[b];
      var u = nameToPaths[b] ?? {};
      var f = Object.keys(u);
      var h = b === utils_1.INTERNAL_EXTENSION_NAME;
      if (f.length < 1) {
        l.set(b, {
          name: b,
          type: "global",
          path: "",
          builtinPath: "",
          enabled: false,
        });
      } else {
        for (const v of f) {
          if (!c.has(b)) {
            var g;
            var P = u[v];

            assertIsDefined(
              P,
              `cannot find path type "${v}" in package local paths`
            );

            var _ = packages[P];

            assertIsDefined(
              _,
              `cannot find package path "${P}" in package entity map`
            );

            switch (v) {
              case "cover":
              case "builtin":
              case "local": {
                if (semver_1.default.gte(_.version, d.latest_version)) {
                  l.get(b) != null && l.delete(b);
                  c.set(b, { path: _.path, enabled: _.enable });

                  h &&
                    _.enable !== true &&
                    (p = {
                      builtInPath: u.builtin ?? "",
                      currentPath: "",
                      newInstallPath: _.path,
                    });
                } else if (l.has(b) && _.enable === true) {
                  if (h && p) {
                    p.currentPath = _.path;
                  } else {
                    g = l.get(b);
                    l.set(b, { ...g, path: _.path, type: _.pkgType });
                  }
                } else {
                  l.set(b, {
                    name: b,
                    path: _.path,
                    type: v,
                    builtinPath: u.builtin ?? "",
                    enabled: _.enable,
                  });
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      continue;
    }
  }
  names = Array.from(l).map(([, t]) => {
    var t_name = t.name;
    return sdk.getDownloader(
      { installPath: extensionPaths.global, name: t_name, e: editorVersion },
      {
        perDownloaded: async (e) => {
          assertIsDefined(e.installPkgPath);
          var e = e.installPkgPath;
          var t = packages[e];

          if (fs_extra_1.default.existsSync(e) && t != null) {
            await Editor.Package.disable(e, {});
            await Editor.Package.unregister(e);
          }
        },
        perInstalled: async (e) => {
          assertIsDefined(e.installPkgPath);

          if (e.name === utils_1.INTERNAL_EXTENSION_NAME) {
            p = {
              currentPath: t.path,
              newInstallPath: e.installPkgPath,
              builtInPath: t.builtinPath,
            };
          } else {
            await Editor.Package.register(e.installPkgPath);
            await Editor.Package.enable(e.installPkgPath);
          }
        },
      }
    );
  });
  try {
    var m = await Promise.allSettled(names.map((e) => e.download()));
    for (let e = 0; e < m.length; e++) {
      var k = m[e];

      if (k.status !== "fulfilled") {
        console.error(k.reason);
      }
    }
  } catch (e) {
    console.error(e);
  }
  if (c.size > 0) {
    const x = c.entries();
    setTimeout(async () => {
      for (var [t, { enabled: e, path: a }] of x) {
        if (e !== true) {
          try {
            await Editor.Package.enable(a);
          } catch (e) {
            console.error(`Extension enable failed. name "${t}", path "${a}"`);
            console.error(e);
            continue;
          }
        }
      }
    }, 0);
  }
  try {
    if (typeof p == "object" && p != null && e.selfUpdate) {
      const e_selfUpdate = e.selfUpdate;
      const E = p;
      setTimeout(async () => {
        var e = await Editor.Panel.has("extension.manager");
        e_selfUpdate({ ...E, reopenPanel: e });
      }, 0);
    }
  } catch (e) {
    console.error("Extension forced self update failed");
    console.error(e);
  }
}
