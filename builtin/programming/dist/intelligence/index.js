var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.realTsConfigPath = undefined;
exports.getInternalCompilerOptions = getInternalCompilerOptions;
exports.getInternalDbURLInfos = getInternalDbURLInfos;
exports.updateCustomMacro = updateCustomMacro;
exports.generateCommonTsConfig = generateCommonTsConfig;
const typescript_1 = __importDefault(require("typescript"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));

const { getDatabaseModuleRootURL } = require("../utils/db-module-url");

const ccbuild_1 = require("@cocos/ccbuild");

exports.realTsConfigPath = path_1.default.join(
  Editor.Project.path,
  "tsconfig.json"
);

const tempDirPath = path_1.default.join(Editor.Project.path, "temp");

const configFilePath = path_1.default.join(tempDirPath, "tsconfig.cocos.json");
const declarationHomePath = path_1.default.join(tempDirPath, "declarations");
async function updateCustomMacroJS() {
  var t = path_1.default.join(tempDirPath, "programming/custom-macro.js");
  await fs_extra_1.default.outputFile(t, await generateCustomMacroJSFile(), {
    encoding: "utf8",
  });
}
const internalDbURLInfos = [];
const internalTsConfig = {};
async function getInternalCompilerOptions() {
  if (Object.keys(internalTsConfig).length === 0) {
    generateCommonTsConfig();
  }

  return internalTsConfig;
}
async function getInternalDbURLInfos() {
  var t;

  if (internalDbURLInfos.length === 0) {
    t = await getDbURLInfos();
    internalDbURLInfos.length = 0;
    internalDbURLInfos.push(...t);
  }

  return internalDbURLInfos;
}
async function updateCustomMacro() {
  var t = path_1.default.join(declarationHomePath, "cc.custom-macro.d.ts");

  await fs_extra_1.default.outputFile(
    t,
    await generateCustomMacroDeclarationFile(),
    { encoding: "utf8" }
  );

  await updateCustomMacroJS();
}
async function generateCommonTsConfig() {
  const a = [];
  var t = (t = []).length === 0 ? undefined : t;
  const n = {};

  await Promise.all([
    (async () => {
      var t = await Editor.Message.request("engine", "query-engine-info");
      var e = path_1.default.join(declarationHomePath, "cc.d.ts");

      await fs_extra_1.default.outputFile(
        e,
        generateEngineDeclarationFile(t.typescript.path),
        { encoding: "utf8" }
      );

      a.push(o(e));
    })(),
    (async () => {
      var t = await Editor.Message.request("engine", "query-engine-info");
      var e = path_1.default.join(declarationHomePath, "cc.env.d.ts");

      await fs_extra_1.default.outputFile(
        e,
        await generateEnvDeclarationFile(t.typescript.path),
        { encoding: "utf8" }
      );

      a.push(o(e));
    })(),
    (async () => {
      var t = path_1.default.join(declarationHomePath, "cc.custom-macro.d.ts");

      await fs_extra_1.default.outputFile(
        t,
        await generateCustomMacroDeclarationFile(),
        { encoding: "utf8" }
      );

      a.push(o(t));
    })(),
    (async () => {
      var t = await Editor.Message.request("engine", "query-engine-info");
      var e = path_1.default.join(declarationHomePath, "jsb.d.ts");

      await fs_extra_1.default.outputFile(
        e,
        generateJsbDeclarationFile(t.typescript.path),
        { encoding: "utf8" }
      );

      a.push(o(e));
    })(),
    (async () => {
      var t = await getDbURLInfos();
      internalDbURLInfos.length = 0;
      internalDbURLInfos.push(...t);
      for (var { dbURL, target } of t) {
        n[dbURL + "*"] = [path_1.default.join(target, "*")];
      }
    })(),
  ]);

  await updateCustomMacroJS();

  var e = {
    target: "ES2015",
    module: "ES2015",
    strict: true,
    types: a,
    libs: t,
    paths: n,
    experimentalDecorators: true,
    isolatedModules: true,
    moduleResolution: "node",
    noEmit: true,
    forceConsistentCasingInFileNames: true,
  };

  var t = {
    $schema: "https://json.schemastore.org/tsconfig",
    compilerOptions: e,
  };

  for (const r in e) {
    internalTsConfig[r] = e[r];
  }
  function o(t) {
    t = path_1.default.relative(
      path_1.default.dirname(exports.realTsConfigPath),
      t
    );

    t = (t.endsWith(".d.ts") ? t.substr(0, t.length - 5) : t).replace(
      /\\/g,
      "/"
    );

    return t.startsWith("./") || t.startsWith("../") ? t : "./" + t;
  }
  internalTsConfig.target = typescript_1.default.ScriptTarget.ES2015;
  internalTsConfig.module = typescript_1.default.ModuleKind.ES2015;
  internalTsConfig.moduleResolution =
    typescript_1.default.ModuleResolutionKind.NodeJs;
  await fs_extra_1.default.outputJson(configFilePath, t, { spaces: 2 });
}
async function getDbURLInfos() {
  var t = [];
  for (const a of await Editor.Message.request("asset-db", "query-db-infos")) {
    var e = getDatabaseModuleRootURL(a.name);
    t.push({ dbURL: e, target: a.target });
  }
  return t;
}
function generateEngineDeclarationFile(t) {
  const e = path_1.default.join(__dirname, "../../editor-export/");
  var a = (
    fs_extra_1.default.existsSync(e) ? fs_extra_1.default.readdirSync(e) : []
  )
    .map((t) => `/// <reference path="${path_1.default.join(e, t)}"/>`)
    .join("\n");
  return `
    /// <reference path="${path_1.default.join(
      t,
      "bin/.declarations/cc.d.ts"
    )}"/>
    ${a}
    /**
     * @deprecated Global variable \`cc\` was dropped since 3.0. Use ES6 module syntax to import Cocos Creator APIs.
     */
    declare const cc: never;
    `;
}
function generateJsbDeclarationFile(t) {
  return `/// <reference path="${path_1.default.join(t, "./@types/jsb.d.ts")}"/>
`;
}
async function generateEnvDeclarationFile(t) {
  return (await ccbuild_1.StatsQuery.create(t)).constantManager.genCCEnv();
}
async function generateCustomMacroDeclarationFile() {
  return `declare module "cc/userland/macro" {
${(await Editor.Profile.getProject("engine", "macroCustom"))
  .map((t) => `  ${""}export const ${t.key}: boolean;`)
  .join("\n")}
}
`;
}
async function generateCustomMacroJSFile() {
  return `System.register([], function (_export, _context) {      
    return {
        setters: [],
        execute: function () {
${(await Editor.Profile.getProject("engine", "macroCustom"))
  .map((t) => `_export("${t.key}", ${t.value});`)
  .join("\n")}
        }
    };
});
`;
}
