var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackerDriver = undefined;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const url_1 = require("url");

const { pathToFileURL, fileURLToPath } = url_1;

const perf_hooks_1 = require("perf_hooks");
const prerequisite_imports_1 = require("./prerequisite-imports");
const utils_1 = require("@editor/lib-programming/dist/utils");
const ccbuild_1 = require("@cocos/ccbuild");

const { asserts } = require("../utils/asserts");

const { querySharedSettings } = require("../shared/query-shared-settings");

const quick_pack_1 = require("@cocos/creator-programming-quick-pack/lib/quick-pack");
const mod_lo_1 = require("@cocos/creator-programming-mod-lo/lib/mod-lo");
const asset_db_interop_1 = require("./asset-db-interop");
const logger_1 = require("./logger");
const language_service_1 = require("../language-service");
const intelligence_1 = require("../intelligence");

const { getInternalCompilerOptions, getInternalDbURLInfos } = intelligence_1;

const delegate_1 = require("../utils/delegate");
const json5_1 = __importDefault(require("json5"));
const minimatch_1 = __importDefault(require("minimatch"));

const { existsSync } = require("fs");

const VERSION = "20";
const featureUnitModulePrefix = "cce:/internal/x/cc-fu/";
const useEditorFolderFeature = false;
function matchPattern(e, t) {
  return (0, minimatch_1.default)(e.replace(/\\/g, "/"), t.replace(/\\/g, "/"));
}
async function getEditorPatterns() {
  var e = [];
  for (const r of await Editor.Message.request("asset-db", "query-db-list")) {
    var t = await Editor.Message.request("asset-db", "query-db-info", r);
    var t = path_1.default.join(t.target, "**", "editor", "**/*");
    e.push(t);
  }
  return e;
}
function getCCEModuleIDs(e) {
  return Object.keys(e).filter((e) => e !== "mapLocation");
}
async function wrapToSetImmediateQueue(r, i, ...s) {
  return new Promise((e, t) => {
    setImmediate(() => {
      try {
        e(i.apply(r, s));
      } catch (e) {
        t(e);
      }
    });
  });
}
class PackerDriver {
  languageService;
  static async create() {
    PackerDriver._cceModuleMap = PackerDriver.queryCCEModuleMap();

    var t = path_1.default.join(
      Editor.Project.tmpDir,
      "programming",
      "packer-driver"
    );

    var a_browsersListTargets = path_1.default.join(t, "VERSION");
    var r = path_1.default.join(t, "targets");
    var t = path_1.default.join(t, "logs", "debug.log");
    var i = {};
    if (await fs_extra_1.default.pathExists(t)) {
      try {
        await fs_extra_1.default.unlink(t);
      } catch (e) {
        console.warn("Failed to reset log file: " + t);
      }
    }
    var s;
    var a;
    var o = new logger_1.PackerDriverLogger(t);

    o.debug(new Date().toLocaleString());
    o.debug("Project: " + Editor.Project.path);
    o.debug("Targets: " + Object.keys(predefinedTargets));
    var n = await PackerDriver._createIncrementalRecord(o);
    await PackerDriver._validateIncrementalRecord(
      n,
      a_browsersListTargets,
      r,
      o
    );

    var u = {
      "cce:/internal/code-quality/": pathToFileURL(
        path_1.default.join(
          __dirname,
          "..",
          "..",
          "static",
          "builtin-mods",
          "code-quality",
          "/"
        )
      ).href,
    };

    var t = (
      await Editor.Message.request(
        "engine",
        "query-engine-info",
        Editor.Project.__protected__.type
      )
    ).typescript.path;

    o.debug("Engine path: " + t);
    var c = await ccbuild_1.StatsQuery.create(t);
    var d = c.evaluateIndexModuleSource([]);

    var l = {
      moduleRequestFilter: [/^cc\.?.*$/g],
      reporter: {
        moduleName: "cce:/internal/code-quality/cr.mjs",
        functionName: "report",
      },
    };

    for ([s, a] of Object.entries(predefinedTargets)) {
      o.debug(`Initializing target [${a.name}]`);
      var _ = [
        "cc/env",
        "cc/userland/macro",
        ...getCCEModuleIDs(PackerDriver._cceModuleMap),
      ];
      _.push(
        ...c.getFeatureUnits().map((e) => "" + featureUnitModulePrefix + e)
      );
      let a_browsersListTargets = a.browsersListTargets;

      if (s === "preview" && n.config.previewTarget) {
        a_browsersListTargets = n.config.previewTarget;
        o.debug(
          "Use specified preview browserslist target: " + a_browsersListTargets
        );
      }

      var g = new mod_lo_1.ModLo({
        targets: a_browsersListTargets,
        loose: n.config.loose,
        guessCommonJsExports: n.config.guessCommonJsExports,
        useDefineForClassFields: n.config.useDefineForClassFields,
        allowDeclareFields: n.config.allowDeclareFields,
        cr: l,
        _compressUUID(e) {
          return Editor.Utils.UUID.compressUUID(e, false);
        },
        logger: o,
        checkObsolete: true,
        importRestrictions: PackerDriver._importRestrictions,
        preserveSymlinks: n.config.preserveSymlinks,
      });

      var _ =
        (g.setExtraExportsConditions(n.config.exportsConditions),
        g.setExternals(_),
        g.setLoadMappings(u),
        path_1.default.join(r, s));

      var p = Editor.Project.path;

      var p = new quick_pack_1.QuickPack({
        modLo: g,
        origin: p,
        workspace: _,
        logger: o,
        verbose: true,
      });

      o.debug("Loading cache");
      var _ = perf_hooks_1.performance.now();
      await p.loadCache();
      var h = perf_hooks_1.performance.now();
      o.debug(`Loading cache costs ${h - _}ms.`);
      let t;
      t = a.isEditor
        ? ((h = await PackerDriver._getEngineFeaturesShippedInEditor(c)),
          o.debug("Engine features shipped in editor: " + h),
          {
            source: PackerDriver._getEngineIndexModuleSource(c, h),
            respectToFeatureSetting: false,
          })
        : { source: d, respectToFeatureSetting: true };
      _ = p.createLoaderContext();
      i[s] = new PackTarget({
        name: s,
        modLo: g,
        sourceMaps: a.sourceMaps,
        quickPack: p,
        quickPackLoaderContext: _,
        logger: o,
        engineIndexModule: t,
        tentativePrerequisiteImportsMod: a.isEditor ?? false,
        userImportMap: n.config.importMap
          ? {
              json: n.config.importMap.json,
              url: new url_1.URL(n.config.importMap.url),
            }
          : undefined,
      });
    }
    return new PackerDriver(
      i,
      c,
      o,
      await getInternalCompilerOptions(),
      await getInternalDbURLInfos()
    );
  }
  static async updateImportRestrictions() {
    if (useEditorFolderFeature) {
      var t = await Editor.Message.request("asset-db", "query-db-infos");
      var PackerDriver_importRestrictions = PackerDriver._importRestrictions;
      PackerDriver_importRestrictions.length = 0;
      var i = await getEditorPatterns();
      i.push(...getCCEModuleIDs(PackerDriver._cceModuleMap));
      for (let e = 0; e < t.length; ++e) {
        var s = t[e];
        var a = path_1.default.join(s.target, "**/*");
        var s = path_1.default.join(s.target, "**", "editor", "**/*");
        PackerDriver_importRestrictions[e] = {
          importerPatterns: [a, "!" + s],
          banSourcePatterns: i,
        };
      }
    }
  }
  static queryCCEModuleMap() {
    var e = path_1.default.join(__dirname, "../../cce-module.jsonc");
    var t = json5_1.default.parse(fs_extra_1.default.readFileSync(e, "utf8"));
    t.mapLocation = e;
    return t;
  }
  beforeEditorBuildDelegate = new delegate_1.AsyncDelegate();
  busy() {
    return this._asyncIteration.busy();
  }
  async mountDatabase(e) {
    (await this._assetDbInterop.onMountDatabase(e)).forEach((e) => {
      this._assetChangeQueue.push({
        type: asset_db_interop_1.AssetChangeType.add,
        filePath: e.filePath,
        uuid: e.uuid,
        isPluginScript: e.isPluginScript,
        url: e.url,
      });
    });

    await PackerDriver.updateImportRestrictions();
  }
  async unmountDatabase(e) {
    (await this._assetDbInterop.onUnmountDatabase(e)).forEach((e) => {
      this._assetChangeQueue.push({
        type: asset_db_interop_1.AssetChangeType.remove,
        filePath: e.filePath,
        uuid: e.uuid,
        isPluginScript: e.isPluginScript,
        url: e.url,
      });
    });

    await PackerDriver.updateImportRestrictions();
  }
  async resetDatabases(e = true) {
    const t = await this._assetDbInterop.queryAssetDomains();
    this._logger.debug(
      "Reset databases. Enumerated domains: " + JSON.stringify(t, undefined, 2)
    );
    var r = () => {
      for (const e of Object.values(this._targets)) {
        e.setAssetDatabaseDomains(t);
      }
    };

    if (e) {
      this._triggerNextBuild(r);
    } else {
      r();
    }
  }
  async pullAssetDb() {
    var e = this._logger;
    e.debug("Pulling asset-db.");
    var t = perf_hooks_1.performance.now();
    await this._fetchAll();
    var r = perf_hooks_1.performance.now();
    e.debug(`Fetch asset-db cost: ${r - t}ms.`);
    await this._waitForBuild();
  }
  async clearCache() {
    if (this._clearing) {
      this._logger.debug(
        "Failed to clear cache: previous clearing have not finished yet."
      );
    } else if (this.busy()) {
      this._logger.error(
        "Failed to clear cache: the building is still working in progress."
      );
    } else {
      this._clearing = true;
      for (var [e, t] of Object.entries(this._targets)) {
        this._logger.debug("Clear cache of target " + e);
        await t.clearCache();
      }
      this._logger.debug("Request build after clearing...");
      this._dispatchBuildRequest();
      this._clearing = false;
    }
  }
  getQuickPackLoaderContext(e) {
    this._warnMissingTarget(e);

    if (e in this._targets) {
      return this._targets[e].quickPackLoaderContext;
    }
  }
  isReady(e) {
    this._warnMissingTarget(e);

    if (e in this._targets) {
      return this._targets[e].ready;
    }
  }
  queryScriptDeps(e) {
    this._transformDepsGraph();
    return this._depsGraphCache[e] ? Array.from(this._depsGraphCache[e]) : [];
  }
  queryScriptUsers(e) {
    this._transformDepsGraph();
    return this._usedGraphCache[e] ? Array.from(this._usedGraphCache[e]) : [];
  }
  async shutDown() {
    await this.destroyed();
  }
  _clearing = false;
  _targets = {};
  _logger;
  _statsQuery;
  _asyncIteration;
  _assetDbInterop;
  _assetChangeQueue = [];
  _featureChanged = false;
  _beforeBuildTasks = [];
  _broadcastListenerMap = {};
  _depsGraph = {};
  _needUpdateDepsCache = false;
  _usedGraphCache = {};
  _depsGraphCache = {};
  static _cceModuleMap;
  static _importRestrictions = [];
  _init = false;
  constructor(e, t, r, i, s) {
    this._targets = e;
    this._statsQuery = t;
    this._logger = r;

    this.languageService = new language_service_1.LanguageServiceAdapter(
      intelligence_1.realTsConfigPath,
      Editor.Project.path,
      this.beforeEditorBuildDelegate,
      i,
      s
    );

    this._assetDbInterop = new asset_db_interop_1.AssetDbInterop(
      this._onSomeAssetChangesWereMade.bind(this)
    );

    this._asyncIteration = new AsyncIterationConcurrency1(async () =>
      this._startBuildIteration()
    );
  }
  async init() {
    if (!this._init) {
      this._init = true;

      this._broadcastListenerMap[
        "engine:engine-modules-global-config-changed"
      ] = () => this._onEngineFeaturesChanged();

      Object.keys(this._broadcastListenerMap).forEach((e) =>
        Editor.Message.__protected__.addBroadcastListener(
          e,
          this._broadcastListenerMap[e]
        )
      );

      await this._assetDbInterop.init();
      await this._syncEngineFeatures();
    }
  }
  async destroyed() {
    this._init = false;

    Object.keys(this._broadcastListenerMap).forEach((e) =>
      Editor.Message.__protected__.removeBroadcastListener(
        e,
        this._broadcastListenerMap[e]
      )
    );

    this._broadcastListenerMap = {};
    await this._assetDbInterop.destroyed();
  }
  _warnMissingTarget(e) {
    if (!(e in this._targets)) {
      console.warn(
        `Invalid pack target: ${e}. Existing targets are: ` +
          Object.keys(this._targets)
      );
    }
  }
  _onSomeAssetChangesWereMade(e) {
    this._logger.debug(
      `Dispatch build request for time accumulated ${e.length} asset changes.`
    );

    this._assetChangeQueue.push(...e);
    this._dispatchBuildRequest();
  }
  async _onEngineFeaturesChanged() {
    this._featureChanged = true;
    this._dispatchBuildRequest();
  }
  async _startBuildIteration() {
    Editor.Metrics.trackTimeStart("programming:compile-start");
    Editor.Message.broadcast("programming:compile-start", "project");
    this._logger.clear();

    this._logger.debug(
      "Build iteration starts.\n" +
        `Number of accumulated asset changes: ${this._assetChangeQueue.length}
` +
        "Feature changed: " +
        this._featureChanged
    );

    if (this._featureChanged) {
      this._featureChanged = false;
      await this._syncEngineFeatures();
    }

    var e = this._assetChangeQueue;
    this._assetChangeQueue = [];
    var t = this._beforeBuildTasks.slice();
    this._beforeBuildTasks.length = 0;
    for (const a of t) {
      a();
    }
    try {
      await this.beforeEditorBuildDelegate.dispatch(
        e.filter((e) => e.type === asset_db_interop_1.AssetChangeType.modified)
      );
    } catch (e) {
      console.debug(e);
    }
    var r;

    var i = e.filter((e) => !e.filePath.endsWith(".d.ts"));

    for ([, r] of Object.entries(this._targets)) {
      if (e.length !== 0) {
        await r.applyAssetChanges(i);
      }

      var s = await r.build();
      this._depsGraph = s.depsGraph;
      this._needUpdateDepsCache = true;
    }
    Editor.Message.broadcast("programming:compiled", "project");
    Editor.Metrics.trackTimeEnd("programming:compile-start");
  }
  async _waitForBuild() {
    return this._asyncIteration.nextIteration();
  }
  _dispatchBuildRequest() {
    this._asyncIteration.nextIteration();
  }
  static async _createIncrementalRecord(t) {
    var e = await querySharedSettings(t);
    var e = { version: VERSION, config: { ...e } };

    var r = await Editor.Profile.getProject(
      "project",
      "script.previewBrowserslistConfigFile"
    );

    if (r && r !== "project://") {
      var i;
      var s = Editor.UI.__protected__.File.resolveToRaw(r);
      try {
        if (s && existsSync(s)) {
          if ((i = await readBrowserslistTarget(s))) {
            e.config.previewTarget = i;
          }
        } else {
          t.warn("Preview target config file not found. " + (s || r));
        }
      } catch (e) {
        t.error(`Failed to load preview target config file at ${s || r}: ` + e);
      }
    }
    return e;
  }
  static async _validateIncrementalRecord(e, t, r, i) {
    let s = false;
    try {
      var a = await fs_extra_1.default.readJson(t);

      if ((s = matchObject(e, a))) {
        i.debug("Incremental file seems great.");
      } else {
        i.debug(
          "[PackerDriver] Options doesn't match.\n" +
            `Last: ${JSON.stringify(e, undefined, 2)}
  ` +
            "Current: " +
            JSON.stringify(a, undefined, 2)
        );
      }
    } catch (e) {
      i.debug("Packer deriver version file lost or format incorrect: " + e);
    }

    if (!s) {
      i.debug("Clearing out the targets...");
      await fs_extra_1.default.emptyDir(r);
      await fs_extra_1.default.outputJson(t, e, { spaces: 2 });
    }

    return s;
  }
  async _fetchAll() {
    var e = await this._assetDbInterop.fetchAll();
    this._assetChangeQueue.push(...e);
  }
  static async _getEngineFeaturesShippedInEditor(e) {
    return e.getFeatures();
  }
  async _syncEngineFeatures() {
    var e;

    var t =
      (await Editor.Message.request("engine", "query-engine-modules-profile"))
        ?.includeModules ?? [];

    this._logger.debug("Sync engine features: " + t);
    var r = PackerDriver._getEngineIndexModuleSource(this._statsQuery, t);

    for ([, e] of Object.entries(this._targets)) {
      if (e.respectToEngineFeatureSetting) {
        e.setEngineIndexModuleSource(r);
      }
    }
  }
  static _getEngineIndexModuleSource(e, t) {
    t = e.getUnitsOfFeatures(t);
    return e.evaluateIndexModuleSource(
      t,
      (e) => "" + featureUnitModulePrefix + e
    );
  }
  async _triggerNextBuild(e) {
    this._beforeBuildTasks.push(e);
    this._dispatchBuildRequest();
  }
  _transformDepsGraph() {
    if (this._needUpdateDepsCache) {
      this._needUpdateDepsCache = false;
      var e;
      var t;
      var r = {};
      var i = {};
      for ([e, t] of Object.entries(this._depsGraph)) {
        if (e.startsWith("file://")) {
          var s;
          var a = fileURLToPath(e);

          if (!r[a]) {
            r[a] = new Set();
          }

          for (const o of t) {
            if (o.startsWith("file://")) {
              s = fileURLToPath(o);
              r[a].add(s);
              i[s] || (i[s] = new Set());
              i[s].add(a);
            }
          }
        }
      }
      this._usedGraphCache = i;
      this._depsGraphCache = r;
    }
  }
}
exports.PackerDriver = PackerDriver;
const engineIndexModURL = "cce:/internal/x/cc";
const DEFAULT_PREVIEW_BROWSERS_LIST_TARGET = "supports es6-module";

