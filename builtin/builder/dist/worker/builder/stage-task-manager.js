Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildStageTask = undefined;

const { join } = require("path");

const {
  existsSync,
  readJSONSync,
  emptyDirSync,
  outputJSON,
} = require("fs-extra");

const sub_process_manager_1 = require("../worker-pools/sub-process-manager");
const task_base_1 = require("./manager/task-base");
const global_1 = require("../../share/global");
const tempDir = join(Editor.Project.tmpDir, "builder", "compile");
class BuildStageTask extends task_base_1.BuildTaskBase {
  options;
  buildTaskOptions;
  hooksInfo;
  root;
  hookMap;
  constructor(t, o) {
    super(t, o.name);
    this.hooksInfo = o.hooksInfo;
    this.root = o.root;

    if (o.buildTaskOptions) {
      this.buildTaskOptions = o.buildTaskOptions;
    }

    t = o.name[0].toUpperCase() + o.name.slice(1, o.name.length);
    this.hookMap = {
      ["onBefore" + t]: "onBefore" + t,
      [this.name]: this.name,
      ["onAfter" + t]: "onAfter" + t,
    };
  }
  init() {
    var o = join(this.root, global_1.BuildGlobalInfo.buildOptionsFileName);
    try {
      if (existsSync(o)) {
        this.options = readJSONSync(o);

        console.debug(
          `Use build file ${global_1.BuildGlobalInfo.buildOptionsFileName} in root(${this.root})`
        );
      }
    } catch (t) {
      console.debug(`Get cache build options form ${o} failed!`);
    }

    if (!this.options && this.buildTaskOptions) {
      this.options = this.buildTaskOptions;
    }

    if (!this.options) {
      throw new Error(
        `Get cache build options form ${o} failed! Please recompile the build task again.`
      );
    }
  }
  async run() {
    var t = `// ---- builder:run-build-stage-${this.name} ----`;
    console.debug(t);
    Editor.Metrics.trackTimeStart(t);
    this.init();
    this.updateProcess("init options success", 0.1);
    emptyDirSync(tempDir);
    try {
      for (const o of Object.keys(this.hookMap)) {
        await this.runPluginTask(o);
      }
    } catch (t) {
      this.error = t;
    }
    await Editor.Metrics.trackTimeEnd(t, { output: true });

    if (this.error) {
      throw this.error;
    }

    return true;
  }
  break(t) {
    sub_process_manager_1.workerManager.killRunningChilds();
    super.break(t);
  }
  async handleHook(t, o) {
    if (o) {
      await t.call(this, this.root, this.options);
    } else {
      await t(this.root, this.options);
    }
  }
  async saveOptions() {
    await outputJSON(
      join(this.root, global_1.BuildGlobalInfo.buildOptionsFileName),
      this.options
    );
  }
}
exports.BuildStageTask = BuildStageTask;
