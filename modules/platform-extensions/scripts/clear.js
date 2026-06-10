const join = require("path").join;
const {
  readdirSync,
  statSync,
  unlinkSync,
  rmdirSync,
  existsSync,
} = require("fs");
const builder = require("@editor/build");
function removeSync(n) {
  if (existsSync(n)) {
    (statSync(n).isDirectory()
      ? (readdirSync(n).forEach((e) => {
          removeSync(join(n, e));
        }),
        rmdirSync)
      : unlinkSync)(n);
  }
}
builder.scan(join(__dirname, "../extensions"));
const cacheFile = join(__dirname, ".build-cache.json");
builder.config({ entry: ".workflow.clear.js", config: cacheFile });

(async () => {
  console.log(
    [
      "================================================================================",
      "删除 node_moduels 文件夹",
    ].join("\n")
  );

  removeSync(join(__dirname, "../node_modules"));
  await builder.executeTask(["clear"]);
  removeSync(cacheFile);
  removeSync(join(__dirname, "../.temp"));
})();
