var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.fbxToGlTf = fbxToGlTf;
const fs_extra_1 = __importDefault(require("fs-extra"));

const { join, dirname } = require("path");

const { convert } = require("../utils/fbx2glTf");

const tmp_1 = __importDefault(require("tmp"));

const { i18nTranslate } = require("../../utils");

async function fbxToGlTf(t, e, r) {
  e = e.options.temp;
  const a = join(e, "fbx2gltf-" + t.uuid);
  await fs_extra_1.default.ensureDir(a);
  var e = join(a, "out", "out.gltf");
  var i = join(a, "status.json");

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
  } catch {
    console.debug("Failed to get conversion status file " + i);
  }

  if (await fs_extra_1.default.pathExists(a)) {
    await fs_extra_1.default.emptyDir(a);
  }

  let s = null;
  for (const n of [
    () => join(a, "fbm"),
    () => tmp_1.default.dirSync({ mode: 777, prefix: "fbm" }).name,
  ]) {
    var f = n();
    if (/^[\x00-\x7F]*$/.test(f)) {
      s = f;
      break;
    }
  }
  if (!s) {
    throw new Error(
      i18nTranslate("engine-extends.importers.fbx.no_available_fbx_temp_dir")
    );
  }
  await fs_extra_1.default.ensureDir(s);
  var o = ["--fbx-temp-dir", s];
  await fs_extra_1.default.ensureDir(dirname(e));
  await convert(t.source, e, o);

  if (fs_extra_1.default.existsSync(e)) {
    console.debug(t.source + " is converted to: " + e);
    await fs_extra_1.default.writeFile(i, JSON.stringify(r, undefined, 2));
    return e;
  }

  throw new Error(
    i18nTranslate("engine-extends.importers.fbx.failed_to_convert_fbx_file", {
      path: t.source,
    })
  );
}
function isSameConversionStatus(t, e) {
  return t.mtimeMs === e.mtimeMs && t.version === e.version;
}
