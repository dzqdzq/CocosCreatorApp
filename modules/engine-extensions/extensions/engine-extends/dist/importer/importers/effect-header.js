Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectHeaderImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const effect_compiler_1 = require("../../../static/effect-compiler");
const effect_1 = require("./effect");

const builtinChunkDir = path_1.join(
  Manager.AssetInfo.engine,
  "./editor/assets/chunks"
);

const builtinChunks = (() => {
  const a = [];

  (function r(i) {
    fs_extra_1.readdirSync(i).forEach((e) => {
      var t = path_1.join(i, e);

      if (/\.chunk$/.test(e)) {
        a.push(t);
      } else if (fs_extra_1.statSync(t).isDirectory()) {
        r(t);
      }
    });
  })(builtinChunkDir);

  return a;
})();

for (let e = 0; e < builtinChunks.length; ++e) {
  const h = path_1.basename(builtinChunks[e], ".chunk");
  const i = fs_extra_1.readFileSync(builtinChunks[e], { encoding: "utf8" });
  effect_compiler_1.addChunk(h, i);
}
class EffectHeaderImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.6";
  }
  get name() {
    return "effect-header";
  }
  get assetType() {
    return "";
  }
  get migrations() {
    return migrations;
  }
  async import(e) {
    try {
      var t = this.assetDB.options.target;

      var r = path_1
        .relative(path_1.join(t, "chunks"), path_1.dirname(e.source))
        .replace(/\\/g, "/");

      var i =
        r +
        (r.length ? "/" : "") +
        path_1.basename(e.source, path_1.extname(e.source));

      var a = fs_extra_1.readFileSync(e.source, { encoding: "utf-8" });
      effect_compiler_1.addChunk(i, a);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
exports.EffectHeaderImporter = EffectHeaderImporter;
const migrations = [
  { version: "1.0.1", migrate: effect_1.migrateDefines },
  { version: "1.0.2", migrate: effect_1.migrateEnableDirShadow },
  { version: "1.0.3", migrate: effect_1.migrateIncludeDecodeBase },
  { version: "1.0.4", migrate: effect_1.migrateMacroUseLightMap },
  { version: "1.0.5", migrate: effect_1.migrateChunkFolders },
  { version: "1.0.6", migrate: effect_1.migrateCSMInclude },
];
