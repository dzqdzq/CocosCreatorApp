var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, s = r) => {
        var o = Object.getOwnPropertyDescriptor(t, r);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, s, o);
      }
    : (e, t, r, s) => {
        e[(s = s === undefined ? r : s)] = t[r];
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
  (() => {
    var o = (e) =>
      (o =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = o(e), s = 0; s < r.length; s++) {
          if (r[s] !== "default") {
            __createBinding(t, e, r[s]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.compressJpgAndPng = compressJpgAndPng;
exports.compressWebp = compressWebp;
exports.compressPVR = compressPVR;
exports.compressEtc = compressEtc;
exports.compressAstc = compressAstc;
exports.getCompressFunc = getCompressFunc;
exports.compressCustomFormat = compressCustomFormat;

const { ensureDirSync, existsSync } = require("fs-extra");

const { dirname } = require("path");

const Path = __importStar(require("path"));

const { roundToPowerOfTwo } = require("./utils");

const { quickSpawn } = require("../../utils");

const Sharp = require("sharp");
async function compressJpgAndPng(s) {
  return new Promise((e, t) => {
    let r = Sharp(s.src);

    r =
      s.format === "png"
        ? r.png({ quality: s.compressOptions.quality || 100 })
        : r.jpeg({ quality: s.compressOptions.quality || 100 });

    ensureDirSync(dirname(s.dest));

    r.toFile(s.dest)
      .then(() => {
        e();
      })
      .catch((e) => {
        t(e);
      });
  });
}
async function compressWebp(e) {
  var { src: e, dest, format, compressOptions } = e;
  ensureDirSync(dirname(dest));
  console.debug("start compress webp", e, dest, format);
  let o = Path.join(Editor.App.path, "../tools/libwebp_darwin/bin/cwebp");

  if (process.platform === "win32") {
    o = Path.join(Editor.App.path, "../tools/libwebp_win32/bin/cwebp.exe");
  }

  format = [
    e,
    "-o",
    dest,
    "-q",
    String(compressOptions.quality),
    "-quiet",
    "-exact",
  ];
  console.debug(`webp compress command : ${o} ` + format.join(" "));
  await quickSpawn(o, format, { prefix: "[compress webp]" });
  console.log("compress webp success " + `{link(${dest})}`);
}
async function compressPVR(e) {
  console.debug("start compress pvr", e);
  let e_src = e.src;

  if (e.format.endsWith("rgb_a")) {
    dest = Path.join(
      Editor.Project.tmpDir,
      "builder",
      "CompressTexture",
      "pvr_alpha",
      e.uuid + Path.extname(e_src)
    );

    await createAlphaAtlas(e_src, dest);
    e_src = dest;
  }

  var { dest, format, compressOptions } = e;
  ensureDirSync(dirname(dest));
  let a = Path.join(
    Editor.App.path,
    "../tools/PVRTexTool_darwin/PVRTexToolCLI"
  );

  if (process.platform === "win32") {
    a = Path.join(
      Editor.App.path,
      "../tools/PVRTexTool_win32/PVRTexToolCLI.exe"
    );
  }

  var c = {
    pvrtc_4bits_rgba: "PVRTC1_4",
    pvrtc_4bits_rgb: "PVRTC1_4_RGB",
    pvrtc_4bits_rgb_a: "PVRTC1_4_RGB",
    pvrtc_2bits_rgba: "PVRTC1_2",
    pvrtc_2bits_rgb: "PVRTC1_2_RGB",
    pvrtc_2bits_rgb_a: "PVRTC1_2_RGB",
  }[format];

  if (c) {
    compressOptions = "pvrtc" + compressOptions.quality;

    compressOptions = [
      "-i",
      e_src,
      "-o",
      dest,
      "-squarecanvas",
      "+",
      "-potcanvas",
      "+",
      "-q",
      compressOptions,
      "-f",
      c + ",UBN,lRGB",
    ];

    console.debug(
      `pvrtc compress command :  ${a} ` + compressOptions.join(" ")
    );

    await quickSpawn(a, compressOptions, {
      downGradeWaring: true,
      downGradeLog: true,
      ignoreError: true,
      downGradeError: true,
      prefix: "[compress pvrtc]",
    });

    existsSync(dest)
      ? console.log("compress pvrtc success " + `{link(${dest})}`)
      : console.error(
          Editor.I18n.t("builder.error.texture_compress_failed", {
            type: format,
            asset: `{asset(${e.uuid})}`,
            toolsPath: `{file(${a})}`,
            toolHomePage: "https://developer.imaginationtech.com/pvrtextool/",
          })
        );
  } else {
    console.error("Invalid pvr compress format " + format);
  }
}
async function compressEtc(e) {
  var { dest, format, compressOptions, uuid } = e;
  console.debug("start compress etc", e.src, dest, format);
  let e_src = e.src;

  ensureDirSync(dirname(dest));

  if (format.endsWith("rgb_a")) {
    e = Path.join(
      Editor.Project.tmpDir,
      "builder",
      "CompressTexture",
      "etc_alpha",
      uuid,
      Path.basename(dest, Path.extname(dest)) + Path.extname(e_src)
    );

    await createAlphaAtlas(e_src, e);
    e_src = e;
  }

  let c = Path.join(Editor.App.path, "../tools/mali_darwin/etcpack");

  if (process.platform === "win32") {
    c = Path.join(Editor.App.path, "../tools/mali_win32/etcpack.exe");
  }

  var e = Path.dirname(c);

  var { etcFormat, compressFormat } =
    ((c = "." + Path.sep + Path.basename(c)),
    {
      etc1_rgb: { etcFormat: "etc1", compressFormat: "RGB" },
      etc1_rgb_a: { etcFormat: "etc1", compressFormat: "RGB" },
      etc2_rgba: { etcFormat: "etc2", compressFormat: "RGBA" },
      etc2_rgb: { etcFormat: "etc2", compressFormat: "RGB" },
    }[format]);

  var compressOptions = [
    Path.normalize(e_src),
    Path.dirname(dest),
    "-c",
    etcFormat,
    "-s",
    compressOptions.quality,
  ];
  var p = e;
  var m = Object.assign({}, process.env);

  var e =
    ((m.PATH = e + ":" + m.PATH), { cwd: p, env: m, prefix: "[compress etc]" });

  if (etcFormat === "etc2") {
    compressOptions.push("-f", compressFormat);
  }

  console.debug(`etc compress command :  ${c} ` + compressOptions.join(" "));
  await quickSpawn(c, compressOptions, e);

  if (existsSync(dest)) {
    console.log("compress etc success " + `{link(${dest})}`);
  } else {
    console.error(
      Editor.I18n.t("builder.error.texture_compress_failed", {
        type: format,
        asset: `{asset(${uuid})}`,
        toolsPath: `{file(${c})}`,
        toolHomePage:
          "https://imagemagick.org/script/command-line-processing.php",
      })
    );
  }
}
async function compressAstc(e) {
  var { src, dest, format, compressOptions } = e;
  console.debug("start compress astc", src, dest, format);
  ensureDirSync(dirname(dest));
  let a = Path.join(Editor.App.path, "../tools/astc-encoder/astcenc");

  if (process.platform === "win32") {
    a = Path.join(Editor.App.path, "../tools/astc-encoder/astcenc.exe");
  }

  var c = {
    astc_4x4: "4x4",
    astc_5x5: "5x5",
    astc_6x6: "6x6",
    astc_8x8: "8x8",
    astc_10x5: "10x5",
    astc_10x10: "10x10",
    astc_12x12: "12x12",
  }[format];

  if (compressOptions.quality === "veryfast") {
    compressOptions.quality = "fastest";
  }

  var src = ["-cl", src, dest, c, "-" + compressOptions.quality];
  console.debug(
    `astc compressed command: ${Path.basename(a)} ` + src.join(" ")
  );
  await quickSpawn(a, src, { prefix: "[compress astc]" });

  if (existsSync(dest)) {
    console.log("Compress astc success " + `{link(${dest})}`);
  } else {
    console.error(
      Editor.I18n.t("builder.error.texture_compress_failed", {
        type: format,
        asset: `{asset(${e.uuid})}`,
        toolsPath: `{file(${a})}`,
        toolHomePage: "https://github.com/ARM-software/astc-encoder",
      })
    );
  }
}
function getCompressFunc(e) {
  switch (e.slice(0, 3)) {
    case "jpg":
    case "png": {
      return compressJpgAndPng;
    }
    case "pvr": {
      return compressPVR;
    }
    case "etc": {
      return compressEtc;
    }
    case "web": {
      return compressWebp;
    }
    case "ast": {
      return compressAstc;
    }
  }
}
function patchCommand(e, t) {
  return new Function(
    "options",
    "with(options){ return String.raw`" + e + "`}"
  )(t);
}
async function compressCustomFormat(e) {
  var { src, dest, compressOptions } = e;
  var { command: e, path } = e.customConfig;
  var path = Editor.UI.__protected__.File.resolveToRaw(path);
  var a = { cwd: Path.dirname(path), prefix: "[custom compress]" };
  var e = patchCommand(e, { ...compressOptions, src: src, dest: dest });

  var compressOptions = e.split(" ").filter((e) => !!e);

  console.debug(`custom compress command : ${path} ` + e);
  await quickSpawn(path, compressOptions, a);
}
async function createAlphaAtlas(e, t) {
  var e = new Sharp(e);
  var r = await e.metadata();

  var { width, height } = r;

  var r = roundToPowerOfTwo(width);
  let a = roundToPowerOfTwo(height);

  if (a < r / 2) {
    a = r / 2;
  }

  var c = await e.raw().toBuffer();
  var r = 2 * width * a * 3;
  var n = Buffer.alloc(r, 0);
  for (let t = 0; t < height; t++) {
    for (let e = 0; e < width; e++) {
      var i = t * width + e;
      var p = 4 * i;
      n[(i = 3 * i)] = c[p];
      n[1 + i] = c[1 + p];
      n[2 + i] = c[2 + p];
      i = 3 + p;
      n[(p = 3 * ((t + a) * width + e))] = c[i];
      n[1 + p] = c[i];
      n[2 + p] = c[i];
    }
  }
  e = { raw: { width: width, height: 2 * a, channels: 3 } };
  ensureDirSync(Path.dirname(t));
  await Sharp(n, e).toFile(t);
}
