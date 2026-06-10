var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.fbxToGlTf = undefined;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const fbx2glTf_1 = require("../utils/fbx2glTf");
const tmp_1 = __importDefault(require("tmp"));
const utils_1 = require("../../utils");
async function fbxToGlTf(t, e, r) {
  e = e.options.temp;
  const a = path_1.join(e, "fbx2gltf-" + t.uuid);
  await fs_extra_1.default.ensureDir(a);
  var e = path_1.join(a, "out", "out.gltf");
  var i = path_1.join(a, "status.json");

  var r = {
    mtimeMs: (await fs_extra_1.default.stat(t.source)).mtimeMs,
    version: r,
  };

  try {
    if (await fs_extra_1.default.pathExists(i)) {
      if (
        isSameConversionStatus(
          JSON.parse((await fs_extra_1.default.readFile(i)).toString()),
          r
        ) &&
        (await fs_extra_1.default.pathExists(e))
      ) {
        return e;
      }
    }
  } catch (t) {
    console.debug("Failed to get conversion status file " + i);
  }

  if (await fs_extra_1.default.pathExists(a)) {
    await fs_extra_1.default.emptyDir(a);
  }

  let s = null;
  for (const u of [
    () => path_1.join(a, "fbm"),
    () => tmp_1.default.dirSync({ mode: 777, prefix: "fbm" }).name,
  ]) {
    var f = u();
    if (/^[\x00-\x7F]*$/.test(f)) {
      s = f;
      break;
    }
  }
  if (!s) {
    throw new Error(
      utils_1.i18nTranslate("asset-db.importers.fbx.no_available_fbx_temp_dir")
    );
  }
  await fs_extra_1.default.ensureDir(s);
  var o = ["--fbx-temp-dir", s];
  await fs_extra_1.default.ensureDir(path_1.dirname(e));
  await fbx2glTf_1.convert(t.source, e, o);

  if (fs_extra_1.default.existsSync(e)) {
    console.debug(t.source + " is converted to: " + e);
    await fs_extra_1.default.writeFile(i, JSON.stringify(r, undefined, 2));
    return e;
  }

  throw new Error(
    utils_1.i18nTranslate("asset-db.importers.fbx.failed_to_convert_fbx_file", {
      path: t.source,
    })
  );
}
function isSameConversionStatus(t, e) {
  return t.mtimeMs === e.mtimeMs && t.version === e.version;
}
exports.fbxToGlTf = fbxToGlTf;
