Object.defineProperty(exports, "__esModule", { value: true });
exports.taskManager = undefined;
const global_1 = require("../../share/global");
class TaskManager {
  get debug() {
    return this._optionsDebug || global_1.BuildGlobalInfo.debugMode;
  }
  _optionsDebug = false;
  tasks = {
    dataTasks: ["data-task/asset", "data-task/script"],
    buildTasks: ["build-task/script", "build-task/asset"],
    md5Tasks: ["postprocess-task/suffix"],
    settingTasks: [
      "setting-task/asset",
      "setting-task/script",
      "setting-task/options",
    ],
    postprocessTasks: ["postprocess-task/template"],
  };
  pluginTasks = {
    onBeforeBuild: "onBeforeBuild",
    onBeforeInit: "onBeforeInit",
    onAfterInit: "onAfterInit",
    onBeforeBuildAssets: "onBeforeBuildAssets",
    onAfterBuildAssets: "onAfterBuildAssets",
    onBeforeCompressSettings: "onBeforeCompressSettings",
    onAfterCompressSettings: "onAfterCompressSettings",
    onAfterBuild: "onAfterBuild",
    onBeforeCopyBuildTemplate: "onBeforeCopyBuildTemplate",
    onAfterCopyBuildTemplate: "onAfterCopyBuildTemplate",
    onError: "onError",
  };
  cacheConfig = { engine: true, settings: false };
  taskWeight = {
    dataTasks: 0.1,
    buildTasks: 0.1,
    md5Tasks: 0.1,
    settingTasks: 0.05,
    postprocessTasks: 0.05,
    pluginTasks: 0.2,
    bundleTask: 0.3,
  };
  debugTaskConfig = { dataTasks: {}, settingTasks: {}, buildTasks: {} };
  async init() {
    this.debugTaskConfig.settingTasks["setting-task/cache"] = false;
    this._optionsDebug = false;
    var s = await Editor.Profile.getConfig("builder", "debug-tools.config");

    if (s && s.config) {
      Object.assign(this.debugTaskConfig, s.config);
    }

    if (s && s.cacheConfig) {
      Object.assign(this.cacheConfig, s.cacheConfig);
    }
  }
  getTaskHandle(s) {
    if (this.debug) {
      const e = this.debugTaskConfig[s];
      const t = [];

      this.tasks[s].forEach((s) => {
        if (e[s] !== false) {
          t.push(require("./" + s));
        }
      });

      return t;
    }
    return this.tasks[s].map((s) => require("./tasks/" + s));
  }
  getTaskHandleFromNames(s) {
    return s.map((s) => require("./tasks/" + s));
  }
  setDebugConfig(s, e, t) {
    if (this.debugTaskConfig[s] && e) {
      this.debugTaskConfig[s][e] = t;
    }
  }
  setRecompileTask(s) {
    if (s && s.enable && !global_1.BuildGlobalInfo.debugMode) {
      this._optionsDebug = true;
      const { generateAssets, generateScripts, generateEngineByCache } = s;
      this.cacheConfig.engine = generateEngineByCache;
      this.setDebugConfig("dataTasks", "data-task/script", generateScripts);
      this.setDebugConfig("buildTasks", "build-task/script", generateScripts);
      this.setDebugConfig(
        "settingTasks",
        "setting-task/script",
        generateScripts
      );

      this.tasks.buildTasks.forEach((s) => {
        if (!["build-task/script"].includes(s)) {
          exports.taskManager.setDebugConfig(
            "buildTasks",
            "" + s,
            generateAssets
          );
        }
      });

      this.setDebugConfig("settingTasks", "setting-task/scene", generateAssets);
      this.setDebugConfig("settingTasks", "setting-task/group", generateAssets);
      this.setDebugConfig("settingTasks", "setting-task/md5", generateAssets);
      this.setDebugConfig(
        "settingTasks",
        "setting-task/cache",
        !generateScripts || !generateAssets
      );
    }
  }
}
exports.taskManager = new TaskManager();
