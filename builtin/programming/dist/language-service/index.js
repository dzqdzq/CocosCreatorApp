var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.LanguageServiceAdapter = undefined;
exports.LanguageServiceHostAdapter = undefined;
exports.ParseConfigFileHostAdapter = undefined;
exports.VirtualIOAdapter = undefined;

const { readFileSync, statSync, existsSync, writeFile } = require("fs-extra");

const { extname } = require("path");

const typescript_1 = __importDefault(require("typescript"));
const cache_1 = require("../shared/cache");
const command_1 = require("./command");

const { asserts } = require("../utils/asserts");

class VirtualIOAdapter {
  _fileCache = cache_1.assetInfoCache;
  constructor() {}
  readFile(t) {
    if (t !== LanguageServiceHostAdapter.defaultLibFileName) {
      var i = this.readCache(t);
      let e;
      if (i?.content) {
        e = i.content;
      } else {
        try {
          e = readFileSync(t, "utf8");
          var r = this._fileCache.get(t);

          asserts(r);
          var a = statSync(t).mtimeMs;

          this.writeCache({
            filePath: t,
            uuid: r.uuid,
            content: e,
            version: a.toString(),
          });
        } catch (e) {
          console.debug(e);
        }
      }
      return e;
    }
  }
  readCache(e) {
    return this._fileCache.get(e);
  }
  removeCache(e) {
    return this._fileCache.delete(e);
  }
  writeCache({ uuid, content, version, filePath }) {
    this._fileCache.set(filePath, {
      filePath: filePath,
      uuid: uuid,
      content: content,
      version: version,
    });
  }
  fileExists(e) {
    return existsSync(e);
  }
  getFileNames() {
    return Array.from(cache_1.assetInfoCache.keys());
  }
}
class ParseConfigFileHostAdapter extends (exports.VirtualIOAdapter =
  VirtualIOAdapter) {
  _currentDirectory;
  constructor(e) {
    super();
    this._currentDirectory = e;
  }
  getCurrentDirectory() {
    return this._currentDirectory;
  }
  useCaseSensitiveFileNames = true;
  readDirectory(e, t, i, r, a) {
    return this.getFileNames();
  }
  onUnRecoverableConfigFileDiagnostic(...e) {
    console.error(...e);
  }
}
exports.ParseConfigFileHostAdapter = ParseConfigFileHostAdapter;
class LanguageServiceHostAdapter extends VirtualIOAdapter {
  _parseConfigFileHost;
  _tsconfigPath;
  _currentDirectory;
  _compilerOptions;
  static defaultLibFileName = "__DEFAULT_LIB_FILE_NAME_IS_NEVER_EXIST.d.ts";
  constructor(e, t, i, r) {
    super();
    this._parseConfigFileHost = e;
    this._tsconfigPath = t;
    this._currentDirectory = i;
    this._compilerOptions = r;
  }
  getCompilationSettings() {
    return this._compilerOptions;
  }
  getScriptFileNames() {
    return this.getFileNames().slice();
  }
  getScriptVersion(e) {
    return this.readCache(e)?.version ?? "";
  }
  getScriptSnapshot(e) {
    e = this.readFile(e);
    return (
      (e && typescript_1.default.ScriptSnapshot.fromString(e)) || undefined
    );
  }
  getCurrentDirectory() {
    return this._currentDirectory;
  }
  getDefaultLibFileName(e) {
    return LanguageServiceHostAdapter.defaultLibFileName;
  }
  useCaseSensitiveFileNames() {
    return this._parseConfigFileHost.useCaseSensitiveFileNames;
  }
}
exports.LanguageServiceHostAdapter = LanguageServiceHostAdapter;
class LanguageServiceAdapter {
  _tsconfigPath;
  _currentDirectory;
  _beforeBuildDelegate;
  _compilerOptions;
  dbURLInfos;
  languageService;
  host;
  autoUpdateFileImport;
  _parseConfigFileHost;
  _awaitCommandQueue = [];
  _executingCommandID = "";
  _changedFileSet = new Set();
  _afterOutputTasks = [];
  constructor(e, t, i, r, a) {
    this._tsconfigPath = e;
    this._currentDirectory = t;
    this._beforeBuildDelegate = i;
    this._compilerOptions = r;
    this.dbURLInfos = a;
    this._parseConfigFileHost = new ParseConfigFileHostAdapter(t);

    this.host = new LanguageServiceHostAdapter(
      this._parseConfigFileHost,
      this._tsconfigPath,
      this._currentDirectory,
      this._compilerOptions
    );

    this.languageService = typescript_1.default.createLanguageService(
      this.host,
      undefined,
      typescript_1.default.LanguageServiceMode.Semantic
    );

    this._beforeBuildDelegate.add(async (e) => {
      e.forEach(
        (e) =>
          e.oldFilePath &&
          e.newFilePath &&
          this.requestRenameFile(e.oldFilePath, e.newFilePath)
      );

      await this.finishCommand(e);
    });
  }
  isExecuting(t) {
    return !(
      this._executingCommandID !== t &&
      !this._awaitCommandQueue.some((e) => e.command.id === t)
    );
  }
  get isBusy() {
    return Boolean(this._executingCommandID);
  }
  async executeCommand(i) {
    if (!this.isExecuting(i.id)) {
      if (this._executingCommandID) {
        await new Promise((e, t) => {
          this._awaitCommandQueue.push({ command: i, resolveAwait: e });
        });
      }

      this._executingCommandID = i.id;
      for (const t of (await i.execute(this)).values()) {
        this._changedFileSet.add(t);
      }
      const e = this._awaitCommandQueue.shift();
      if (e) {
        e.resolveAwait(undefined);
      } else {
        await this.outPutFiles(this._changedFileSet);
        this._executingCommandID = "";
        this._changedFileSet.clear();
        const e = this._awaitCommandQueue.shift();

        if (e) {
          e.resolveAwait(undefined);
        }
      }
    }
  }
  async requestRenameFile(e, t) {
    if (
      ((e && t && e.endsWith(".ts") && t.endsWith(".ts")) || !extname(e)) &&
      e !== t &&
      (this.autoUpdateFileImport === undefined &&
        (this.autoUpdateFileImport = await Editor.Profile.getConfig(
          "programming",
          "updateAutoUpdateImportConfig",
          "global"
        )),
      this.autoUpdateFileImport)
    ) {
      console.debug("Starting rename...");
      Editor.Metrics.trackTimeStart("programming:worker-rename");
      await this.executeCommand(new command_1.RenameCommand(e, t));
      Editor.Metrics.trackTimeEnd("programming:worker-rename", {
        output: true,
      });
      console.debug("Finish rename.");
    }
  }
  applyChanges(t, i) {
    for (let e = i.length - 1; e >= 0; e--) {
      var { span, newText } = i[e];
      t =
        "" +
        t.substring(0, span.start) +
        newText +
        t.substring(this.textSpanEnd(span));
    }
    return t;
  }
  async outPutFiles(e) {
    e = Array.from(e.values());
    for (
      await Promise.all(
        e.map(async (t) => {
          try {
            var e = this.host.readCache(t);

            if (e?.content) {
              await writeFile(t, e?.content, {
                encoding: "utf8",
              });

              await Editor.Message.send("asset-db", "refresh-asset", t);
            } else {
              console.debug("There's nothing in the cache");
            }
          } catch (e) {
            console.debug("Failed to update script " + t, e);
          }
        })
      );
      this._afterOutputTasks.length;

    ) {
      var t = this._afterOutputTasks.shift();

      if (t) {
        t();
      }
    }
    this.clearCache();
  }
  clearCache() {
    cache_1.assetInfoCache.forEach((e) => (e.content = undefined));
  }
  textSpanEnd(e) {
    return e.start + e.length;
  }
  async finishCommand(e) {
    return new Promise((e, t) => {
      if (this.isBusy) {
        this._afterOutputTasks.push(e);
      } else {
        e();
      }
    });
  }
}
exports.LanguageServiceAdapter = LanguageServiceAdapter;
