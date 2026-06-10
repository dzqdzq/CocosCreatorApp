var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTGA = convertTGA;
exports.convertImageToHDR = convertImageToHDR;
exports.convertPSD = convertPSD;
exports.convertTIFF = convertTIFF;
exports.convertHDROrEXR = convertHDROrEXR;
exports.convertHDR = convertHDR;
exports.convertWithCmft = convertWithCmft;
const path_1 = require("path");

const { join, dirname, basename, normalize } = path_1;

const pngjs_1 = require("pngjs");
const tga_js_1 = __importDefault(require("tga-js"));

const { ensureDirSync, existsSync } = require("fs-extra");

const psd_js_1 = __importDefault(require("psd.js"));
const sharp_1 = __importDefault(require("sharp"));
async function convertTGA(t) {
  var e = new tga_js_1.default();
  var t = (e.load(t), e.getImageData());
  var e = new pngjs_1.PNG({ width: t.width, height: t.height });
  e.data = Buffer.from(t.data);
  return savePNGObject(e);
}
async function convertImageToHDR(t, e, r) {
  r = join(r, e + ".hdr");
  ensureDirSync(dirname(r));
  let n = join(Editor.App.path, "../tools/mali_darwin/convert");

  if (process.platform === "win32") {
    n = join(Editor.App.path, "../tools/mali_win32/convert.exe");
  }

  var e = dirname(n);
  n = "." + path_1.sep + basename(n);
  var a = Object.assign({}, process.env);
  a.PATH = e + ":" + a.PATH;

  await Editor.Utils.Process.quickSpawn(n, [normalize(t), normalize(r)], {
    cwd: e,
    env: a,
  });

  return { extName: ".hdr", source: r };
}
async function convertPSD(t) {
  t = new psd_js_1.default(t);
  t.parse();
  t = t.image.toPng();
  return savePNGObject(t);
}
async function convertTIFF(t) {
  return new Promise((e, r) => {
    (0, sharp_1.default)(t)
      .png()
      .toBuffer()
      .then((t) => {
        e({ extName: ".png", data: t });
      })
      .catch((t) => r(t));
  });
}
async function savePNGObject(n) {
  return new Promise((t, e) => {
    const r = [];

    n.on("data", (t) => {
      r.push(t);
    });

    n.on("end", () => {
      t({ extName: ".png", data: Buffer.concat(r) });
    });

    n.on("error", (t) => {
      e(t);
    });

    n.pack();
  });
}
async function convertHDROrEXR(t, e, r, n) {
  console.debug(`Start to convert asset {asset[${r}](${r})}`);
  var a = join(n, r);
  ensureDirSync(n);

  if (t === ".hdr") {
    return convertWithCmft(e, a);
  }

  if (t === ".exr") {
    try {
      return await convertWithCmft(e, a, "_withexr");
    } catch (t) {
      return convertWithCmft((await convertImageToHDR(e, r, n)).source, a);
    }
  }
}
async function convertHDR(t, e, r) {
  console.debug(`Start to convert asset {asset[${e}](${e})}`);
  e = join(r, e);
  ensureDirSync(r);
  return convertWithCmft(t, e);
}
async function convertWithCmft(t, e, r = "") {
  let n = join(
    Editor.App.path,
    "../tools/cmft/cmftRelease64" +
      r +
      (process.platform === "win32" ? ".exe" : "")
  );

  if (!existsSync(n)) {
    n = join(
      Editor.App.path,
      "../tools/cmft/cmftRelease64" +
        (process.platform === "win32" ? ".exe" : "")
    );
  }

  await Editor.Utils.Process.quickSpawn(n, [
    "--bypassoutputtype",
    "--output0params",
    "png,rgbm,latlong",
    "--input",
    t,
    "--output0",
    e,
  ]);

  console.debug(`Convert asset${t} -> PNG success.`);
  return { extName: ".png", source: e + ".png" };
}
