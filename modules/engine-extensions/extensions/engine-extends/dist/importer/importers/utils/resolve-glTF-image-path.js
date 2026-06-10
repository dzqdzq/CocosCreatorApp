var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGlTfImagePath = undefined;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
async function resolveGlTfImagePath(e, t, a, r, s) {
  if (t && (await fs_extra_1.default.pathExists(t))) {
    return t;
  }
  let n = "";
  let i = "";

  if (
    typeof r == "object" &&
    keyFbxGlTfConvImageExtras in r &&
    (console.debug(
      "Found FBX-glTF-conv specified extras: " +
        JSON.stringify(r[keyFbxGlTfConvImageExtras], undefined, 2)
    ),
    ({ fileName: r, relativeFileName: o } = r[keyFbxGlTfConvImageExtras]),
    o && (i = normalizePathInFbx(o)),
    r)
  ) {
    n = normalizePathInFbx(r);
  }

  if (i) {
    var o = path_1.default.join(a, i);
    if (await fs_extra_1.default.pathExists(o)) {
      return o;
    }
  }

  if (n && (await fs_extra_1.default.pathExists(n))) {
    return n;
  }
  console.debug(
    "Image" +
      `(Name: ${e}, Expected path: ${t})` +
      " is not found, fuzzy search starts."
  );
  var r = t ? path_1.default.extname(t) : "";
  var o = r.toLowerCase();
  var t = t ? path_1.default.basename(t, r) : "";
  var u = new Set();

  if (t.length !== 0) {
    u.add(t);
  }

  if (e) {
    u.add(e);
  }

  if (n) {
    u.add(path_1.default.basename(n, path_1.default.extname(n)));
  }

  if (i) {
    u.add(path_1.default.basename(i, path_1.default.extname(i)));
  }

  if (u.size !== 0) {
    var f = [".jpg", ".jpeg", ".png", ".tga", ".webp"];

    if (r.length !== 0 && !f.includes(o)) {
      f.unshift(o);
    }

    var l = ["textures", "materials"];

    const c = toNormalizedAbsolute(s);
    var d = Array.from(u);
    let t = toNormalizedAbsolute(a);
    for (let e = 0; e < 2 && t.startsWith(c); ++e) {
      var _ = await fuzzySearchTexture(t, d, f);
      if (_) {
        console.debug(`Found ${_}, use it.`);
        return _;
      }
      for (const p of await fs_extra_1.default.readdir(t)) {
        if (l.some((e) => caseInsensitiveStringEqual(p, e))) {
          var h = path_1.default.join(t, p);
          try {
            if (!(await fs_extra_1.default.stat(h)).isDirectory()) {
              continue;
            }
          } catch (e) {}
          h = await fuzzySearchTexture(h, d, f);
          if (h) {
            console.debug(`Found ${h}, use it.`);
            return h;
          }
        }
      }
      t = path_1.default.dirname(t);
    }
    console.debug("Fuzzy search failed.");
  }

  return null;
}
function toNormalizedAbsolute(e) {
  e = path_1.default.isAbsolute(e) ? e : path_1.default.join(process.cwd(), e);
  return path_1.default.normalize(e);
}
async function fuzzySearchTexture(e, t, a) {
  if (await fs_extra_1.default.pathExists(e)) {
    for (const i of await fs_extra_1.default.readdir(e)) {
      var r = path_1.default.extname(i);
      const o = path_1.default.basename(i, r);
      if (t.some((e) => caseInsensitiveStringEqual(o, e))) {
        var s = path_1.default.join(e, i);
        var n = await fs_extra_1.default.stat(s);
        if (n.isFile() && a.includes(r.toLowerCase())) {
          return s;
        }
      }
    }
  }
  return null;
}
function caseInsensitiveStringEqual(e, t) {
  return e.length === t.length && e.toLowerCase() === t.toLowerCase();
}
exports.resolveGlTfImagePath = resolveGlTfImagePath;
const keyFbxGlTfConvImageExtras = "FBX-glTF-conv";
function normalizePathInFbx(e) {
  return e.split(/[\\/]/g).join(path_1.default.sep);
}
