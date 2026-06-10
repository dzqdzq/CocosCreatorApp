const packageJSON = require("../package.json");
const JSZip = require("jszip");
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
  "src",
];

function step(e, n, i, a) {
  i = i || basename(e);

  if (!skips.includes(i)) {
    var r = statSync(e);
    if (r.isDirectory()) {
      for (const s of readdirSync(e)) {
        step(join(e, s), a ? n : n.folder(i));
      }
    } else {
      if (r.isFile()) {
        n.file(i, readFileSync(e));
      } else {
        console.error(e + " was not added to zip!");
      }
    }
  }
}
function unpack() {
  var e = join(__dirname, "../../" + packageJSON.name);
  const n = join(e, `unpack/${packageJSON.name}.zip`);
  var i = new JSZip();
  step(e, i, packageJSON.name, true);

  i.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  }).then((e) => {
    writeFileSync(n, e);
  });
}
(async () => {
  unpack();
})();
