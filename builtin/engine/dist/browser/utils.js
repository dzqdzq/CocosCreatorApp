Object.defineProperty(exports, "__esModule", { value: true });
exports.compileEngine = compileEngine;
exports.compileCommonEngine = compileCommonEngine;
exports.getCCEnvConstants = getCCEnvConstants;
exports.registerI18n = registerI18n;
exports.rebuild = rebuild;
exports.rebuildImportMaps = rebuildImportMaps;

const { existsSync, statSync, readdirSync } = require("fs-extra");

const { join } = require("path");

const i18n = require("@base/electron-i18n");
const engineCompiler = require("../../static/engine-compiler/dist/index");
async function compileEngine(e, n) {
  return engineCompiler.compileEngine(e, n);
}
async function compileCommonEngine(e, n) {
  return engineCompiler.compileEngine(e, n, { isNativeScene: false });
}
function getCCEnvConstants(e) {
  return engineCompiler.getCCEnvConstants(e);
}
function registerI18n(e) {
  try {
    const r = join(e, "editor", "i18n");

    if (existsSync(r) && statSync(r).isDirectory()) {
      readdirSync(r).map((e) => {
        const i = join(r, e);
        var n;

        if (statSync(i).isDirectory()) {
          n = readdirSync(i).reduce((e, n) => {
            n = join(i, n);
            try {
              var r = require(n);

              if (e.ENGINE) {
                e.ENGINE = Object.assign(e.ENGINE, r);
              } else {
                e.ENGINE = r;
              }
            } catch (e) {}
            return e;
          }, {});

          i18n.register(n, e);
        }
      });
    }
  } catch (e) {
    if (e instanceof Error) {
      console.log("Load I18n files failed: " + e.message);
    }
  }
}
async function rebuild(e) {
  return engineCompiler.rebuild(e);
}
async function rebuildImportMaps() {
  return engineCompiler.rebuildImportMaps();
}
