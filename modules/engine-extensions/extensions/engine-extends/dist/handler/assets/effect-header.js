Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectHeaderHandler = undefined;

const { readdirSync, statSync, readFileSync } = require("fs-extra");

const { join, basename, relative, dirname, extname } = require("path");

const { addChunk } = require("../../../static/effect-compiler");

const effect_1 = require("./effect");

const builtinChunkDir = join(
  Manager.AssetInfo.engine,
  "./editor/assets/chunks"
);

const builtinChunks = (() => {
  const a = [];

  (function r(n) {
    readdirSync(n).forEach((e) => {
      var t = join(n, e);

      if (/\.chunk$/.test(e)) {
        a.push(t);
      } else if (statSync(t).isDirectory()) {
        r(t);
      }
    });
  })(builtinChunkDir);

  return a;
})();

for (let e = 0; e < builtinChunks.length; ++e) {
  const h = basename(builtinChunks[e], ".chunk");
  const i = readFileSync(builtinChunks[e], { encoding: "utf8" });
  addChunk(h, i);
}
const migrations = [
  { version: "1.0.1", migrate: effect_1.migrateDefines },
  { version: "1.0.2", migrate: effect_1.migrateEnableDirShadow },
  { version: "1.0.3", migrate: effect_1.migrateIncludeDecodeBase },
  { version: "1.0.4", migrate: effect_1.migrateMacroUseLightMap },
  { version: "1.0.5", migrate: effect_1.migrateChunkFolders },
  { version: "1.0.6", migrate: effect_1.migrateCSMInclude },
  { version: "1.0.7", migrate: effect_1.migrateMacroUseBatching },
];

exports.EffectHeaderHandler = {
  name: "effect-header",
  assetType: "",
  createInfo: {
    generateMenuInfo() {
      return [
        {
          label: "i18n:ENGINE.assets.newChunk",
          fullFileName: "chunk.chunk",
          template: `db://internal/default_file_content/${exports.EffectHeaderHandler.name}/chunk`,
        },
      ];
    },
  },
  importer: {
    version: "1.0.7",
    migrations,
    async import(e) {
      try {
        var t = e._assetDB.options.target;

        var r = relative(join(t, "chunks"), dirname(e.source)).replace(
          /\\/g,
          "/"
        );

        var n =
          r + (r.length ? "/" : "") + basename(e.source, extname(e.source));

        var a = readFileSync(e.source, { encoding: "utf-8" });
        addChunk(n, a);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
  },
};

exports.default = exports.EffectHeaderHandler;
