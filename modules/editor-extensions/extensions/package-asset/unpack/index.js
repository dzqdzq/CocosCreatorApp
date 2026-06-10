const PackageJSON = require("../package.json");
const JSZip = require("../lib/jszip.min");
const { join, basename } = require("path");
const {
  writeFileSync,
  readdirSync,
  statSync,
  readFileSync,
} = require("fs-extra");

const skips = [
  ".idea",
  "unpack",
  ".DS_Store",
  ".git",
  ".idea",
  ".gitignore",
  "source",
];

function step(e, i, n, a) {
  n = n || basename(e);

  if (!skips.includes(n)) {
    var r = statSync(e);
    if (r.isDirectory()) {
      for (const s of readdirSync(e)) {
        step(join(e, s), a ? i : i.folder(n));
      }
    } else {
      if (r.isFile()) {
        i.file(n, readFileSync(e));
      } else {
        console.error(e + " was not added to zip!");
      }
    }
  }
}
function unpack() {
  var e = join(__dirname, "../..", PackageJSON.name);
  const i = join(e, "unpack", PackageJSON.name + ".zip");
  var n = new JSZip();
  step(e, n, PackageJSON.name, true);

  n.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  }).then((e) => {
    writeFileSync(i, e);
  });
}
(async () => {
  unpack();
})();
