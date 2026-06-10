const join = require("path").join;
const builder = require("@editor/build");
builder.scan(join(__dirname, "../extensions"));

builder.config({
  entry: ".workflow.build.js",
  config: join(__dirname, ".build-cache.json"),
});

builder.executeTask(["tsc", "lessc", "file", "compress"]);
