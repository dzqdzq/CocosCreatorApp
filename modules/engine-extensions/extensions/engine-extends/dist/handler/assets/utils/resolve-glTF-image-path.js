var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGlTfImagePath = resolveGlTfImagePath;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
async function resolveGlTfImagePath(e, t, a, r, s) {
  if (t && (await fs_extra_1.default.pathExists(t))) {
    return t;
  }
  let i = "";
  let n = "";

  if (
    typeof r == "object" &&
    keyFbxGlTfConvImageExtras in r &&
    (console.debug(
      "Found FBX-glTF-conv specified extras: " +
        JSON.stringify(r[keyFbxGlTfConvImageExtras], undefined, 2)
    ),
    ({ fileName: r, relativeFileName: o } = r[keyFbxGlTfConvImageExtras]),
    o && (n = normalizePathInFbx(o)),
    r)
  ) {
    i = normalizePathInFbx(r);
  }

  if (n) {
    var o = path_1.default.join(a, n);
    if (await fs_extra_1.default.pathExists(o)) {
      return o;
    }
  }

  if (i && (await fs_extra_1.default.pathExists(i))) {
    return i;
  }
  console.debug(
    "Image" +
      `(Name: ${e}, Expected path: ${t})` +
      " is not found, fuzzy search starts."
  );
  var r = t ? path_1.default.extname(t) : "";
  var o = r.toLowerCase();
  var t = t ? path_1.default.basename(t, r) : "";
  var f = new Set();

  if (t.length !== 0) {
    f.add(t);
  }

  if (e) {
    f.add(e);
  }

  if (i) {
    f.add(path_1.default.basename(i, path_1.default.extname(i)));
  }

  if (n) {
    f.add(path_1.default.basename(n, path_1.default.extname(n)));
  }

  if (f.size !== 0) {
    var l = [".jpg", ".jpeg", ".png", ".tga", ".webp"];

    if (r.length !== 0 && !l.includes(o)) {
      l.unshift(o);
    }

    var u = ["textures", "materials"];

    const x = toNormalizedAbsolute(s);
    var d = Array.from(f);
    let t = toNormalizedAbsolute(a);
    for (let e = 0; e < 2 && t.startsWith(x); ++e) {
      var _ = await fuzzySearchTexture(t, d, l);
      if (_) {
        console.debug(`Found ${_}, use it.`);
        return _;
      }
      for (const m of await fs_extra_1.default.readdir(t)) {
        if (u.some((e) => caseInsensitiveStringEqual(m, e))) {
          var c = path_1.default.join(t, m);
          try {
            if (!(await fs_extra_1.default.stat(c)).isDirectory()) {
              continue;
            }
          } catch {}
          c = await fuzzySearchTexture(c, d, l);
          if (c) {
            console.debug(`Found ${c}, use it.`);
            return c;
          }
        }
      }
      t = path_1.default.dirname(t);
    }
    var h = [];
    for (const g of l) {
      for (const v of d) {
        h.push(("" + v + g).toLowerCase());
      }
    }
    for (const b of listFile(a)) {
      var p = path_1.default.basename(b).toLowerCase();
      if (h.includes(p)) {
        return b;
      }
    }
    console.debug("Fuzzy search failed.");
  }

  return null;
}
function* listFile(e) {
  for (const r of fs_extra_1.default.readdirSync(e)) {
    var t = path_1.default.join(e, r);
    var a = fs_extra_1.default.statSync(t);

    if (a.isFile()) {
      yield t;
    } else if (a.isDirectory()) {
      yield* listFile(t);
    }
  }
}
function toNormalizedAbsolute(e) {
  e = path_1.default.isAbsolute(e) ? e : path_1.default.join(process.cwd(), e);
  return path_1.default.normalize(e);
}
async function fuzzySearchTexture(e, t, a) {
  if (await fs_extra_1.default.pathExists(e)) {
    for (const n of await fs_extra_1.default.readdir(e)) {
      var r = path_1.default.extname(n);
      const o = path_1.default.basename(n, r);
      if (t.some((e) => caseInsensitiveStringEqual(o, e))) {
        var s = path_1.default.join(e, n);
        var i = await fs_extra_1.default.stat(s);
        if (i.isFile() && a.includes(r.toLowerCase())) {
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
const keyFbxGlTfConvImageExtras = "FBX-glTF-conv";
function normalizePathInFbx(e) {
  return e.split(/[\\/]/g).join(path_1.default.sep);
}
