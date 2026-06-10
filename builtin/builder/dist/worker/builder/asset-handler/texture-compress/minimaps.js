Object.defineProperty(exports, "__esModule", { value: true });
exports.isPowerOfTwo = isPowerOfTwo;
exports.getMipLevel = getMipLevel;
exports.genMipmapFiles = genMipmapFiles;
exports.checkHasMipMaps = checkHasMipMaps;
exports.compressMipmapFiles = compressMipmapFiles;

const { dirname, extname, basename, join } = require("path");

const { existsSync, ensureDirSync, readFileSync } = require("fs-extra");

const Sharp = require("sharp");
function isPowerOfTwo(e) {
  return e > 0 && 0 == (e & (e - 1));
}
function getMipLevel(e, t) {
  let a = Math.max(e, t);
  let i = 0;

  while (a) {
    a >>= 1;
    i++;
  }

  return i;
}
async function genMipmapFiles(e, t, a) {
  var i = Sharp(e);
  var r = await i.metadata();
  if (!isPowerOfTwo(r.width) || !isPowerOfTwo(r.height)) {
    throw new Error(
      Editor.I18n.t("builder.project.texture_compress.mipmap.noPowerOfTwo")
    );
  }

  let { width, height } = r;

  t = t || dirname(e);
  var n = extname(e);
  var o = basename(e, n);
  var m = [];
  for (
    let e = getMipLevel(width, height);
    e > 0 && (width !== 1 || height !== 1);
    e--
  ) {
    width = Math.max(width / 2, 1);
    height = Math.max(height / 2, 1);
    var u = join(t, "mipmaps", o + "@mipmap_" + (e - 1) + n);
    m.push(u);

    if (!existsSync(u)) {
      ensureDirSync(dirname(u));
      await i.resize(width, height).toFile(u);
    }
  }
  return m;
}
function checkHasMipMaps(e) {
  let t;

  if (e.subMetas["6c48a"]) {
    t = e.subMetas["6c48a"].userData.mipfilter;
  } else if (e.userData.textureSetting) {
    t = e.userData.textureSetting.mipfilter;
  }

  return !!["nearest", "linear"].includes(t);
}
async function compressMipmapFiles(t, a) {
  if (
    !t.mipmapFiles ||
    !t.mipmapFiles.length ||
    ["png", "jpg", "webp"].includes(t.format)
  ) {
    return [];
  }
  console.debug("Start merge mipmaps file of asset " + t.uuid);
  var i = [];
  for (let e = 0; e < t.mipmapFiles.length; e++) {
    var r = t.mipmapFiles[e];

    var s = join(
      dirname(t.dest),
      "mipmaps",
      basename(r, extname(r)) + extname(t.dest)
    );

    await a({ ...t, src: r, dest: s });
    i.push(readFileSync(s));
  }
  console.debug(`Merge mipmaps file of asset ${t.uuid} success`);
  return i;
}
