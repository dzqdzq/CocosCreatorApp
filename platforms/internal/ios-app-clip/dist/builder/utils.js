var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        Object.defineProperty(e, i, {
          enumerable: true,
          get() {
            return t[r];
          },
        });
      }
    : (e, t, r, i) => {
        e[(i = i === undefined ? r : i)] = t[r];
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
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var r in e) {
        if (r !== "default" && Object.prototype.hasOwnProperty.call(e, r)) {
          __createBinding(t, e, r);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

Object.defineProperty(exports, "__esModule", { value: true });

exports.findXcodeProjects = undefined;
exports.getBrowserslistQuery = undefined;
exports.createBundle = undefined;
exports.outputJSBAdapter = undefined;

const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const Editor = __importStar(require("editor"));
const babelify = require("babelify");
const browserify = require("browserify");
async function outputJSBAdapter(e, t) {
  var t = (t || {}).targets;

  var r = path_1.join(
    Editor.App.path,
    "../resources/3d/jsb-adapter/builtin/index.js"
  );

  var i = path_1.join(
    Editor.App.path,
    "../resources/3d/jsb-adapter/engine/index.js"
  );

  await createBundle(r, path_1.join(e, "jsb-adapter", "jsb-builtin.js"), {
    targets: t,
  });

  await createBundle(i, path_1.join(e, "jsb-adapter", "jsb-engine.js"), {
    targets: t,
  });
}
async function createBundle(e, n, t) {
  let r;
  let s;

  if (Array.isArray(t)) {
    r = t;
  } else if (t) {
    r = t.excludes;
    s = t.targets;
  }

  let a = browserify(e);

  if (r) {
    r.forEach((e) => {
      a.exclude(e);
    });
  }

  await fs_extra_1.ensureDir(path_1.dirname(n));

  return new Promise((r, i) => {
    a.transform(babelify, {
      presets: [[require("@babel/preset-env"), { targets: s }]],
    }).bundle((e, t) => {
      if (e) {
        console.error(e);
        i(e);
      } else {
        fs_extra_1.writeFileSync(n, t, "utf8");
        r();
      }
    });
  });
}
async function getBrowserslistQuery(e) {
  e = path_1.join(e, ".browserslistrc");
  let t;
  try {
    t = await fs_extra_1.readFile(e, "utf8");
  } catch (e) {
    return;
  }
  e = ((e) => {
    var t = [];
    for (const i of e.split("\n")) {
      var r = i.indexOf("#");
      var r = (r < 0 ? i : i.substr(0, r)).trim();

      if (r.length !== 0) {
        t.push(r);
      }
    }
    return t;
  })(t);
  if (e.length !== 0) {
    return e.join(" or ");
  }
}
function findXcodeProjects(e) {
  return fs_extra_1.readdirSync(e).filter((e) => e.endsWith(".xcodeproj"));
}
exports.outputJSBAdapter = outputJSBAdapter;
exports.createBundle = createBundle;
exports.getBrowserslistQuery = getBrowserslistQuery;
exports.findXcodeProjects = findXcodeProjects;
