Object.defineProperty(exports, "__esModule", { value: true });
exports.compressDirs = compressDirs;

const {
  readFileSync,
  writeFileSync,
  removeSync,
  readdirSync,
  statSync,
} = require("fs-extra");

const { parse, relative, join } = require("path");

const global_1 = require("../../../share/global");
const JsZip = require("jszip");
async function compressDirs(o, n, c) {
  await new Promise((r) => {
    const t = new JsZip();
    const s = [];
    const a = parse(global_1.BuildGlobalInfo.BUNDLE_ZIP_NAME).name;

    o.forEach((e) => {
      getFilesInDirectory(s, e);
    });

    const i = { date: new Date("2021.06.21 06:00:00Z"), createFolders: false };

    s.forEach((e) => {
      var r = relative(n, e);
      let s = join(a, r);
      s = s.replace(/\\/g, "/");
      t.file(s, readFileSync(e), i);
    });

    t.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    }).then((e) => {
      writeFileSync(c, e);

      o.forEach((e) => {
        removeSync(e);
      });

      r();
    });
  });
}
function getFilesInDirectory(r, s) {
  readdirSync(s).forEach((e) => {
    e = join(s, e);

    if (statSync(e).isDirectory()) {
      getFilesInDirectory(r, e);
    } else {
      r.push(e);
    }
  });
}
