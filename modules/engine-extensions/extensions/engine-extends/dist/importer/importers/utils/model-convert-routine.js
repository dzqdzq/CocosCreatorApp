var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelConvertRoutine = undefined;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
async function modelConvertRoutine(t, e, a, i, r) {
  var a = path_1.default.join(a.options.temp, t, e.uuid);

  await fs_extra_1.default.ensureDir(a);
  var t = (await fs_extra_1.default.stat(e.source)).mtimeMs;

  var u = path_1.default.join(a, "status.json");
  let o;
  try {
    o = await fs_extra_1.default.readJson(u);
  } catch (t) {
    console.debug(`Status file ${u}: ` + t);
  }
  var a = path_1.default.join(a, "output");
  await fs_extra_1.default.ensureDir(a);
  var r_options = r.options;
  if (
    !(
      o !== undefined &&
      o.version === i &&
      o.sourceTimeStamp === t &&
      validateOptions(r_options, o.options) &&
      (await isOutputTimeStampsAvailable(a, o.outputTimeStamps))
    )
  ) {
    await fs_extra_1.default.emptyDir(a);

    if (!(await r.convert(e, a))) {
      return;
    }

    var n = {};

    await getMtimeTree(a, n);
    var i = {
      version: i,
      sourceTimeStamp: t,
      outputTimeStamps: n,
      options: r_options,
    };

    await fs_extra_1.default.ensureDir(path_1.default.dirname(u));
    await fs_extra_1.default.writeJson(u, i, { spaces: 2 });
  }
  await (null == (t = r.printLogs) ? undefined : t.call(r, e, a));
  return r.get(e, a);
}
async function getMtimeTree(i, r, u = undefined) {
  var t = await fs_extra_1.default.readdir(i);
  await Promise.all(
    t.map(async (t) => {
      var e = path_1.default.join(i, t);
      var a = await fs_extra_1.default.stat(e);
      var t = u ? u + "/" + t : t;

      if (a.isFile()) {
        r[t] = a.mtimeMs;
      } else if (a.isDirectory()) {
        await getMtimeTree(e, r, t);
      }
    })
  );
}
async function isOutputTimeStampsAvailable(a, t) {
  return (
    await Promise.all(
      Object.entries(t).map(async ([t, e]) => {
        t = path_1.default.join(a, path_1.default.join(...t.split("/")));
        try {
          return (await fs_extra_1.default.stat(t)).mtimeMs === e;
        } catch (t) {
          return false;
        }
      })
    )
  ).every((t) => t);
}
function validateOptions(t, e) {
  return matchObject(t, e);
}
function matchObject(t, e) {
  return (function a(e, i) {
    return Array.isArray(e)
      ? Array.isArray(i) &&
          e.length === i.length &&
          e.every((t, e) => a(t, i[e]))
      : typeof e == "object" && e !== null
      ? typeof i == "object" &&
        i !== null &&
        Object.keys(e).every((t) => a(e[t], i[t]))
      : e === null
      ? i === null
      : e === i;
  })(t, e);
}
exports.modelConvertRoutine = modelConvertRoutine;
