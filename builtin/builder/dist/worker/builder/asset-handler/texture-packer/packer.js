Object.defineProperty(exports, "__esModule", { value: true });
exports.packer = packer;

const { ensureDirSync } = require("fs-extra");

const { join } = require("path");

const config_1 = require("./config");
const pac_info_1 = require("./pac-info");
const Algorithm = require("./algorithm");
const Sharp = require("sharp");
const applyBleed = require("./bleeding").applyBleed;
async function packer(t, e) {
  var a = filterUnpacked(t);

  console.debug("Start trim sprite image ...");
  await trimImages(a.result);
  console.debug("determine atlas size...");
  var r = determineAtlasSize(a.result, e);

  var a = Array.from(a.unpackedImages.concat(r.unpackedImages));
  console.debug("Start generate atlas image...");

  await Promise.all(r.packAtlas.map((t) => generateAtlas(t, e)));

  return {
    atlases: r.packAtlas.map((t) => t.toJSON()),
    unpackedImages: a.map((t) => ({
      imageUuid: t.uuid,
      libraryPath: t._file,
    })),
    pacUuid: t[0]._pacUuid,
  };
}
function determineAtlasSize(t, r) {
  const i = t.concat();
  var o = [];
  let n = [];
  let h = Algorithm[r.algorithm];

  if (!h) {
    console.warn(
      `determineAtlasSize failed: Can not find algorithm ${r.algorithm}, use MaxRects`
    );

    h = Algorithm.MaxRects;
  }

  var { maxWidth, maxHeight, allowRotation } = r;

  let c = 0;

  while (i.length > 0) {
    var p = h(i, maxWidth, maxHeight, allowRotation);
    if (p.length === 0) {
      n = n.concat(i);
      break;
    }
    p.forEach((t) => {
      i.splice(i.indexOf(t), 1);
    });
    let e = 0;
    let a = 0;
    for (let t = 0; t < p.length; t++) {
      var g = p[t];

      g.rotatedWidth = g.rotated ? g.height : g.width;
      g.rotatedHeight = g.rotated ? g.width : g.height;
      g.trim.rotatedWidth = g.rotated ? g.trim.height : g.trim.width;
      g.trim.rotatedHeight = g.rotated ? g.trim.width : g.trim.height;
      var m = g.x + g.rotatedWidth;

      var g = g.y + g.rotatedHeight;

      if (m > e) {
        e = m;
      }

      if (g > a) {
        a = g;
      }
    }
    var u = r.name + "-" + c;
    c++;
    var f = join(r.destDir, u + "." + r.format);
    o.push(new pac_info_1.AtlasInfo(p, e, a, u, f));
  }

  o.forEach((t) => {
    applySquareAndPowerConstraints(t, r.forceSquared, r.powerOfTwo);

    t.spriteFrameInfos.forEach((t) => {
      t.trim.x = t.x + r.padding + r.bleed;
      t.trim.y = t.y + r.padding + r.bleed;
    });
  });

  return { packAtlas: o, unpackedImages: n };
}
function applySquareAndPowerConstraints(t, e, a) {
  if (e) {
    t.width = t.height = Math.max(t.width, t.height);
  }

  if (a) {
    t.width = roundToPowerOfTwo(t.width);
    t.height = roundToPowerOfTwo(t.height);
  }
}
function roundToPowerOfTwo(t) {
  if (typeof t != "number") {
    return 0;
  }
  let e = 2;

  while (t > e) {
    e *= 2;
  }

  return e;
}
function filterUnpacked(t) {
  const e = [];
  t = t.filter(
    (t) =>
      (t.trim.width > 0 && t.trim.height > 0) ||
      ((t.width = t.rawWidth), (t.height = t.rawHeight), e.push(t), false)
  );
  return { unpackedImages: e, result: t };
}
async function generateAtlas(t, e) {
  var { spriteFrameInfos, width, height } = t;

  var o = { raw: { width: width, height: height, channels: 4 } };
  let n = await Sharp({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: { r: 0, b: 0, g: 0, alpha: 0 },
    },
  }).toBuffer();
  let h = 0;
  let l = 0;
  let d = [];
  for (let t = 0; t < spriteFrameInfos.length; t++) {
    var s = spriteFrameInfos[t];
    var c = s.trim.x;
    var p = s.trim.y;
    const width = s.trim.width;
    const height = s.trim.height;
    h += width * height * 4;
    l++;
    try {
      if (h >= 2097152 || l >= 100) {
        n = await Sharp(n, o).composite(d).toBuffer();
        d = [];
        h = 0;
        l = 0;
      }

      let t = Sharp(s._libraryPath);
      var g = await (t = s.rotated ? t.rotate(90) : t).toBuffer();
      d.push({ input: g, left: c, top: p });
    } catch (t) {
      console.error(
        `Handle image [${s._libraryPath} error]. 
 Origin path is [${s.originalPath}:${s.name}]. 
 Error : ` + t.toString()
      );
      continue;
    }
  }
  n = await Sharp(n, o).composite(d).toBuffer();

  if (e.contourBleed || e.paddingBleed) {
    applyBleed(e, t, n, n);
  }

  await Sharp(n, o).png().toFile(t.imagePath);
}
async function trimImages(t) {
  const a = join(config_1.buildTempDir, "trimImages");
  ensureDirSync(a);

  await Promise.all(
    t.map((e, t) => {
      e.originalPath = e._libraryPath;

      e._libraryPath = join(
        a,
        "spritesheet_js_" + e.uuid + "_image_" + t++ + ".png"
      );

      t = e.trim;

      t = Sharp(e.originalPath).extract({
        left: t.x,
        top: t.y,
        width: t.rotatedWidth,
        height: t.rotatedHeight,
      });

      if (e.rotated) {
        t.rotate(270);
      }

      return t.toFile(e._libraryPath).catch((t) => {
        console.error(`trimImages(${e.originalPath}) failed!`);
        throw t;
      });
    })
  );
}
