Object.defineProperty(exports, "__esModule", { value: true });
exports.packToolHandler = undefined;
exports.clearDest = clearDest;
exports.compileJsbAdapter = compileJsbAdapter;
exports.generateJsbAdapter = generateJsbAdapter;
exports.checkLiteVersion = checkLiteVersion;
exports._createBundle = _createBundle;
exports.acceptChineseName = acceptChineseName;
exports.checkName = checkName;

const {
  remove,
  existsSync,
  readJSON,
  readdirSync,
  statSync,
  ensureDir,
  writeFileSync,
} = require("fs-extra");

const { join, dirname } = require("path");

const babelify = require("babelify");
const browserify = require("browserify");
async function clearDest(e) {
  try {
    await remove(join(e, "data"));
  } catch (e) {
    console.error(e);
  }
}
async function compileJsbAdapter() {
  var e;

  var t = (await Editor.Message.request("engine", "query-engine-info"))
    .typescript;

  var a = join(t.path, "platforms/native");
  var t = join(t.path, "bin/.cache/dev/native-preview-adapter");

  if (hasChanged(a, t)) {
    e = join(a, "builtin/index.js");
    a = join(a, "engine/index.js");

    await _createBundle(e, join(t, "web-adapter.js"), {
      targets: "chrome 80",
    });

    await _createBundle(a, join(t, "engine-adapter.js"), {
      targets: "chrome 80",
    });
  }
}
async function generateJsbAdapter(e, t) {
  var e = join(e, "platforms/native");
  var a = join(e, "builtin/index.js");
  var e = join(e, "engine/index.js");

  await _createBundle(a, join(t, "web-adapter.js"), {
    targets: "chrome 80",
  });

  await _createBundle(e, join(t, "engine-adapter.js"), {
    targets: "chrome 80",
  });
}
async function checkLiteVersion(e) {
  e = join(e, ".cocos-project.json");

  if (existsSync(e)) {
    (await readJSON(e)).engine_version;
  } else {
    console.error(`Can't find project json [{link(${e})}]`);
  }
}
function checkFileStat(a, i) {
  return readdirSync(a).some((e) => {
    var e = join(a, e);
    var t = statSync(e);
    return t.isDirectory()
      ? checkFileStat(e, i)
      : t.mtime.getTime() > i || undefined;
  });
}
function hasChanged(e, t) {
  var a;
  var i;
  return (
    !existsSync(t) ||
    ((i = join(t, "web-adapter.js")),
    (a = join(t, "engine-adapter.js")),
    !existsSync(i)) ||
    !existsSync(a) ||
    ((i = statSync(t)), checkFileStat(dirname(e), i.mtime.getTime()))
  );
}
async function _createBundle(e, r, t) {
  let a;
  let n;

  if (Array.isArray(t)) {
    a = t;
  } else if (t) {
    a = t.excludes;
    n = t.targets;
  }

  const s = browserify(e);

  if (a) {
    a.forEach((e) => {
      s.exclude(e);
    });
  }

  await ensureDir(dirname(r));

  return new Promise((a, i) => {
    s.transform(babelify, {
      presets: [[require("@babel/preset-env"), { targets: n }]],
    }).bundle((e, t) => {
      if (e) {
        console.error(e);
        i(e);
      } else {
        writeFileSync(r, t, "utf8");
        a();
      }
    });
  });
}
class PackToolHandler {
  _init = false;
  packRoot;
  manager;
  get ready() {
    return this._init;
  }
  async init(e, t) {
    if (!this._init || t) {
      e =
        e ||
        (await Editor.Message.request("engine", "query-engine-info")).typescript
          .path;

      this.packRoot = join(e, "scripts", "native-pack-tool");
      this.manager = require(join(
        this.packRoot,
        "dist/index"
      )).nativePackToolMg;
      this._init = true;
    }
  }
  async getProjectBuildPath(e) {
    return this._init ? e?.projectDistPath : "";
  }
  async initPackTool(e) {
    await this.init(e.enginePath);
    return this.manager.init(e);
  }
  async runTask(e, t) {
    await this.initPackTool(t);
    return this.manager[e](t.platform);
  }
  async openWithIDE(e, t, a) {
    await this.init();
    return this.manager.openWithIDE(e, t, a);
  }
}
function acceptChineseName(e) {
  return ["mac", "ios", "windows", "android"].includes(e.platform);
}
function checkName(e, t) {
  return (
    acceptChineseName(t) ? /^[\u4e00-\u9fa5A-Za-z0-9-_]+$/ : /^[A-Za-z0-9-_]+$/
  ).test(e);
}
exports.packToolHandler = new PackToolHandler();
