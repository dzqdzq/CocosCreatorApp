var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.querySharedSettings = querySharedSettings;
const fs_extra_1 = __importDefault(require("fs-extra"));

const { pathToFileURL } = require("url");

const { existsSync } = require("fs");

async function querySharedSettings(r) {
  var [e, t, o, i, s, l, a] = await Promise.all([
    Editor.Profile.getProject("project", "script.useDefineForClassFields"),
    Editor.Profile.getProject("project", "script.allowDeclareFields"),
    Editor.Profile.getProject("project", "script.loose"),
    false,
    Editor.Profile.getProject("project", "script.exportsConditions"),
    Editor.Profile.getProject("project", "script.importMap"),
    Editor.Profile.getProject("project", "script.preserveSymlinks"),
  ]);
  let n;
  if (l && l !== "project://") {
    var p = Editor.UI.__protected__.File.resolveToRaw(l);
    if (p && existsSync(p)) {
      try {
        var f = await fs_extra_1.default.readJson(p, { encoding: "utf8" });

        if (verifyImportMapJson(f)) {
          n = { json: f, url: pathToFileURL(p).href };
        } else {
          r.error("Ill-formed import map.");
        }
      } catch (e) {
        r.error(`Failed to load import map at ${l}: ` + e);
      }
    } else {
      r.warn("Import map file not found in: " + (p || l));
    }
  }
  return {
    useDefineForClassFields: e ?? true,
    allowDeclareFields: t ?? true,
    loose: o ?? false,
    exportsConditions: s ?? [],
    guessCommonJsExports: i ?? false,
    importMap: n,
    preserveSymlinks: a ?? false,
  };
}
function verifyImportMapJson(e) {
  if (typeof e != "object" || !e) {
    return false;
  }
  var r = (e) => {
    if (typeof e != "object" || !e) {
      return false;
    }
    for (const r of Object.values(e)) {
      if (typeof r != "string") {
        return false;
      }
    }
    return true;
  };
  if ("imports" in e && !r(e.imports)) {
    return false;
  }
  if ("scopes" in e) {
    for (const t of Object.values(e)) {
      if (!r(t)) {
        return false;
      }
    }
  }
  return true;
}
