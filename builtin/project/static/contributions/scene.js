const { existsSync, readFile } = require("fs-extra");
const join = require("path").join;
const decodeCCONBinary = require("cc/editor/serialization").decodeCCONBinary;
const deserialize = require("cc").deserialize;
exports.load = () => {};
exports.unload = () => {};

exports.methods = {
  async queryAnimationState(e) {
    const i = join(Editor.Project.path, "library", e.substr(0, 2), e);
    var e = i + ".json";
    return existsSync(e)
      ? ((e = await readFile(e, "utf8")),
        {
          sample: (e = deserialize(e)).sample,
          duration: e.duration,
          hash: e.hash,
        })
      : (e = [".bin", ".cconb"].find((e) => existsSync(i + e)))
      ? ((e = await readFile(i + e)),
        (e = decodeCCONBinary(e)),
        {
          sample: (e = deserialize(e)).sample,
          duration: e.duration,
          hash: e.hash,
        })
      : null;
  },
};
