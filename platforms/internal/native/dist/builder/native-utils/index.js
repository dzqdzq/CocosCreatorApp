Object.defineProperty(exports, "__esModule", { value: true });

exports.createBundle = undefined;
exports.checkLiteVersion = undefined;
exports.compileJsbAdapter = undefined;
exports.outputJSBAdapter = undefined;
exports.clearDest = undefined;
exports.cocos = undefined;
exports.NATIVE_MODULES = undefined;
exports.PATH = undefined;
exports.Path = undefined;

const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const plist = require("plist");
const babelify = require("babelify");
const browserify = require("browserify");
class Path {
  get COCOS2DX() {
    return Path._root;
  }
  get COCOS() {
    return path_1.join(Path._root, "tools/cocos-console/bin");
  }
  get TEMPLATE() {
    return path_1.join(Path._root, "templates");
  }
  get COCOS_CMD() {
    return path_1.join(
      this.COCOS,
      process.platform === "win32" ? "cocos_cli.js" : "cocos"
    );
  }
  get NODEJS() {
    return "node";
  }
  static async queryNativeEnginePath() {
    var e = await Editor.Message.request(
      "engine",
      "query-info",
      Editor.Project.type
    );
    return e && e.nativePath;
  }
}
async function cocos(s, e) {
  if (exports.PATH.COCOS_CMD.includes(" ")) {
    throw new Error(
      `Cocos2dx root [${exports.PATH.COCOS_CMD}] can't include space.`
    );
  }
  var t = [exports.PATH.COCOS_CMD, ...s];
  console.warn("cocos " + t.join(" "));
  const n = child_process_1.spawn(
    process.platform === "win32" ? exports.PATH.NODEJS : "sh",
    t,
    e
  );

  n.stdout.on("data", (e) => {
    let t;
    (t = (t = e.toString()).length > 1 ? t.replace(/\n*$/g, "") : t)
      .split("\n")
      .forEach((e) => {
        console.log("[Cocos]: " + e);
      });
  });

  n.stderr.on("data", (e) => {
    e.toString()
      .split("\n")
      .forEach((e) => {
        if ((e = "[Cocos]: " + e).toLowerCase().includes("warning")) {
          console.warn(e);
        } else {
          console.error(e);
        }
      });
  });

  await new Promise((r, o) => {
    n.on("close", (e, t) => {
      if (e !== 0) {
        console.error(
          `[error] run cocos ${exports.PATH.NODEJS} ${exports.PATH.COCOS_CMD} ` +
            s.join(" ")
        );

        console.error(`[error] return code ${e}, signal ` + t);
        o(new Error("cocos 命令执行失败，详情请查看构建控制台。"));
      } else {
        r(e);
      }
    });

    n.on("error", (e) => {
      o(e);
    });
  });
}
async function clearDest(e) {
  try {
    await fs_extra_1.remove(path_1.join(e, "assets"));
  } catch (e) {
    console.error(e);
  }
}
async function outputJSBAdapter(e, t) {
  var t = (t || {}).targets;

  var r = await Editor.Message.request(
    "engine",
    "query-info",
    Editor.Project.type
  );

  var o = path_1.join(r.path, "platforms/native/builtin/index.js");
  var r = path_1.join(r.path, "platforms/native/engine/index.js");

  await createBundle(o, path_1.join(e, "jsb-adapter", "jsb-builtin.js"), {
    targets: t,
  });

  await createBundle(r, path_1.join(e, "jsb-adapter", "jsb-engine.js"), {
    targets: t,
  });
}
async function compileJsbAdapter() {
  var e;

  var t = await Editor.Message.request(
    "engine",
    "query-info",
    Editor.Project.type
  );

  var r = path_1.join(t.path, "platforms/native");
  var t = path_1.join(t.path, "bin/.cache/dev/native-preview-adapter");

  if (hasChanged(r, t)) {
    e = path_1.join(r, "builtin/index.js");
    r = path_1.join(r, "engine/index.js");

    await createBundle(e, path_1.join(t, "jsb-builtin.js"), {
      targets: "chrome 80",
    });

    await createBundle(r, path_1.join(t, "jsb-engine.js"), {
      targets: "chrome 80",
    });
  }
}
async function checkLiteVersion(e) {
  e = path_1.join(e, ".cocos-project.json");

  if (fs_extra_1.existsSync(e)) {
    (await fs_extra_1.readJSON(e)).engine_version;
  } else {
    console.error(`Can't find project json [{link(${e})}]`);
  }
}
function checkFileStat(r, o) {
  return fs_1.readdirSync(r).some((e) => {
    var e = path_1.join(r, e);
    var t = fs_1.statSync(e);
    return t.isDirectory()
      ? checkFileStat(e, o)
      : t.mtime.getTime() > o || undefined;
  });
}
function hasChanged(e, t) {
  var r;
  var o;
  return (
    !fs_extra_1.existsSync(t) ||
    ((o = path_1.join(t, "jsb-builtin.js")),
    (r = path_1.join(t, "jsb-engine.js")),
    !fs_extra_1.existsSync(o)) ||
    !fs_extra_1.existsSync(r) ||
    ((o = fs_1.statSync(t)),
    checkFileStat(path_1.dirname(e), o.mtime.getTime()))
  );
}
async function createBundle(e, s, t) {
  let r;
  let n;

  if (Array.isArray(t)) {
    r = t;
  } else if (t) {
    r = t.excludes;
    n = t.targets;
  }

  const a = browserify(e);

  if (r) {
    r.forEach((e) => {
      a.exclude(e);
    });
  }

  await fs_extra_1.ensureDir(path_1.dirname(s));

  return new Promise((r, o) => {
    a.transform(babelify, {
      presets: [[require("@babel/preset-env"), { targets: n }]],
    }).bundle((e, t) => {
      if (e) {
        console.error(e);
        o(e);
      } else {
        fs_extra_1.writeFileSync(s, t, "utf8");
        r();
      }
    });
  });
}

(exports.Path = Path)._root = path_1.join(
  Editor.App.path,
  "../resources/3d/engine/native"
);

exports.PATH = new Path();

exports.NATIVE_MODULES = [
  ["USE_VIDEO", "VideoPlayer"],
  ["USE_WEBVIEW", "WebView"],
  ["USE_EDIT_BOX", "EditorBox"],
  ["USE_AUDIO", "AudioSource"],
  ["USE_SPINE", "Spine Skeleton"],
  ["USE_DRAGONBONES", "DragonBones"],
  ["USE_SOCKET", "Native Socket"],
];

exports.cocos = cocos;
exports.clearDest = clearDest;
exports.outputJSBAdapter = outputJSBAdapter;
exports.compileJsbAdapter = compileJsbAdapter;
exports.checkLiteVersion = checkLiteVersion;
exports.createBundle = createBundle;