const predefinedTargets = {
  editor: {
    name: "Editor",
    browsersListTargets: utils_1.editorBrowserslistQuery,
    sourceMaps: "inline",
    isEditor: true,
  },
  preview: {
    name: "Preview",
    sourceMaps: true,
    browsersListTargets: DEFAULT_PREVIEW_BROWSERS_LIST_TARGET,
  },
};

async function readBrowserslistTarget(e) {
  let t;
  try {
    t = await fs_extra_1.default.readFile(e, "utf8");
  } catch (e) {
    return;
  }
  e = ((e) => {
    var t = [];
    for (const i of e.split("\n")) {
      var r = i.indexOf("#");
      var r = (r < 0 ? i : i.substr(0, r)).trim();

      if (r.length !== 0) {
        t.push(r);
      }
    }
    return t;
  })(t);
  if (e.length !== 0) {
    return e.join(" or ");
  }
}
const OPTIMIZE_ENTRY_SOURCE_COMPILATION = false;
class PackTarget {
  constructor(e) {
    this._name = e.name;
    this._modLo = e.modLo;
    this._quickPack = e.quickPack;
    this._quickPackLoaderContext = e.quickPackLoaderContext;
    this._sourceMaps = e.sourceMaps;
    this._logger = e.logger;
    this._respectToFeatureSetting = e.engineIndexModule.respectToFeatureSetting;
    this._tentativePrerequisiteImportsMod = e.tentativePrerequisiteImportsMod;
    this._userImportMap = e.userImportMap;
    var t = this._modLo;

    this._entryMod = t.addMemoryModule(
      prerequisite_imports_1.prerequisiteImportsModURL,
      (this._tentativePrerequisiteImportsMod
        ? prerequisite_imports_1.makeTentativePrerequisiteImports
        : prerequisite_imports_1.makePrerequisiteImportsMod)([])
    );

    this._entryModSource = this._entryMod.source;

    this._engineIndexMod = t.addMemoryModule(
      engineIndexModURL,
      e.engineIndexModule.source
    );

    this.setAssetDatabaseDomains([]);
  }
  get quickPackLoaderContext() {
    return this._quickPackLoaderContext;
  }
  get ready() {
    return this._ready;
  }
  get respectToEngineFeatureSetting() {
    return this._respectToFeatureSetting;
  }
  async build() {
    this._ensureIdle();
    this._buildStarted = true;
    var e = this._name;
    Editor.Message.broadcast("programming:pack-build-start", e);
    Editor.Metrics.trackTimeStart("programming:pack-build-start-" + e);
    this._logger.debug(`Target(${e}) build started.`);
    let t;
    var r = perf_hooks_1.performance.now();
    try {
      var i = await this._getPrerequisiteAssetModsWithFilter();

      const s = [
        engineIndexModURL,
        prerequisite_imports_1.prerequisiteImportsModURL,
        ...i,
      ];

      const a = this._cleanResolutionNextTime;

      if (a) {
        this._cleanResolutionNextTime = false;
      }

      if (a) {
        console.debug("This build will perform a clean module resolution.");
      }

      await wrapToSetImmediateQueue(this, async () => {
        t = await this._quickPack.build(s, {
          retryResolutionOnUnchangedModule: this._firstBuild,
          cleanResolution: a,
        });
      });

      this._firstBuild = false;
    } catch (e) {
      this._logger.error(e + ", stack: " + e.stack);
    }
    i = perf_hooks_1.performance.now();
    this._logger.debug(`Target(${e}) ends with cost ${i - r}ms.`);
    this._ready = true;
    Editor.Message.broadcast("programming:pack-build-end", e);
    Editor.Metrics.trackTimeEnd("programming:pack-build-start-" + e);
    this._buildStarted = false;

    return (
      t ||
      (console.warn("Cannot get build result from quick pack."),
      { depsGraph: {} })
    );
  }
  async clearCache() {
    this._quickPack.clear();
    this._firstBuild = true;
  }
  async applyAssetChanges(e) {
    this._ensureIdle();
    for (const i of e) {
      var t;
      var i_uuid = i.uuid;

      if (
        i.type === asset_db_interop_1.AssetChangeType.modified ||
        i.type === asset_db_interop_1.AssetChangeType.remove
      ) {
        if ((t = this._uuidURLMap.get(i_uuid))) {
          this._uuidURLMap.delete(i_uuid);
          this._modLo.unsetUUID(t);

          this._prerequisiteAssetMods.delete(t) ||
            this._logger.warn(`Unexpected: ${t} is not in registry.`);
        }
      }

      if (
        (i.type === asset_db_interop_1.AssetChangeType.modified ||
          i.type === asset_db_interop_1.AssetChangeType.add) &&
        !i.isPluginScript
      ) {
        t = i.url.href;
        this._uuidURLMap.set(i_uuid, t);
        this._modLo.setUUID(t, i_uuid);
        this._prerequisiteAssetMods.add(t);
      }
    }
    e = await this._getPrerequisiteAssetModsWithFilter();

    e = (
      this._tentativePrerequisiteImportsMod
        ? prerequisite_imports_1.makeTentativePrerequisiteImports
        : prerequisite_imports_1.makePrerequisiteImportsMod
    )(e);

    console.time("update entry mod");

    if (
      !OPTIMIZE_ENTRY_SOURCE_COMPILATION ||
      this._entryModSource.length !== e.length ||
      this._entryModSource !== e
    ) {
      this._entryModSource = this._entryMod.source = e;
    }

    console.timeEnd("update entry mod");
  }
  setEngineIndexModuleSource(e) {
    this._ensureIdle();
    this._engineIndexMod.source = e;
  }
  setAssetDatabaseDomains(e) {
    this._ensureIdle();
    var t = this._userImportMap;
    var r = {};
    var i = t ? t.url : new url_1.URL("foo:/bar");
    r.imports = {};
    r.imports.cc = engineIndexModURL;
    var s = [];
    for (const c of e) {
      var a = pathToFileURL(
        path_1.default.join(c.physical, path_1.default.join(path_1.default.sep))
      ).href;
      r.imports[c.root.href] = a;
      s.push(a);
    }
    if (
      t &&
      (t.json.imports && (r.imports = { ...r.imports, ...t.json.imports }),
      t.json.scopes)
    ) {
      for (var [o, n] of Object.entries(t.json.scopes)) {
        var u = (r.scopes ??= {});
        u[o] = { ...(u[o] ?? {}), ...n };
      }
    }
    this._logger.debug(
      `Our import map(${i}): ` + JSON.stringify(r, undefined, 2)
    );
    this._modLo.setImportMap(r, i);
    this._modLo.setAssetPrefixes(s);
    this._cleanResolutionNextTime = true;
  }
  _buildStarted = false;
  _ready = false;
  _name;
  _engineIndexMod;
  _entryMod;
  _entryModSource = "";
  _modLo;
  _sourceMaps;
  _quickPack;
  _quickPackLoaderContext;
  _prerequisiteAssetMods = new Set();
  _uuidURLMap = new Map();
  _logger;
  _firstBuild = true;
  _cleanResolutionNextTime = true;
  _respectToFeatureSetting;
  _tentativePrerequisiteImportsMod;
  _userImportMap;
  async _getPrerequisiteAssetModsWithFilter() {
    let e = Array.from(this._prerequisiteAssetMods).sort();
    if (useEditorFolderFeature && this._name !== "editor") {
      const r = await getEditorPatterns();
      e = Array.from(e).filter((e) => {
        const t = e.startsWith("file:") ? fileURLToPath(e) : e;
        return !r.some((e) => (0, minimatch_1.default)(t, e));
      });
    }
    return e;
  }
  _ensureIdle() {
    asserts(
      !this._buildStarted,
      "Build is in progress, but a status change request is filed"
    );
  }
}
class AsyncIterationConcurrency1 {
  _iterate;
  _executionPromise = null;
  _pendingPromise = null;
  constructor(e) {
    this._iterate = e;
  }
  busy() {
    return !!this._executionPromise || !!this._pendingPromise;
  }
  nextIteration() {
    if (this._executionPromise) {
      if (!this._pendingPromise) {
        return (this._pendingPromise = this._executionPromise.finally(() => {
          this._pendingPromise = null;
          return this.nextIteration();
        }));
      }
    }

    return (this._executionPromise = Promise.resolve(this._iterate()).finally(
      () => {
        this._executionPromise = null;
      }
    ));
  }
}
function matchObject(e, t) {
  return (function r(t, i) {
    return Array.isArray(t)
      ? Array.isArray(i) &&
          t.length === i.length &&
          t.every((e, t) => r(e, i[t]))
      : typeof t == "object" && t !== null
      ? typeof i == "object" &&
        i !== null &&
        Object.keys(t).every((e) => r(t[e], i[e]))
      : t === null
      ? i === null
      : t === i;
  })(e, t);
}
