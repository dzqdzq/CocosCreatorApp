var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.packMods = packMods;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const concat_with_sourcemaps_1 = __importDefault(
  require("concat-with-sourcemaps")
);
async function packMods(e, t, a, r) {
  var r_sourceMaps = r.sourceMaps;
  var o = new concat_with_sourcemaps_1.default(true, "all.js", "\n");

  if (r.wrap) {
    o.add(
      null,
      "System.register([], function(_export, _context) { return { execute: function () {"
    );
  }

  for (const u of e) {
    o.add(null, u.code, u.map);
  }

  if (Object.keys(t).length !== 0) {
    o.add(
      null,
      `(function(r) {
${Object.keys(t)
  .map((e) => `  r('${e}', '${t[e]}');`)
  .join("\n")} 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});`
    );
  }

  if (r.wrap) {
    o.add(null, "} }; });");
  }

  if (r_sourceMaps && o.sourceMap) {
    if (r_sourceMaps === "inline") {
      e = Buffer.from(o.sourceMap).toString("base64");

      o.add(
        null,
        "//# sourceMappingURL=data:application/json;charset=utf-8;base64," + e
      );
    } else {
      o.add(null, `//# sourceMappingURL=${path_1.default.basename(a)}.map`);
    }
  }

  await fs_extra_1.default.ensureDir(path_1.default.dirname(a));
  await fs_extra_1.default.writeFile(a, o.content.toString());

  if (r_sourceMaps && o.sourceMap && r_sourceMaps !== "inline") {
    await fs_extra_1.default.writeFile(a + ".map", o.sourceMap);
  }
}
