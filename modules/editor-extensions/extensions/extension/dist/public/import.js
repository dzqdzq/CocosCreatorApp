var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        var o = Object.getOwnPropertyDescriptor(t, a);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[a];
            },
          };
        }

        Object.defineProperty(e, r, o);
      }
    : (e, t, a, r) => {
        e[(r = r === undefined ? a : r)] = t[a];
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
    var o = (e) =>
      (o =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var a = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              a[a.length] = t;
            }
          }
          return a;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var a = o(e), r = 0; r < a.length; r++) {
          if (a[r] !== "default") {
            __createBinding(t, e, a[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportPackageErrorMessage = undefined;
exports.importPackage = importPackage;
exports.importPackageFolder = importPackageFolder;
exports.importPackageSymlink = importPackageSymlink;
exports.importPackageByFolderPath = importPackageByFolderPath;

const { spawn } = require("child_process");

const fix_path_1 = __importDefault(require("fix-path"));
const fs_extra_1 = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));

exports.ImportPackageErrorMessage = {
  invalidPath: "invalid path",
  decompressFail: "decompress fail",
  cancel: "cancel",
  cannotFindPackageJson: "cannot find package.json",
};

const throwIfNotExists = (e, t) => {
  if (!fs_extra_1.default.existsSync(e)) {
    throw new Error(t ?? `path not exists: "${e}"`);
  }
};

const unzipOfDarwin = (e, t, a) => {
  var r = path_1.default.dirname(t);

  var r =
    (fs_extra_1.default.ensureDirSync(r),
    (0, fix_path_1.default)(),
    spawn("unzip", ["-n", e, "-d", t]));

  let o = "";

  r.stderr.on("data", (e) => {
    o += e;
  });

  let n = "";

  r.stdout.on("data", (e) => {
    n += e;
  });

  r.on("error", (e) => {
    if (n) {
      console.log(n);
    }

    if (o) {
      console.warn(o);
    }

    a(e);
  });

  r.on("close", (e) => {
    if (n) {
      console.log(n);
    }

    if (o) {
      console.warn(o);
    }

    let t = null;

    if (e !== 0) {
      t = new Error(Editor.I18n.t("extension.menu.decompressFail"));
    }

    a(t);
  });
};

const unzipOfWin32 = (e, t, a) => {
  var r = path_1.default.dirname(t);

  var r =
    (fs_extra_1.default.ensureDirSync(r),
    spawn(path_1.default.join(Editor.App.path, "../tools/unzip.exe"), [
      "-n",
      e,
      "-d",
      t,
    ]));

  let o = "";

  r.stderr.on("data", (e) => {
    o += e;
  });

  let n = "";

  r.stdout.on("data", (e) => {
    n += e;
  });

  r.on("error", (e) => {
    if (n) {
      console.log(n);
    }

    if (o) {
      console.warn(o);
    }

    a(e);
  });

  r.on("close", (e) => {
    if (n) {
      console.log("[extension] " + n);
    }

    if (o) {
      console.warn("[extension] " + o);
    }

    let t = null;

    if (e !== 0) {
      t = new Error(Editor.I18n.t("extension.menu.decompressFail"));
    }

    a(t);
  });
};

async function importPackage(e = "project", r, t) {
  const o = t?.extensionDisplayName || path_1.default.basename(r, ".zip");
  var t = t?.forceImport;
  var a = e === "project" ? Editor.Project.path : Editor.App.home;
  var a = path_1.default.join(a, "./extensions");

  if (!fs_extra_1.default.existsSync(a)) {
    await fs_extra_1.default.ensureDir(a);
  }

  if (!r || r === a) {
    throw new Error("invalid path");
  }

  let n;
  n = process.platform === "win32" ? unzipOfWin32 : unzipOfDarwin;
  a = Editor.App.temp;
  const i = path_1.default.join(a, `extension_${o}_` + Date.now());
  try {
    const s = Editor.Task.addNotice({
      title: Editor.I18n.t("extension.menu.decompressingNow", {
        extensionName: o,
      }),
      type: "log",
      source: "extension",
    });
    await new Promise((t, a) => {
      n(r, i, (e) => {
        Editor.Task.removeNotice(s);

        if (e) {
          console.error(e);
          return a(e.message);
        }

        t(null);

        Editor.Task.addNotice({
          title: Editor.I18n.t("extension.menu.decompressSuccess", {
            extensionName: o,
          }),
          message: Editor.I18n.t("extension.menu.importingNow", {
            extensionName: o,
          }),
          type: "success",
          source: "extension",
          timeout: 5000 /* 5e3 */,
        });
      });
    });
  } catch (e) {
    throw new Error("decompress fail");
  }
  return importPackageTemplate({
    forceImport: t ?? false,
    extensionDisplayName: o,
    extensionFolder: i,
    selectedPath: r,
    type: e,
    async processor(e, t) {
      await fs_extra_1.default.move(e, t, { overwrite: true });
    },
    cleanup: async (e) => {
      if (fs_extra_1.default.existsSync(e)) {
        await fs_extra_1.default.remove(e);
      }

      await fs_extra_1.default.remove(i);
    },
  });
}
async function importPackageFolder(e, t, a) {
  throwIfNotExists(t, `Package import failed: invalid package folder "${t}"`);

  return await importPackageTemplate({
    forceImport: a?.forceImport ?? false,
    extensionDisplayName: a?.extensionDisplayName ?? path_1.default.basename(t),
    type: e,
    extensionFolder: t,
    selectedPath: t,
    async processor(e, t) {
      await fs_extra_1.default.copy(e, t);
    },
  });
}
function importPackageSymlink(e, t, a) {
  throwIfNotExists(t, `Package import failed: invalid package folder "${t}"`);

  return importPackageTemplate({
    type: e,
    extensionDisplayName: a?.extensionDisplayName ?? path_1.default.basename(t),
    forceImport: a?.forceImport ?? false,
    extensionFolder: t,
    selectedPath: t,
    async processor(e, t) {
      await fs_extra_1.default.symlink(e, t, "junction");
    },
  });
}
async function importPackageByFolderPath(e) {
  try {
    if (await (0, fs_extra_1.pathExists)(e)) {
      var t;
      if (null == (await detectPackage(e))) {
        t = new Error(exports.ImportPackageErrorMessage.cannotFindPackageJson);

        t.path = e;
        throw t;
      }
      await Editor.Package.register(e);
      await Editor.Package.enable(e);
    }
  } catch (e) {
    console.error(e);
  }
}
async function importPackageTemplate(e) {
  const { extensionDisplayName, type, extensionFolder } = e;
  const e_forceImport = e.forceImport;
  var i_packageFolder =
    type === "project" ? Editor.Project.path : Editor.App.home;
  var i_packageFolder = path_1.default.join(i_packageFolder, "./extensions");

  if (!fs_extra_1.default.existsSync(i_packageFolder)) {
    await fs_extra_1.default.ensureDir(i_packageFolder);
  }

  var i = await detectPackage(extensionFolder);

  if (i == null) {
    s = new Error(exports.ImportPackageErrorMessage.cannotFindPackageJson);

    s.path = extensionFolder;
    throw s;
  }

  if (i.nested) {
    Editor.Task.addNotice({
      title: Editor.I18n.t("extension.menu.zipDirectoryWarnTitle", {
        extensionName: extensionDisplayName,
      }),
      message: Editor.I18n.t("extension.menu.zipDirectoryWarnContent"),
      type: "warn",
      source: "extension",
      timeout: 5000 /* 5e3 */,
    });
  }

  var s = path_1.default.join(i_packageFolder, i.packageName);
  var i_packageFolder = i.packageFolder;
  if (fs_extra_1.default.existsSync(s)) {
    if (
      !(await (!!e_forceImport ||
        (
          await Editor.Dialog.info(
            Editor.I18n.t("extension.menu.reinstall", {
              extensionName: extensionDisplayName,
            }),
            {
              buttons: [
                Editor.I18n.t("extension.menu.confirm"),
                Editor.I18n.t("extension.menu.cancel"),
              ],
              cancel: 1,
            }
          )
        ).response !== 1))
    ) {
      if (typeof e.cleanup == "function") {
        await e.cleanup(i_packageFolder);
      }

      throw new Error("cancel");
    }
    try {
      await Editor.Package.disable(s, { replacement: false });
      await Editor.Package.unregister(s);
      await Editor.Message.request("extension", "trash-item", s);
    } catch (e) {
      await Editor.Package.register(s);
      await Editor.Package.enable(s);

      if (typeof e == "string") {
        throw new Error(e);
      }

      throw e;
    }
  }
  try {
    await e.processor(i_packageFolder, s);
  } finally {
    if (typeof e.cleanup == "function") {
      try {
        await e.cleanup(i_packageFolder);
      } catch (e) {
        console.error(e);
      }
    }
  }

  Editor.Task.addNotice({
    title: Editor.I18n.t("extension.menu.importSuccess"),
    message: extensionDisplayName,
    type: "success",
    source: "extension",
    timeout: 5000 /* 5e3 */,
  });

  Editor.Package.register(s);
  return s;
}
async function detectPackage(e) {
  var t = path_1.default.join(e, "package.json");
  if (fs_extra_1.default.existsSync(t)) {
    return {
      packageName: (await fs_extra_1.default.readJson(t)).name,
      packageJsonPath: t,
      packageFolder: e,
      nested: false,
    };
  }
  for (const o of await fs_extra_1.default.readdir(e)) {
    var a = path_1.default.join(e, o);
    var r = path_1.default.join(a, "package.json");
    if (fs_extra_1.default.existsSync(r)) {
      return {
        packageName: (await fs_extra_1.default.readJson(r)).name,
        packageJsonPath: r,
        packageFolder: a,
        nested: true,
      };
    }
  }
}
