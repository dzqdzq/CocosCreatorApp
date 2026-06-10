var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPixels = readPixels;
exports.flipImage = flipImage;
exports.saveDataToImage = saveDataToImage;
const cc_1 = require("cc");

const { existsSync, mkdirSync } = require("fs-extra");

const sharp_1 = __importDefault(require("sharp"));

const { join } = require("path");

function readPixels(e) {
  var t;
  var r;
  var a;
  var s;

  var { width, height } = e;

  var width = new Uint8Array(4 * width * height);
  var height = e.getGFXTexture();
  return height
    ? ((t = cc_1.gfx.deviceManager.gfxDevice),
      (r = []),
      (a = []),
      ((s = new cc_1.gfx.BufferTextureCopy()).texOffset.x = 0),
      (s.texOffset.y = 0),
      (s.texExtent.width = e.width),
      (s.texExtent.height = e.height),
      a.push(s),
      r.push(width),
      t?.copyTextureToBuffers(height, r, a),
      width)
    : null;
}
function flipImage(r, a, s) {
  if (!r) {
    return null;
  }
  var i = new Uint8Array(r.length);
  for (let t = 0; t < s; t++) {
    for (let e = 0; e < a; e++) {
      var n = 4 * (a * t + e);
      var u = 4 * (a * (s - t - 1) + e);
      i[u] = r[n];
      i[1 + u] = r[1 + n];
      i[2 + u] = r[2 + n];
      i[3 + u] = r[3 + n];
    }
  }
  return i;
}
async function saveDataToImage(a, s, i, n, u) {
  let f;
  await new Promise(async (e, t) => {
    var r = await Editor.Message.request(
      "asset-db",
      "query-path",
      "db://assets"
    );

    if (r !== null) {
      r = join(r, n);
      existsSync(r) || mkdirSync(r);
      f = join(r, u);

      (0, sharp_1.default)(a, { raw: { width: s, height: i, channels: 4 } })
        .toFile(f)
        .then(async () => {
          e();
        })
        .catch((e) => {
          t(e);
        });
    }
  });
}
